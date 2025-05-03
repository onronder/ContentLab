import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Worker Heartbeat
 * 
 * This function allows workers to report their health status.
 * Workers should call this endpoint regularly to indicate they are still running.
 */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    
    // Get request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.worker_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: worker_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Call worker_heartbeat function
    const { data, error } = await supabaseClient.rpc(
      'worker_heartbeat',
      {
        p_worker_id: body.worker_id,
        p_jobs_processed: body.jobs_processed || null,
        p_jobs_failed: body.jobs_failed || null,
        p_metadata: body.metadata || null,
        p_cpu_usage: body.cpu_usage || null,
        p_memory_usage: body.memory_usage || null
      }
    );
    
    if (error) throw error;
    
    // Return success
    return new Response(
      JSON.stringify({
        message: "Heartbeat recorded",
        worker_id: data
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Heartbeat failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Heartbeat failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}); 