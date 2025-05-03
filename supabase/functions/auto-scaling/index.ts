// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Redis } from "https://esm.sh/@upstash/redis@1.20.6";

/**
 * ContentCreate - Predictive Auto-Scaling Function
 * 
 * This function analyzes traffic predictions and automatically adjusts worker counts
 * across different regions based on expected load.
 * 
 * Enhanced with Redis for distributed coordination and caching.
 */

// Supabase client with admin privileges
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Create Redis client for distributed coordination
const redis = new Redis({
  url: Deno.env.get("REDIS_URL") || "",
  token: Deno.env.get("REDIS_TOKEN") || "",
});

// Configuration for worker-to-requests ratio
const REQUESTS_PER_WORKER = parseInt(Deno.env.get("REQUESTS_PER_WORKER") || "500");
const MIN_WORKERS_PER_REGION = parseInt(Deno.env.get("MIN_WORKERS_PER_REGION") || "1");
const MAX_WORKERS_PER_REGION = parseInt(Deno.env.get("MAX_WORKERS_PER_REGION") || "10");
const SCALING_COOLDOWN_SECONDS = parseInt(Deno.env.get("SCALING_COOLDOWN_SECONDS") || "300"); // 5 minutes cooldown
const LOCK_EXPIRY_SECONDS = 60; // 1 minute lock expiry

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Acquire a distributed lock to prevent multiple instances from scaling simultaneously
 */
async function acquireScalingLock(): Promise<boolean> {
  try {
    const lockKey = "lock:autoscaling";
    const instanceId = crypto.randomUUID(); // Unique ID for this function instance
    
    // Try to set lock with NX option (only set if doesn't exist)
    const lockAcquired = await redis.set(lockKey, instanceId, {
      nx: true,
      ex: LOCK_EXPIRY_SECONDS
    });
    
    return !!lockAcquired;
  } catch (error) {
    console.error("Error acquiring scaling lock:", error);
    return false;
  }
}

/**
 * Release the distributed scaling lock
 */
async function releaseScalingLock(): Promise<boolean> {
  try {
    const lockKey = "lock:autoscaling";
    await redis.del(lockKey);
    return true;
  } catch (error) {
    console.error("Error releasing scaling lock:", error);
    return false;
  }
}

/**
 * Check if a region is in cooldown period after recent scaling
 */
async function isRegionInCooldown(regionId: string): Promise<boolean> {
  try {
    const cooldownKey = `cooldown:region:${regionId}`;
    const cooldownExists = await redis.exists(cooldownKey);
    return cooldownExists === 1;
  } catch (error) {
    console.error(`Error checking cooldown for region ${regionId}:`, error);
    return false; // Default to not in cooldown on error
  }
}

/**
 * Set region cooldown after scaling action
 */
async function setRegionCooldown(regionId: string): Promise<void> {
  try {
    const cooldownKey = `cooldown:region:${regionId}`;
    await redis.set(cooldownKey, Date.now(), {
      ex: SCALING_COOLDOWN_SECONDS
    });
  } catch (error) {
    console.error(`Error setting cooldown for region ${regionId}:`, error);
  }
}

/**
 * Cache traffic predictions for improved performance
 */
async function cacheTrafficPredictions(predictions: any[]): Promise<void> {
  try {
    const cacheKey = "cache:traffic_predictions";
    await redis.set(cacheKey, JSON.stringify(predictions), {
      ex: 300 // Cache for 5 minutes
    });
  } catch (error) {
    console.error("Error caching traffic predictions:", error);
  }
}

/**
 * Get cached traffic predictions
 */
async function getCachedTrafficPredictions(): Promise<any[] | null> {
  try {
    const cacheKey = "cache:traffic_predictions";
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting cached predictions:", error);
    return null;
  }
}

/**
 * Get traffic predictions for a specific timeframe
 */
