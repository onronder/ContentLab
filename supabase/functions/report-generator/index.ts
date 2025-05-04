// @ts-nocheck - Supabase Edge Functions use Deno runtime which TypeScript can't properly type check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Create Tool - Report Generator Function
 * 
 * This function generates scheduled reports and sends them via email.
 * It supports content gap reports, performance reports, and competitor analysis reports.
 */

// Supabase client with admin privileges for background processing
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Maximum retry attempts for report generation
const MAX_RETRIES = 3;

// Report types supported by the generator
enum ReportType {
  CONTENT_GAPS = "content_gaps",
  PERFORMANCE = "performance",
  COMPETITOR_ANALYSIS = "competitor_analysis",
  CUSTOM = "custom"
}

interface ReportParams {
  report_id: string;
  execution_id: string;
  report_type: ReportType;
  parameters: any;
}

/**
 * Main function handler for report generation
 */
Deno.serve(async (req) => {
  try {
    // Validate request
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const json = await req.json();
    const jobId = json.job_id;
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Missing job_id parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    
    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch job" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure it's a scheduled report job
    if (job.job_type !== "scheduled_report") {
      return new Response(
        JSON.stringify({ error: "Not a scheduled report job" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update job to processing state
    await supabase
      .from("analysis_jobs")
      .update({
        status: "PROCESSING",
        started_at: new Date().toISOString()
      })
      .eq("id", jobId);

    // Update report execution status
    const reportParams: ReportParams = job.parameters;
    await supabase.rpc("update_report_schedule", {
      p_report_id: reportParams.report_id,
      p_execution_id: reportParams.execution_id,
      p_status: "processing"
    });

    // Generate report based on type
    let reportResult;
    try {
      switch (reportParams.report_type) {
        case ReportType.CONTENT_GAPS:
          reportResult = await generateContentGapsReport(reportParams, job.user_id);
          break;
        case ReportType.PERFORMANCE:
          reportResult = await generatePerformanceReport(reportParams, job.user_id);
          break;
        case ReportType.COMPETITOR_ANALYSIS:
          reportResult = await generateCompetitorAnalysisReport(reportParams, job.user_id);
          break;
        case ReportType.CUSTOM:
          reportResult = await generateCustomReport(reportParams, job.user_id);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportParams.report_type}`);
      }

      // Update job to completed state
      await supabase
        .from("analysis_jobs")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);

      // Update report execution status
      await supabase.rpc("update_report_schedule", {
        p_report_id: reportParams.report_id,
        p_execution_id: reportParams.execution_id,
        p_status: "completed",
        p_report_url: reportResult.reportUrl
      });

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          report_url: reportResult.reportUrl
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      // Update job to failed state
      await supabase
        .from("analysis_jobs")
        .update({
          status: "FAILED",
          error_message: error.message || "Report generation failed",
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);

      // Update report execution status
      await supabase.rpc("update_report_schedule", {
        p_report_id: reportParams.report_id,
        p_execution_id: reportParams.execution_id,
        p_status: "failed",
        p_error_message: error.message || "Report generation failed"
      });

      // Return error
      return new Response(
        JSON.stringify({ error: error.message || "Report generation failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generate a content gaps report based on recent analyses
 */
async function generateContentGapsReport(params: ReportParams, userId: string) {
  console.log("Generating content gaps report");
  
  // Get the parameters for the report
  const timeframe = params.parameters?.timeframe || "30d"; // Default 30 days
  const limit = params.parameters?.limit || 20; // Default 20 items
  
  // Calculate the start date based on timeframe
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  // Get the completed analyses within the timeframe
  const { data: analyses, error: analysesError } = await supabase
    .from("analysis_jobs")
    .select("id, user_url, competitor_urls, content_gaps, popular_themes, completed_at")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .gte("completed_at", startDate.toISOString())
    .order("completed_at", { ascending: false });
  
  if (analysesError) {
    throw new Error(`Failed to fetch analyses: ${analysesError.message}`);
  }
  
  if (!analyses || analyses.length === 0) {
    throw new Error("No completed analyses found within the specified timeframe");
  }
  
  // Aggregate content gaps across all analyses
  const contentGapsMap = new Map<string, number>();
  
  for (const analysis of analyses) {
    if (Array.isArray(analysis.content_gaps)) {
      for (const gap of analysis.content_gaps) {
        const count = contentGapsMap.get(gap) || 0;
        contentGapsMap.set(gap, count + 1);
      }
    }
  }
  
  // Convert to array and sort by frequency
  const sortedGaps = Array.from(contentGapsMap.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  // Get user's websites analyzed
  const uniqueUrls = Array.from(new Set(analyses.map(a => a.user_url)));
  
  // Create report content
  const reportData = {
    title: "Content Gaps Report",
    generated_at: new Date().toISOString(),
    timeframe,
    websites_analyzed: uniqueUrls,
    analyses_count: analyses.length,
    top_content_gaps: sortedGaps
  };
  
  // Save report to storage
  const reportFileName = `reports/${userId}/content_gaps_${now.getTime()}.json`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("reports")
    .upload(reportFileName, JSON.stringify(reportData), {
      contentType: "application/json",
      upsert: true
    });
  
  if (uploadError) {
    throw new Error(`Failed to save report: ${uploadError.message}`);
  }
  
  // Get public URL for the report
  const { data: urlData } = await supabase.storage
    .from("reports")
    .getPublicUrl(reportFileName);
  
  return {
    reportUrl: urlData.publicUrl,
    reportData
  };
}

/**
 * Generate a performance report
 */
async function generatePerformanceReport(params: ReportParams, userId: string) {
  console.log("Generating performance report");
  
  // Get job statistics for the user
  const { data: jobStats, error: jobStatsError } = await supabase.rpc("get_job_statistics_for_user", {
    p_user_id: userId
  });
  
  if (jobStatsError) {
    throw new Error(`Failed to fetch job statistics: ${jobStatsError.message}`);
  }
  
  // Get system health metrics
  const timeRange = params.parameters?.timeRange || "7d";
  const { data: healthData, error: healthError } = await supabase
    .from("worker_status_history")
    .select("status, cpu_usage, memory_usage, recorded_at")
    .order("recorded_at", { ascending: true });
  
  if (healthError) {
    throw new Error(`Failed to fetch system health data: ${healthError.message}`);
  }
  
  // Create report content
  const now = new Date();
  const reportData = {
    title: "System Performance Report",
    generated_at: now.toISOString(),
    job_statistics: jobStats,
    system_health: processHealthData(healthData, timeRange)
  };
  
  // Save report to storage
  const reportFileName = `reports/${userId}/performance_${now.getTime()}.json`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("reports")
    .upload(reportFileName, JSON.stringify(reportData), {
      contentType: "application/json",
      upsert: true
    });
  
  if (uploadError) {
    throw new Error(`Failed to save report: ${uploadError.message}`);
  }
  
  // Get public URL for the report
  const { data: urlData } = await supabase.storage
    .from("reports")
    .getPublicUrl(reportFileName);
  
  return {
    reportUrl: urlData.publicUrl,
    reportData
  };
}

/**
 * Generate a competitor analysis report
 */
async function generateCompetitorAnalysisReport(params: ReportParams, userId: string) {
  console.log("Generating competitor analysis report");
  
  // Get the parameters for the report
  const siteUrl = params.parameters?.siteUrl;
  
  if (!siteUrl) {
    throw new Error("Site URL is required for competitor analysis report");
  }
  
  // Get the most recent analysis for the specified site
  const { data: analysis, error: analysisError } = await supabase
    .from("analysis_jobs")
    .select("id, user_url, competitor_urls, content_gaps, popular_themes, completed_at")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .eq("user_url", siteUrl)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();
  
  if (analysisError) {
    throw new Error(`Failed to fetch analysis: ${analysisError.message}`);
  }
  
  if (!analysis) {
    throw new Error(`No completed analysis found for ${siteUrl}`);
  }
  
  // Create report content
  const now = new Date();
  const reportData = {
    title: "Competitor Analysis Report",
    generated_at: now.toISOString(),
    site_url: siteUrl,
    competitors_analyzed: analysis.competitor_urls,
    analyzed_at: analysis.completed_at,
    content_gaps: analysis.content_gaps,
    popular_themes: analysis.popular_themes
  };
  
  // Save report to storage
  const reportFileName = `reports/${userId}/competitor_analysis_${now.getTime()}.json`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("reports")
    .upload(reportFileName, JSON.stringify(reportData), {
      contentType: "application/json",
      upsert: true
    });
  
  if (uploadError) {
    throw new Error(`Failed to save report: ${uploadError.message}`);
  }
  
  // Get public URL for the report
  const { data: urlData } = await supabase.storage
    .from("reports")
    .getPublicUrl(reportFileName);
  
  return {
    reportUrl: urlData.publicUrl,
    reportData
  };
}

/**
 * Generate a custom report based on parameters
 */
async function generateCustomReport(params: ReportParams, userId: string) {
  console.log("Generating custom report");
  
  // Custom report requires specific parameters
  if (!params.parameters || !params.parameters.query) {
    throw new Error("Custom report requires query parameters");
  }
  
  // Extract custom query parameters
  const { query, format } = params.parameters;
  
  try {
    // Execute custom query - IMPORTANT: Validate and sanitize in production!
    // For safety, we'd want to use parameterized RPC functions instead of direct queries
    const { data: queryResult, error: queryError } = await supabase.rpc("execute_custom_report_query", {
      p_query_name: query,
      p_user_id: userId
    });
    
    if (queryError) {
      throw new Error(`Failed to execute custom query: ${queryError.message}`);
    }
    
    // Create report content
    const now = new Date();
    const reportData = {
      title: "Custom Report",
      generated_at: now.toISOString(),
      query_name: query,
      results: queryResult
    };
    
    // Save report to storage
    const reportFileName = `reports/${userId}/custom_${now.getTime()}.json`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(reportFileName, JSON.stringify(reportData), {
        contentType: "application/json",
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Failed to save report: ${uploadError.message}`);
    }
    
    // Get public URL for the report
    const { data: urlData } = await supabase.storage
      .from("reports")
      .getPublicUrl(reportFileName);
    
    return {
      reportUrl: urlData.publicUrl,
      reportData
    };
  } catch (error) {
    throw new Error(`Custom report generation failed: ${error.message}`);
  }
}

/**
 * Process health data for the report
 */
function processHealthData(healthData: any[], timeRange: string) {
  // Helper function to get bucket size based on time range
  const getBucketSize = (timeRange: string): number => {
    switch (timeRange) {
      case "1d": return 30 * 60 * 1000; // 30 minutes
      case "7d": return 6 * 60 * 60 * 1000; // 6 hours
      case "30d": return 24 * 60 * 60 * 1000; // 1 day
      default: return 6 * 60 * 60 * 1000; // Default to 6 hours
    }
  };
  
  // Group data by time buckets
  const bucketSize = getBucketSize(timeRange);
  const buckets: Record<string, { cpu: number[], memory: number[] }> = {};
  
  for (const record of healthData) {
    const recordTime = new Date(record.recorded_at).getTime();
    const bucketKey = Math.floor(recordTime / bucketSize) * bucketSize;
    const bucketDate = new Date(bucketKey).toISOString();
    
    if (!buckets[bucketDate]) {
      buckets[bucketDate] = { cpu: [], memory: [] };
    }
    
    buckets[bucketDate].cpu.push(record.cpu_usage);
    buckets[bucketDate].memory.push(record.memory_usage);
  }
  
  // Convert buckets to arrays for the report
  const processedData = Object.entries(buckets).map(([timestamp, data]) => {
    const cpuValues = data.cpu;
    const memoryValues = data.memory;
    
    return {
      timestamp,
      cpu_avg: cpuValues.length ? 
        Math.round(cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length * 100) / 100 : 0,
      memory_avg: memoryValues.length ? 
        Math.round(memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length * 100) / 100 : 0
    };
  }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  
  return processedData;
} 