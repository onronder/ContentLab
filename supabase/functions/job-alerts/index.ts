import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Content Roadmap Tool - Job Alerts
 * 
 * This function handles alerting for failed jobs and system performance issues.
 * It can send notifications via email, webhooks, or other configured channels.
 */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email sending function using a service like SendGrid or another provider
// You would need to configure an actual email service for production
async function sendEmailAlert(subject: string, message: string, recipient: string) {
  // This is a placeholder for actual email sending logic
  // In production, integrate with a proper email service API
  console.log(`ALERT EMAIL (to: ${recipient}): ${subject} - ${message}`);
  
  // For actual implementation, uncomment and configure:
  /*
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: recipient }] }],
      from: { email: 'alerts@contentpoadmaptool.com' },
      subject: subject,
      content: [{ type: 'text/html', value: message }]
    })
  });
  
  return response.ok;
  */
  
  return true;
}

// Send alert via webhook
async function sendWebhookAlert(url: string, payload: any) {
  if (!url) return false;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error sending webhook alert:', error);
    return false;
  }
}

// Supabase client with admin privileges
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Function to check for and alert on failed jobs
async function checkFailedJobs() {
  try {
    // Get failed jobs in the last hour
    const { data: failedJobs, error } = await supabase
      .from('analysis_jobs')
      .select('id, user_id, user_url, error_message, created_at')
      .eq('status', 'ERROR')
      .gt('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!failedJobs || failedJobs.length === 0) {
      return { detected: false, message: "No recent failed jobs detected" };
    }
    
    // Get admin emails from a configuration table or environment
    // For now, we'll use a placeholder admin email
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";
    const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL") || "";
    
    // Format alert message
    const subject = `Alert: ${failedJobs.length} Failed Job${failedJobs.length > 1 ? 's' : ''} Detected`;
    let message = `<h2>Failed Jobs Alert</h2>
                  <p>The following ${failedJobs.length} job(s) have failed in the last hour:</p>
                  <ul>`;
    
    failedJobs.forEach(job => {
      message += `<li>Job ID: ${job.id} - URL: ${job.user_url} - Error: ${job.error_message || 'Unknown error'}</li>`;
    });
    
    message += `</ul>
               <p>Please check the system for more details.</p>`;
    
    // Send alerts
    const emailSent = await sendEmailAlert(subject, message, adminEmail);
    const webhookSent = webhookUrl ? await sendWebhookAlert(webhookUrl, {
      type: 'job_failure',
      count: failedJobs.length,
      jobs: failedJobs
    }) : false;
    
    return {
      detected: true,
      count: failedJobs.length,
      email_sent: emailSent,
      webhook_sent: webhookSent,
      message: `Sent alerts for ${failedJobs.length} failed jobs`
    };
  } catch (error) {
    console.error('Error checking for failed jobs:', error);
    throw error;
  }
}

