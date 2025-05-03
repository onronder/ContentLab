// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Worker Health Check
 * 
 * This function checks the health of all registered workers and updates their status.
 * It is designed to be called on a schedule or manually from the admin dashboard.
 */

// Supabase client with admin privileges
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// How long a worker can be inactive before being marked as INACTIVE (10 minutes)
const INACTIVE_THRESHOLD_MS = 10 * 60 * 1000;

// How long a worker can be inactive before being marked as FAILED (30 minutes)
const FAILED_THRESHOLD_MS = 30 * 60 * 1000;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to check worker health
async function checkWorkerHealth() {
  try {
    // Get all workers
    const { data: workers, error: workersError } = await supabase
      .from('worker_health')
      .select('*');
    
    if (workersError) throw workersError;
    
    if (!workers || workers.length === 0) {
      return { updated: 0, inactive: 0, failed: 0 };
    }
    
    let updatedCount = 0;
    let inactiveCount = 0;
    let failedCount = 0;
    
    const now = new Date();
    
    // Check each worker
    for (const worker of workers) {
      const lastHeartbeat = new Date(worker.last_heartbeat);
      const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();
      
      // Skip if status is already accurate
      if (
        (worker.status === 'ACTIVE' && timeSinceHeartbeat < INACTIVE_THRESHOLD_MS) ||
        (worker.status === 'INACTIVE' && timeSinceHeartbeat >= INACTIVE_THRESHOLD_MS && timeSinceHeartbeat < FAILED_THRESHOLD_MS) ||
        (worker.status === 'FAILED' && timeSinceHeartbeat >= FAILED_THRESHOLD_MS)
      ) {
        continue;
      }
      
      // Update status based on last heartbeat time
      let newStatus = worker.status;
      
      if (timeSinceHeartbeat >= FAILED_THRESHOLD_MS) {
        newStatus = 'FAILED';
        failedCount++;
      } else if (timeSinceHeartbeat >= INACTIVE_THRESHOLD_MS) {
        newStatus = 'INACTIVE';
        inactiveCount++;
      } else {
        newStatus = 'ACTIVE';
      }
      
      // Update worker status if changed
      if (newStatus !== worker.status) {
        const { error: updateError } = await supabase
          .from('worker_health')
          .update({ status: newStatus })
          .eq('id', worker.id);
        
        if (updateError) {
          console.error(`Error updating worker ${worker.id} status:`, updateError);
        } else {
          updatedCount++;
          
          // Log worker status change for history tracking
          await supabase
            .from('worker_status_history')
            .insert({
              worker_id: worker.id,
              status: newStatus,
              previous_status: worker.status,
              last_heartbeat: worker.last_heartbeat
            })
            .then((res) => {
              if (res.error) {
                console.error(`Error logging worker status history:`, res.error);
              }
            });
        }
      }
    }
    
    return {
      updated: updatedCount,
      inactive: inactiveCount,
      failed: failedCount
    };
  } catch (error) {
    console.error('Error checking worker health:', error);
    throw error;
  }
}

// Check for stalled jobs
async function checkStalledJobs() {
  try {
    // Find jobs that have been in PROCESSING state for too long (more than 30 minutes)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("id")
      .eq("status", "PROCESSING")
      .lt("started_at", thirtyMinutesAgo.toISOString());
    
    if (error) throw error;
    
    let resetCount = 0;
    
    // Reset stalled jobs to PENDING
    for (const job of data || []) {
      const { error: updateError } = await supabase
        .from("analysis_jobs")
        .update({
          status: "PENDING",
          started_at: null,
          error_message: "Previous processing attempt stalled"
        })
        .eq("id", job.id);
      
      if (!updateError) {
        resetCount++;
      }
    }
    
    return { stalled_jobs_reset: resetCount };
  } catch (error) {
    console.error('Error checking stalled jobs:', error);
    throw error;
  }
}

// Function to get resource metric summary for active workers
async function getResourceMetrics() {
  try {
    const { data, error } = await supabase
      .from('worker_health')
      .select('cpu_usage, memory_usage')
      .eq('status', 'ACTIVE');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        worker_count: 0,
        avg_cpu: null,
        avg_memory: null,
        max_cpu: null,
        max_memory: null
      };
    }
    
    // Calculate resource metrics for active workers
    const cpuValues = data
      .map(worker => worker.cpu_usage)
      .filter(value => value !== null) as number[];
    
    const memoryValues = data
      .map(worker => worker.memory_usage)
      .filter(value => value !== null) as number[];
    
    const avgCpu = cpuValues.length > 0
      ? cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length
      : null;
    
    const avgMemory = memoryValues.length > 0
      ? memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length
      : null;
    
    const maxCpu = cpuValues.length > 0
      ? Math.max(...cpuValues)
      : null;
    
    const maxMemory = memoryValues.length > 0
      ? Math.max(...memoryValues)
      : null;
    
    return {
      worker_count: data.length,
      avg_cpu: avgCpu !== null ? parseFloat(avgCpu.toFixed(2)) : null,
      avg_memory: avgMemory !== null ? parseFloat(avgMemory.toFixed(2)) : null,
      max_cpu: maxCpu !== null ? parseFloat(maxCpu.toFixed(2)) : null,
      max_memory: maxMemory !== null ? parseFloat(maxMemory.toFixed(2)) : null
    };
  } catch (error) {
    console.error('Error getting resource metrics:', error);
    throw error;
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Only accept POST requests from authorized clients
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Check worker health
    const workerHealthResult = await checkWorkerHealth();
    
    // Check stalled jobs
    const stalledJobsResult = await checkStalledJobs();
    
    // Get resource metrics
    const resourceMetrics = await getResourceMetrics();
    
    // Return results
    return new Response(
      JSON.stringify({
        message: "Health check completed",
        workers: workerHealthResult,
        jobs: stalledJobsResult,
        resources: resourceMetrics
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Health check failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});