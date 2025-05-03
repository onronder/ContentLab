import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Get Report Edge Function
 * 
 * This function retrieves the analysis result for a given job ID.
 * It accepts a GET request with the job ID in the URL path:
 * 
 * GET /get-report/{jobId}
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get job ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId) {
      return new Response(
        JSON.stringify({
          error: "Job ID is required"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // 2. Initialize Supabase client & Authenticate User
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")
          }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // 3. Get analysis result
    const { data: report, error: reportError } = await supabaseClient
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (reportError) {
      if (reportError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: "Report not found"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }

      throw reportError;
    }

    // 4. Return the report
    return new Response(
      JSON.stringify(report),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error fetching report:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to retrieve report"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}); 