// Function to monitor system performance
async function checkSystemPerformance() {
  try {
    // 1. Check worker health
    const { data: unhealthyWorkers, error: workerError } = await supabase
      .from('worker_health')
      .select('worker_id, status, last_heartbeat')
      .not('status', 'eq', 'HEALTHY');
    
    if (workerError) throw workerError;
    
    // 2. Check for processing bottlenecks (long-pending jobs)
    const { data: pendingJobs, error: pendingError } = await supabase
      .from('analysis_jobs')
      .select('id, user_url, created_at')
      .eq('status', 'PENDING')
      .lt('created_at', new Date(Date.now() - 900000).toISOString()) // Pending for > 15 minutes
      .order('created_at', { ascending: true });
    
    if (pendingError) throw pendingError;
    
    // 3. Check for high resource usage
    const { data: highResourceWorkers, error: resourceError } = await supabase
      .from('worker_health')
      .select('worker_id, cpu_usage, memory_usage, last_heartbeat')
      .or('cpu_usage.gt.80,memory_usage.gt.80') // CPU or memory > 80%
      .order('cpu_usage', { ascending: false });
    
    if (resourceError) throw resourceError;
    
    // Determine if we need to send alerts
    const hasIssues = (unhealthyWorkers && unhealthyWorkers.length > 0) || 
                     (pendingJobs && pendingJobs.length > 0) || 
                     (highResourceWorkers && highResourceWorkers.length > 0);
    
    if (!hasIssues) {
      return { 
        status: 'healthy', 
        message: "System performance is normal" 
      };
    }
    
    // Format performance alert
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";
    const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL") || "";
    
    const subject = `System Performance Alert: Issues Detected`;
    let message = `<h2>System Performance Issues</h2>`;
    
    if (unhealthyWorkers && unhealthyWorkers.length > 0) {
      message += `<h3>Unhealthy Workers (${unhealthyWorkers.length})</h3><ul>`;
      unhealthyWorkers.forEach(worker => {
        message += `<li>Worker ${worker.worker_id}: Status ${worker.status}, Last heartbeat: ${new Date(worker.last_heartbeat).toLocaleString()}</li>`;
      });
      message += `</ul>`;
    }
    
    if (pendingJobs && pendingJobs.length > 0) {
      message += `<h3>Stuck Jobs (${pendingJobs.length})</h3><ul>`;
      pendingJobs.forEach(job => {
        const waitTime = Math.round((Date.now() - new Date(job.created_at).getTime()) / 60000);
        message += `<li>Job ${job.id}: URL ${job.user_url}, Waiting for ${waitTime} minutes</li>`;
      });
      message += `</ul>`;
    }
    
    if (highResourceWorkers && highResourceWorkers.length > 0) {
      message += `<h3>High Resource Usage (${highResourceWorkers.length})</h3><ul>`;
      highResourceWorkers.forEach(worker => {
        message += `<li>Worker ${worker.worker_id}: CPU ${worker.cpu_usage}%, Memory ${worker.memory_usage}%</li>`;
      });
      message += `</ul>`;
    }
    
    message += `<p>Please check the system admin dashboard for more details.</p>`;
    
    // Send alerts
    const emailSent = await sendEmailAlert(subject, message, adminEmail);
    const webhookSent = webhookUrl ? await sendWebhookAlert(webhookUrl, {
      type: 'performance_issue',
      unhealthy_workers: unhealthyWorkers || [],
      pending_jobs: pendingJobs || [],
      high_resource_workers: highResourceWorkers || []
    }) : false;
    
    return {
      status: 'issues_detected',
      email_sent: emailSent,
      webhook_sent: webhookSent,
      unhealthy_workers: unhealthyWorkers?.length || 0,
      stuck_jobs: pendingJobs?.length || 0,
      high_resource_workers: highResourceWorkers?.length || 0
    };
  } catch (error) {
    console.error('Error checking system performance:', error);
    throw error;
  }
}

// Function to get alert configuration
async function getAlertConfiguration() {
  try {
    // Here you could retrieve alert configuration from a settings table
    // For now, we'll return default/placeholder configuration
    return {
      email_alerts_enabled: true,
      webhook_alerts_enabled: true,
      admin_email: Deno.env.get("ADMIN_EMAIL") || "admin@example.com",
      webhook_url: Deno.env.get("ALERT_WEBHOOK_URL") || "",
      alert_frequency: 60, // minutes
      cpu_threshold: 80, // percentage
      memory_threshold: 80, // percentage
      job_pending_threshold: 15 // minutes
    };
  } catch (error) {
    console.error('Error getting alert configuration:', error);
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
    
    // For GET requests, return alert configuration
    if (req.method === "GET") {
      const config = await getAlertConfiguration();
      
      return new Response(
        JSON.stringify(config),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Parse request body for POST requests
    const body = await req.json();
    const action = body.action || 'check_jobs';
    
    let result;
    
    // Execute requested action
    switch (action) {
      case 'check_jobs':
        result = await checkFailedJobs();
        break;
      case 'check_performance':
        result = await checkSystemPerformance();
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
        timestamp: new Date().toISOString(),
        action: action,
        ...result
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Alert system error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Alert operation failed",
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}); 