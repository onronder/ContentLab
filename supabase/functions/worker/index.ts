// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Background Worker
 * 
 * This function processes analysis jobs that have been queued.
 * It is designed to be invoked on a schedule or through a webhook.
 */

// Supabase client with admin privileges for background processing
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Maximum number of jobs to process in a single run
const MAX_JOBS_PER_RUN = 5;
// Maximum job processing time (15 minutes)
const MAX_JOB_PROCESSING_TIME = 15 * 60 * 1000;

// Number of completed jobs
let completedJobs = 0;

/**
 * Process a single job
 */
async function processJob(jobId: string): Promise<boolean> {
  console.log(`Processing job ${jobId}`);
  
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
          started_at: new Date().toISOString()
        })
        .eq("id", jobId);
      
      if (updateError) {
        console.error(`Error updating job ${jobId} to PROCESSING:`, updateError);
        return false;
      }
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
    
    completedJobs++;
    return true;
    
  } catch (error) {
    console.error(`Unexpected error processing job ${jobId}:`, error);
    
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
 * Get pending jobs from the database
 */
async function getPendingJobs(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("id")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(MAX_JOBS_PER_RUN);
    
    if (error) {
      console.error("Error fetching pending jobs:", error);
      return [];
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
    // Find jobs that have been in PROCESSING state for too long (more than 30 minutes)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("id")
      .eq("status", "PROCESSING")
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
  const stalledJobs = await checkStalledJobs();
  const pendingJobs = await getPendingJobs();
  
  console.log(`Found ${pendingJobs.length} pending jobs and ${stalledJobs.length} stalled jobs`);
  
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
  
  return {
    processed: completedJobs,
    stalled: stalledJobs.length
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
    
    const token = authHeader.split(" ")[1];
    const webhookSecret = Deno.env.get("WORKER_WEBHOOK_SECRET");
    
    if (webhookSecret && token !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Run the worker
    const result = await runWorker();
    
    return new Response(
      JSON.stringify({
        message: "Worker execution completed",
        processed_jobs: result.processed,
        stalled_jobs: result.stalled
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Worker execution failed:", error);
    
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