// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Redis } from "https://esm.sh/@upstash/redis@1.20.6";

/**
 * Content Create Tool - Background Worker
 * 
 * This function processes analysis jobs that have been queued.
 * It supports geographic distribution and circuit breaker patterns.
 */

// Determine the worker's region based on environment or deployment location
const WORKER_REGION = Deno.env.get("WORKER_REGION") || "us-east-1";

// Supabase client with admin privileges for background processing
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Create Redis client for distributed state management
const redis = new Redis({
  url: Deno.env.get("REDIS_URL") || "",
  token: Deno.env.get("REDIS_TOKEN") || "",
});

// Maximum number of jobs to process in a single run
const MAX_JOBS_PER_RUN = parseInt(Deno.env.get("MAX_JOBS_PER_RUN") || "5");
// Maximum job processing time (15 minutes)
const MAX_JOB_PROCESSING_TIME = 15 * 60 * 1000;
// Worker ID - generate a unique ID for this worker instance
const WORKER_ID = crypto.randomUUID();

// Circuit breaker states
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing - stop processing
  HALF_OPEN = 'half-open' // Testing if system has recovered
}

// Number of completed jobs
let completedJobs = 0;

/**
 * Check the circuit state before processing
 */
async function checkCircuitBreaker(endpoint: string): Promise<boolean> {
  try {
    const circuitKey = `circuit:${endpoint}:state`;
    const state = await redis.get(circuitKey) as CircuitState || CircuitState.CLOSED;
    
    if (state === CircuitState.OPEN) {
      console.log(`Circuit for ${endpoint} is OPEN, skipping process`);
      return false;
    }
    
    if (state === CircuitState.HALF_OPEN) {
      // In half-open state, allow only limited calls to test system recovery
      const halfOpenCalls = await redis.incr(`circuit:${endpoint}:half_open_calls`);
      
      if (halfOpenCalls > 1) {
        await redis.decr(`circuit:${endpoint}:half_open_calls`);
        console.log(`Circuit for ${endpoint} is HALF-OPEN and at capacity, skipping process`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking circuit breaker:", error);
    return true; // Default to allowing on circuit breaker error
  }
}

/**
 * Record a successful call to potentially close a half-open circuit
 */
async function recordCircuitSuccess(endpoint: string): Promise<void> {
  try {
    const circuitKey = `circuit:${endpoint}:state`;
    const state = await redis.get(circuitKey) as CircuitState;
    
    if (state === CircuitState.HALF_OPEN) {
      const successCount = await redis.incr(`circuit:${endpoint}:half_open_success`);
      
      // If we've had enough successful calls, close the circuit
      if (successCount >= 3) {
        await redis.set(circuitKey, CircuitState.CLOSED);
        await redis.set(`circuit:${endpoint}:failures`, 0);
        console.log(`Circuit for ${endpoint} CLOSED after successful recovery`);
      }
      
      await redis.decr(`circuit:${endpoint}:half_open_calls`);
    }
  } catch (error) {
    console.error("Error recording circuit success:", error);
  }
}

/**
 * Record a failed call and potentially open the circuit
 */
async function recordCircuitFailure(endpoint: string): Promise<void> {
  try {
    const circuitKey = `circuit:${endpoint}:state`;
    const state = await redis.get(circuitKey) as CircuitState;
    
    if (state === CircuitState.HALF_OPEN) {
      // In half-open state, immediately open the circuit again on failure
      await redis.set(circuitKey, CircuitState.OPEN);
      await redis.expire(circuitKey, 30); // Auto-transition back to half-open after 30 seconds
      await redis.decr(`circuit:${endpoint}:half_open_calls`);
      console.log(`Circuit for ${endpoint} reopened after failed recovery attempt`);
    } else if (state === CircuitState.CLOSED) {
      // In closed state, count failures until threshold
      const failures = await redis.incr(`circuit:${endpoint}:failures`);
      
      if (failures >= 5) { // Threshold for opening circuit
        await redis.set(circuitKey, CircuitState.OPEN);
        await redis.expire(circuitKey, 30); // Auto-transition to half-open after 30 seconds
        console.log(`Circuit for ${endpoint} OPENED after ${failures} failures`);
      }
    }
  } catch (error) {
    console.error("Error recording circuit failure:", error);
  }
}

/**
 * Get or register the worker's region ID
 */
async function getWorkerRegionId(): Promise<string | null> {
  try {
    // Look up the region ID based on the location code
    const { data, error } = await supabase
      .from("worker_regions")
      .select("id")
      .eq("location", WORKER_REGION)
      .single();
    
    if (error || !data) {
      console.error("Error getting worker region:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Unexpected error getting worker region:", error);
    return null;
  }
}

/**
 * Register the worker in the health tracking system
 */
async function registerWorker(): Promise<void> {
  try {
    const regionId = await getWorkerRegionId();
    
    // First check if this worker is already registered
    const { data: existingWorker } = await supabase
      .from("worker_health")
      .select("id")
      .eq("worker_id", WORKER_ID)
      .maybeSingle();
    
    if (existingWorker) {
      // Update existing worker
      await supabase
        .from("worker_health")
        .update({
          status: "ACTIVE",
          last_heartbeat: new Date().toISOString(),
          region_id: regionId
        })
        .eq("id", existingWorker.id);
    } else {
      // Register new worker
      await supabase
        .from("worker_health")
        .insert({
          worker_id: WORKER_ID,
          instance_id: Deno.env.get("INSTANCE_ID") || "unknown",
          status: "ACTIVE",
          last_heartbeat: new Date().toISOString(),
          region_id: regionId,
          worker_version: "2.0.0", // Updated version with circuit breaker and geo-distribution
          cpu_usage: 0,
          memory_usage: 0
        });
    }
    
    // Update region stats after registration
    await supabase.rpc("update_worker_region_stats");
  } catch (error) {
    console.error("Error registering worker:", error);
  }
}

/**
 * Update worker health status
 */
async function updateWorkerHealth(
  cpuUsage: number = 0, 
  memoryUsage: number = 0, 
  latencyMs: number = 0
): Promise<void> {
  try {
    await supabase
      .from("worker_health")
      .update({
        last_heartbeat: new Date().toISOString(),
        cpu_usage: cpuUsage,
        memory_usage: memoryUsage,
        latency_ms: latencyMs
      })
      .eq("worker_id", WORKER_ID);
  } catch (error) {
    console.error("Error updating worker health:", error);
  }
}

/**
 * Process a single job
 */
async function processJob(jobId: string): Promise<boolean> {
  console.log(`Processing job ${jobId}`);
  const startTime = Date.now();
  
  try {
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    
    if (jobError || !job) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return false;
    }
    
    // Check if job is already completed or failed
    if (job.status === "COMPLETED" || job.status === "FAILED") {
      console.log(`Job ${jobId} is already ${job.status}`);
      return false;
    }
    
    // Update job to PROCESSING if it's in PENDING state
    if (job.status === "PENDING") {
      const { error: updateError } = await supabase
        .from("analysis_jobs")
        .update({
          status: "PROCESSING",
          started_at: new Date().toISOString(),
          worker_id: WORKER_ID  // Track which worker is processing this job
        })
        .eq("id", jobId);
      
      if (updateError) {
        console.error(`Error updating job ${jobId} to PROCESSING:`, updateError);
        return false;
      }
    }
    
    // Verify circuit is closed for the analyze endpoint
    if (!(await checkCircuitBreaker("analyze"))) {
      // Update job to PENDING to retry later
      await supabase
        .from("analysis_jobs")
        .update({
          status: "PENDING",
          error_message: "Circuit breaker open, job re-queued"
        })
        .eq("id", jobId);
      
      return false;
    }
    
    // Invoke the analyze function to process the job
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "X-Job-ID": jobId,
        },
        body: JSON.stringify({
          user_url: job.user_url,
          competitor_urls: job.competitor_urls,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error processing job ${jobId}:`, error);
      
      // Record circuit failure
      await recordCircuitFailure("analyze");
      
      // Update job status to FAILED
      await supabase
        .from("analysis_jobs")
        .update({
          status: "FAILED",
          error_message: `Worker error: ${error}`,
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);
      
      return false;
    }
    
    // Record circuit success
    await recordCircuitSuccess("analyze");
    
    // Update worker metrics
    const latencyMs = Date.now() - startTime;
    await updateWorkerHealth(0, 0, latencyMs);
    
    completedJobs++;
    return true;
    
  } catch (error) {
    console.error(`Unexpected error processing job ${jobId}:`, error);
    
    // Record circuit failure on unexpected errors
    await recordCircuitFailure("analyze");
    
    // Update job status to FAILED
    await supabase
      .from("analysis_jobs")
      .update({
        status: "FAILED",
        error_message: `Worker error: ${error instanceof Error ? error.message : String(error)}`,
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);
    
    return false;
  }
}

/**
 * Get pending jobs from the database for this worker's region
 */
async function getPendingJobs(): Promise<string[]> {
  try {
    const regionId = await getWorkerRegionId();
    
    // First try to get region-specific jobs
    if (regionId) {
      const { data: regionJobs, error: regionError } = await supabase
        .from("analysis_jobs")
        .select("id")
        .eq("status", "PENDING")
        .eq("region_id", regionId)
        .order("created_at", { ascending: true })
        .limit(MAX_JOBS_PER_RUN);
      
      if (!regionError && regionJobs && regionJobs.length > 0) {
        return regionJobs.map(job => job.id);
      }
    }
    
    // If no region-specific jobs or no region, get any job without a region assignment
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("id")
      .eq("status", "PENDING")
      .is("region_id", null)
      .order("created_at", { ascending: true })
      .limit(MAX_JOBS_PER_RUN);
    
    if (error) {
      console.error("Error fetching pending jobs:", error);
      return [];
    }
    
    // For jobs without regions, assign them to this worker's region
    if (regionId && data && data.length > 0) {
      for (const job of data) {
        await supabase
          .from("analysis_jobs")
          .update({ region_id: regionId, region_assigned_at: new Date().toISOString() })
          .eq("id", job.id);
      }
    }
    
    return data.map(job => job.id);
  } catch (error) {
    console.error("Unexpected error fetching pending jobs:", error);
    return [];
  }
}

/**
 * Check for stalled jobs (stuck in PROCESSING state)
 */
async function checkStalledJobs(): Promise<string[]> {
  try {
    const regionId = await getWorkerRegionId();
    const query = supabase
      .from("analysis_jobs")
      .select("id")
      .eq("status", "PROCESSING");
    
    // If we have a region ID, limit to jobs in this region
    if (regionId) {
      query.eq("region_id", regionId);
    }
    
    // Find jobs that have been in PROCESSING state for too long (more than 30 minutes)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    const { data, error } = await query
      .lt("started_at", thirtyMinutesAgo.toISOString())
      .order("started_at", { ascending: true })
      .limit(MAX_JOBS_PER_RUN - completedJobs);
    
    if (error) {
      console.error("Error fetching stalled jobs:", error);
      return [];
    }
    
    // Reset stalled jobs to PENDING
    for (const job of data) {
      console.log(`Resetting stalled job ${job.id}`);
      await supabase
        .from("analysis_jobs")
        .update({
          status: "PENDING",
          started_at: null,
          error_message: "Previous processing attempt stalled"
        })
        .eq("id", job.id);
    }
    
    return data.map(job => job.id);
  } catch (error) {
    console.error("Unexpected error checking stalled jobs:", error);
    return [];
  }
}

/**
 * Main worker function
 */
async function runWorker(): Promise<{ processed: number; stalled: number }> {
  completedJobs = 0;
  
  // Register worker first to ensure it's tracked in the health system
  await registerWorker();
  
  const stalledJobs = await checkStalledJobs();
  const pendingJobs = await getPendingJobs();
  
  console.log(`Found ${pendingJobs.length} pending jobs and ${stalledJobs.length} stalled jobs in region ${WORKER_REGION}`);
  
  // Process jobs with timeout protection
  const startTime = Date.now();
  
  for (const jobId of pendingJobs) {
    // Check if we're approaching the function timeout
    if (Date.now() - startTime > MAX_JOB_PROCESSING_TIME) {
      console.log("Approaching max processing time, stopping");
      break;
    }
    
    await processJob(jobId);
  }
  
  // Final worker health update before finishing
  await updateWorkerHealth();
  
  return {
    processed: completedJobs,
    stalled: stalledJobs.length,
    region: WORKER_REGION
  };
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    // Verify webhook secret if provided
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // Run the worker
    const result = await runWorker();
    
    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        worker_id: WORKER_ID,
        region: WORKER_REGION,
        processed_jobs: result.processed,
        stalled_jobs: result.stalled,
        time: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Worker execution error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Worker execution failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}); 