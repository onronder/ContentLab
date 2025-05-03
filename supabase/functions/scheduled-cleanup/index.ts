// @ts-ignore - Deno specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno specific imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth admin key
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno specific
      Deno.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore - Deno specific
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Run the cleanup function for rate limiting data
    const { data: rateLimitCleanupCount, error: rateLimitError } = await supabaseAdmin.rpc('cleanup_rate_limit_data');

    if (rateLimitError) {
      console.error('Error cleaning up rate limit data:', rateLimitError);
      return new Response(
        JSON.stringify({ error: rateLimitError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log(`Cleaned up ${rateLimitCleanupCount} rate limit records`);

    // Additional cleanup tasks could be added here, such as:
    // - Archiving old analysis jobs
    // - Cleaning up temporary files
    // - Generating usage reports
    // - etc.

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString(),
        tasks: {
          rateLimitCleanup: {
            success: true,
            deletedCount: rateLimitCleanupCount
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in cleanup function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
}); 