async function getTrafficPredictions(hoursAhead: number = 1): Promise<any[]> {
  // First check cache
  const cachedPredictions = await getCachedTrafficPredictions();
  if (cachedPredictions) {
    return cachedPredictions;
  }
  
  try {
    const { data, error } = await supabase
      .from("traffic_predictions")
      .select("*")
      .gte("predicted_for", new Date(Date.now() + (hoursAhead - 1) * 60 * 60 * 1000).toISOString())
      .lte("predicted_for", new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString())
      .order("confidence_score", { ascending: false });
    
    if (error) {
      console.error("Error fetching traffic predictions:", error);
      return [];
    }
    
    // Cache predictions for future requests
    if (data && data.length > 0) {
      await cacheTrafficPredictions(data);
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching predictions:", error);
    return [];
  }
}

/**
 * Get current worker capacity by region
 */
async function getWorkerCapacity(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from("worker_capacity")
      .select("*, worker_regions(name, location)");
    
    if (error) {
      console.error("Error fetching worker capacity:", error);
      return {};
    }
    
    // Convert to map by region location
    const capacityMap: Record<string, any> = {};
    for (const capacity of data || []) {
      if (capacity.worker_regions) {
        capacityMap[capacity.worker_regions.location] = capacity;
      }
    }
    
    return capacityMap;
  } catch (error) {
    console.error("Unexpected error fetching worker capacity:", error);
    return {};
  }
}

/**
 * Calculate recommended worker count based on traffic predictions
 */
function calculateRecommendedWorkers(
  predictedRequests: number, 
  currentWorkers: number,
  historicalPatterns: any[] = []
): number {
  // Calculate needed workers based on predicted traffic
  let recommendedWorkers = Math.ceil(predictedRequests / REQUESTS_PER_WORKER);
  
  // Apply constraints
  recommendedWorkers = Math.max(MIN_WORKERS_PER_REGION, recommendedWorkers);
  recommendedWorkers = Math.min(MAX_WORKERS_PER_REGION, recommendedWorkers);
  
  // Limit rate of change (no more than doubling or halving)
  if (currentWorkers > 0) {
    recommendedWorkers = Math.max(Math.floor(currentWorkers / 2), recommendedWorkers);
    recommendedWorkers = Math.min(currentWorkers * 2, recommendedWorkers);
  }
  
  // Add buffer for safety (additional 10% capacity)
  recommendedWorkers = Math.min(
    MAX_WORKERS_PER_REGION,
    Math.ceil(recommendedWorkers * 1.1)
  );
  
  return recommendedWorkers;
}

/**
 * Update worker capacity settings
 */
async function updateWorkerCapacity(
  regionId: string, 
  targetWorkers: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("worker_capacity")
      .update({
        target_workers: targetWorkers,
        updated_at: new Date().toISOString()
      })
      .eq("region_id", regionId);
    
    if (error) {
      console.error(`Error updating worker capacity for region ${regionId}:`, error);
      return false;
    }
    
    // Set cooldown period for this region
    await setRegionCooldown(regionId);
    
    return true;
  } catch (error) {
    console.error(`Unexpected error updating worker capacity for region ${regionId}:`, error);
    return false;
  }
}

/**
 * Log autoscaling action for audit trail
 */
async function logAutoScalingAction(
  regionId: string,
  regionName: string,
  previousWorkers: number,
  newWorkers: number,
  predictedRequests: number,
  reason: string
): Promise<void> {
  try {
    await supabase
      .from("autoscaling_history")
      .insert({
        region_id: regionId,
        region_name: regionName,
        previous_workers: previousWorkers,
        new_workers: newWorkers,
        predicted_requests: predictedRequests,
        reason: reason
      });
  } catch (error) {
    console.error("Error logging autoscaling action:", error);
  }
}

/**
 * Get historical scaling patterns for a region
 */
async function getHistoricalScalingPatterns(regionId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("autoscaling_history")
      .select("*")
      .eq("region_id", regionId)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (error) {
      console.error(`Error fetching historical patterns for region ${regionId}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Unexpected error fetching historical patterns for region ${regionId}:`, error);
    return [];
  }
}

