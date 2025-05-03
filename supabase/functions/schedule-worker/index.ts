// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Content Roadmap Tool - Worker Scheduler
 * 
 * This function is designed to be triggered by a cron job to invoke
 * the worker function at regular intervals.
 */

// Schedule configuration
const WORKER_URL = new URL("/functions/v1/worker", Deno.env.get("SUPABASE_URL")).toString();
const WEBHOOK_SECRET = Deno.env.get("WORKER_WEBHOOK_SECRET") || "default-secret";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    // Verify the request is coming from a cron job or authorized source
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Trigger the worker
    console.log("Triggering worker at", new Date().toISOString());
    
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({ scheduled: true }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Error triggering worker:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to trigger worker",
          details: error
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        message: "Worker scheduled successfully",
        result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Scheduler execution failed:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Scheduler execution failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}); 