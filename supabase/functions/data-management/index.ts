// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Data Management
 * 
 * This function handles data archiving, cleanup, and version management for analysis reports.
 * It can be called manually or on a schedule to maintain database health.
 */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase client with admin privileges
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Function to manage data archiving process
async function manageDataArchiving() {
  try {
    // Step 1: Mark eligible reports for archiving
    const { data: markResult, error: markError } = await supabase
      .rpc('mark_eligible_for_archiving');
    
    if (markError) throw markError;
    
    // Step 2: Archive old reports
    const { data: archiveCount, error: archiveError } = await supabase
      .rpc('archive_old_reports');
    
    if (archiveError) throw archiveError;
    
    // Return results
    return {
      archived_count: archiveCount || 0,
      success: true
    };
  } catch (error) {
    console.error('Error managing data archiving:', error);
    throw error;
  }
}

// Function to clean up very old archived data
async function cleanupOldArchives() {
  try {
    const { data: cleanupCount, error: cleanupError } = await supabase
      .rpc('cleanup_old_archives');
    
    if (cleanupError) throw cleanupError;
    
    return {
      cleaned_count: cleanupCount || 0,
      success: true
    };
  } catch (error) {
    console.error('Error cleaning up old archives:', error);
    throw error;
  }
}

// Function to create a new version of an analysis
async function createNewVersion(jobId: string) {
  try {
    if (!jobId) throw new Error("Job ID is required");
    
    const { data: newVersionId, error: versionError } = await supabase
      .rpc('create_analysis_version', {
        p_job_id: jobId
      });
    
    if (versionError) throw versionError;
    
    return {
      original_job_id: jobId,
      new_job_id: newVersionId,
      success: true
    };
  } catch (error) {
    console.error('Error creating new version:', error);
    throw error;
  }
}

// Function to get archive statistics
async function getArchiveStats() {
  try {
    // Get count of archived jobs
    const { count: archivedCount, error: archiveError } = await supabase
      .from('analysis_archives')
      .select('*', { count: 'exact', head: true });
    
    if (archiveError) throw archiveError;
    
    // Get count of jobs eligible for archiving
    const { count: eligibleCount, error: eligibleError } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .is('archived', false)
      .not('archive_eligible_at', 'is', null);
    
    if (eligibleError) throw eligibleError;
    
    // Get count of jobs with versions > 1
    const { count: versionedCount, error: versionError } = await supabase
      .from('analysis_jobs')
      .select('*', { count: 'exact', head: true })
      .gt('version', 1);
    
    if (versionError) throw versionError;
    
    return {
      archived_jobs: archivedCount || 0,
      eligible_for_archive: eligibleCount || 0,
      versioned_jobs: versionedCount || 0
    };
  } catch (error) {
    console.error('Error getting archive stats:', error);
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
    // Only accept POST or GET requests
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // For GET requests, return archive statistics
    if (req.method === "GET") {
      const stats = await getArchiveStats();
      
      return new Response(
        JSON.stringify(stats),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Parse request body for POST requests
    const body = await req.json();
    const action = body.action || 'archive';
    
    let result;
    
    // Execute requested action
    switch (action) {
      case 'archive':
        result = await manageDataArchiving();
        break;
      case 'cleanup':
        result = await cleanupOldArchives();
        break;
      case 'create_version':
        if (!body.job_id) {
          return new Response(
            JSON.stringify({ error: "Missing job_id parameter" }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        result = await createNewVersion(body.job_id);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
    
    // Return result
    return new Response(
      JSON.stringify({
        message: `Data management action '${action}' completed successfully`,
        ...result
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Data management failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Data management operation failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}); 