/**
 * Main function to perform auto-scaling based on predictions
 */
async function performAutoScaling(): Promise<any> {
  // Acquire distributed lock to ensure only one instance is scaling at a time
  const lockAcquired = await acquireScalingLock();
  if (!lockAcquired) {
    console.log("Another instance is already performing auto-scaling, skipping");
    return { skipped: true, reason: "Lock acquisition failed" };
  }
  
  try {
    // Get traffic predictions for the next hour
    const predictions = await getTrafficPredictions(1);
    
    // Get current worker capacity
    const capacityMap = await getWorkerCapacity();
    
    // Results tracking
    const results = {
      regions_adjusted: 0,
      workers_added: 0,
      workers_removed: 0,
      regions: {},
      skipped_regions: []
    };
    
    // Process predictions by region
    const regionPredictions: Record<string, number> = {};
    
    // Aggregate predictions by region
    for (const prediction of predictions) {
      const region = prediction.region || "global";
      
      if (!regionPredictions[region]) {
        regionPredictions[region] = 0;
      }
      
      // Accumulate predicted requests, weighted by confidence
      regionPredictions[region] += prediction.predicted_requests * prediction.confidence_score;
    }
    
    // Process each region
    for (const [regionLocation, capacity] of Object.entries(capacityMap)) {
      // Skip if auto-scaling is disabled for this region
      if (!capacity.auto_scaling) {
        continue;
      }
      
      const regionId = capacity.region_id;
      
      // Check if region is in cooldown after recent scaling
      const inCooldown = await isRegionInCooldown(regionId);
      if (inCooldown) {
        results.skipped_regions.push({
          region: regionLocation,
          reason: "In cooldown period"
        });
        continue;
      }
      
      const currentWorkers = capacity.current_workers || 0;
      const currentTarget = capacity.target_workers || 0;
      
      // Get predicted traffic for this region
      const predictedRequests = regionPredictions[regionLocation] || 0;
      
      // Get historical scaling patterns for smarter decisions
      const historicalPatterns = await getHistoricalScalingPatterns(regionId);
      
      // Calculate recommended worker count with historical patterns
      const recommendedWorkers = calculateRecommendedWorkers(
        predictedRequests, 
        currentWorkers,
        historicalPatterns
      );
      
      // Only update if there's a change needed
      if (recommendedWorkers !== currentTarget) {
        const workersChange = recommendedWorkers - currentTarget;
        
        // Update worker capacity
        const success = await updateWorkerCapacity(regionId, recommendedWorkers);
        
        if (success) {
          // Log the auto-scaling action
          await logAutoScalingAction(
            regionId,
            capacity.worker_regions?.name || "Unknown",
            currentTarget,
            recommendedWorkers,
            predictedRequests,
            `Predicted traffic: ${predictedRequests} requests/hour`
          );
          
          // Update results
          results.regions_adjusted++;
          if (workersChange > 0) {
            results.workers_added += workersChange;
          } else {
            results.workers_removed -= workersChange;
          }
          
          results.regions[regionLocation] = {
            previous_target: currentTarget,
            new_target: recommendedWorkers,
            predicted_traffic: predictedRequests
          };
        }
      }
    }
    
    return results;
  } finally {
    // Always release the lock when done
    await releaseScalingLock();
  }
}

// Serve HTTP endpoint
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
    
    // Extract the token
    const token = authHeader.split(" ")[1];
    
    // Verify against allowed tokens or service role key
    if (token !== Deno.env.get("WORKER_WEBHOOK_SECRET") && 
        token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate traffic predictions first
    await supabase.rpc("generate_traffic_predictions");
    
    // Perform auto-scaling based on predictions
    const results = await performAutoScaling();
    
    return new Response(
      JSON.stringify({
        success: true,
        time: new Date().toISOString(),
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Auto-scaling execution error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Auto-scaling execution failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}); 