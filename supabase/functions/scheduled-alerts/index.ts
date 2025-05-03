// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Scheduled Alerts
 * 
 * This function is triggered on a schedule to check for issues
 * and send alerts when needed. It acts as a cron job to regularly
 * monitor system health and job failures.
 */

// Supabase client with admin privileges
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Main handler
Deno.serve(async (req) => {
  try {
    // We expect this to be called via Supabase's scheduled functions
    // but we can also support manual calls
    
    // Step 1: Check job alerts
    const jobAlertResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/job-alerts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`
        },
        body: JSON.stringify({ action: "check_jobs" })
      }
    );
    
    if (!jobAlertResponse.ok) {
      throw new Error(`Job alerts check failed: ${await jobAlertResponse.text()}`);
    }
    
    const jobAlertResult = await jobAlertResponse.json();
    
    // Step 2: Check system performance
    const perfAlertResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/job-alerts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`
        },
        body: JSON.stringify({ action: "check_performance" })
      }
    );
    
    if (!perfAlertResponse.ok) {
      throw new Error(`Performance alerts check failed: ${await perfAlertResponse.text()}`);
    }
    
    const perfAlertResult = await perfAlertResponse.json();
    
    // Log a record of this scheduled check
    const { error: logError } = await supabase
      .from('scheduled_check_log')
      .insert({
        check_type: 'alerts',
        result: {
          job_alerts: jobAlertResult,
          performance_alerts: perfAlertResult
        }
      });
    
    if (logError) {
      console.error("Error logging scheduled check:", logError);
    }
    
    // Return the results
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        job_alerts: jobAlertResult,
        performance_alerts: perfAlertResult
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Scheduled alerts error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Scheduled alerts failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 