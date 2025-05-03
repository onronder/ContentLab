import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { createClient } from '@/lib/supabase/server';

// Types for managing region scaling
interface RegionStatus {
  region: string;
  traffic: number;
  activeWorkers: number;
  maxWorkers: number;
  lastScaled: Date;
}

/**
 * Auto-scaling API endpoint run by cron job
 * Vercel processes this automatically every 15 minutes
 * Examines traffic patterns and adjusts worker count accordingly
 */
export async function GET() {
  try {
    // Ensure this only runs in a single region to prevent conflicts
    const redis = getRedisClient();
    const lock = await redis.set('lock:autoscaling', 'locked', {
      nx: true,
      ex: 60, // Lock expires after 60 seconds
    });
    
    if (!lock) {
      return NextResponse.json({ success: false, message: 'Another instance is already running' });
    }
    
    // Fetch configuration
    const requestsPerWorker = parseInt(process.env.REQUESTS_PER_WORKER || '500');
    const minWorkersPerRegion = parseInt(process.env.MIN_WORKERS_PER_REGION || '1');
    const maxWorkersPerRegion = parseInt(process.env.MAX_WORKERS_PER_REGION || '10');
    const cooldownSeconds = parseInt(process.env.SCALING_COOLDOWN_SECONDS || '300');
    
    // Fetch current traffic data
    const supabase = createClient();
    const { data: trafficData, error: trafficError } = await supabase
      .from('traffic_metrics')
      .select('region, request_count')
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
      .order('created_at', { ascending: false });
      
    if (trafficError) {
      console.error('Error fetching traffic data:', trafficError);
      return NextResponse.json({ success: false, error: trafficError.message });
    }
    
    // Get current worker status
    const { data: workerData, error: workerError } = await supabase
      .from('worker_regions')
      .select('region, active_workers, max_workers, last_scaled');
      
    if (workerError) {
      console.error('Error fetching worker data:', workerError);
      return NextResponse.json({ success: false, error: workerError.message });
    }
    
    // Process auto-scaling for each region
    const regions = ['iad1', 'sfo1', 'lhr1', 'sin1']; // Match regions in vercel.json
    const scalingActions = [];
    
    for (const region of regions) {
      // Get current traffic for this region
      const regionTraffic = trafficData
        ?.filter(t => t.region === region)
        .reduce((sum, t) => sum + t.request_count, 0) || 0;
        
      // Get current worker status
      const worker = workerData?.find(w => w.region === region);
      
      if (!worker) {
        // Create worker record for this region if it doesn't exist
        const { data: newWorker, error: createError } = await supabase
          .from('worker_regions')
          .insert({
            region,
            active_workers: minWorkersPerRegion,
            max_workers: maxWorkersPerRegion,
            last_scaled: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error(`Error creating worker for region ${region}:`, createError);
          continue;
        }
        
        scalingActions.push({
          region,
          action: 'created',
          workers: minWorkersPerRegion
        });
        
        continue;
      }
      
      // Skip if in cooldown period
      const lastScaled = new Date(worker.last_scaled);
      const cooldownOver = (Date.now() - lastScaled.getTime()) > cooldownSeconds * 1000;
      
      if (!cooldownOver) {
        continue;
      }
      
      // Calculate ideal worker count based on traffic
      const idealWorkers = Math.max(
        minWorkersPerRegion,
        Math.min(
          maxWorkersPerRegion,
          Math.ceil(regionTraffic / requestsPerWorker)
        )
      );
      
      // Only scale if there's a significant difference (25% or more)
      const significantChange = Math.abs(idealWorkers - worker.active_workers) >= Math.max(1, worker.active_workers * 0.25);
      
      if (significantChange) {
        // Update worker count
        const { data: updatedWorker, error: updateError } = await supabase
          .from('worker_regions')
          .update({
            active_workers: idealWorkers,
            last_scaled: new Date().toISOString()
          })
          .eq('region', region)
          .select()
          .single();
          
        if (updateError) {
          console.error(`Error updating workers for region ${region}:`, updateError);
          continue;
        }
        
        // Record the scaling action
        await supabase
          .from('autoscaling_history')
          .insert({
            region,
            previous_workers: worker.active_workers,
            new_workers: idealWorkers,
            traffic: regionTraffic,
            reason: idealWorkers > worker.active_workers ? 'scale_up' : 'scale_down'
          });
          
        scalingActions.push({
          region,
          action: idealWorkers > worker.active_workers ? 'scaled_up' : 'scaled_down',
          from: worker.active_workers,
          to: idealWorkers,
          traffic: regionTraffic
        });
      }
    }
    
    // Release the lock
    await redis.del('lock:autoscaling');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      actions: scalingActions
    });
    
  } catch (error) {
    console.error('Auto-scaling error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 