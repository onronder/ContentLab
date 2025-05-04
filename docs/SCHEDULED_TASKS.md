# Scheduled Tasks Configuration Guide

This document outlines how to configure and manage scheduled tasks for the ContentCreate application. Multiple scheduling approaches are supported to accommodate different deployment scenarios.

## Overview

The application uses scheduled tasks for several important processes:
- Processing scheduled reports
- Adjusting rate limits based on traffic patterns
- Monitoring system health
- Archiving old data

Instead of hardcoding dependencies on specific scheduling mechanisms (like pg_cron), the application uses a more flexible approach that supports multiple scheduling options.

## Configuration

### System Settings Table

Scheduled tasks are configured in the `system_settings` table with the category `scheduled_tasks`. Each task has the following properties:

```json
{
  "name": "task_name",
  "schedule": "*/5 * * * *",  // Cron syntax
  "command": "CALL procedure_name()",
  "enabled": true,
  "last_run": "2023-05-01T12:00:00Z"
}
```

## Implementation Options

### Option 1: PostgreSQL pg_cron Extension

If your Postgres instance supports the pg_cron extension, you can easily set up scheduled tasks within the database:

1. Enable the pg_cron extension:
   ```sql
   CREATE EXTENSION pg_cron;
   ```

2. Set up scheduled tasks from the stored configurations:
   ```sql
   DO $$
   DECLARE 
     task RECORD;
   BEGIN
     FOR task IN SELECT key, value FROM system_settings WHERE category = 'scheduled_tasks' AND value->>'enabled' = 'true'
     LOOP
       -- Check if job exists
       IF NOT EXISTS (SELECT 1 FROM pg_cron.job WHERE command = task.value->>'command') THEN
         PERFORM cron.schedule(
           task.value->>'name', 
           task.value->>'schedule', 
           task.value->>'command'
         );
       END IF;
     END LOOP;
   END
   $$;
   ```

### Option 2: External Scheduler with Supabase Edge Functions

For deployments using Supabase or other platforms where pg_cron isn't available, you can use Edge Functions with an external scheduler:

1. Create an Edge Function to run scheduled tasks:

```typescript
// supabase/functions/run-scheduled-task/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

Deno.serve(async (req) => {
  try {
    const { taskKey } = await req.json();
    
    if (!taskKey) {
      return new Response(
        JSON.stringify({ error: 'Missing taskKey parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get task configuration
    const { data: taskConfig, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('category', 'scheduled_tasks')
      .eq('key', taskKey)
      .single();
    
    if (error || !taskConfig) {
      return new Response(
        JSON.stringify({ error: `Task configuration not found: ${error?.message}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (taskConfig.value.enabled !== true) {
      return new Response(
        JSON.stringify({ message: 'Task is disabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Execute the command
    const command = taskConfig.value.command;
    const { data: result, error: execError } = await supabase.rpc(
      command.startsWith('CALL ') ? command.substring(5).replace('()', '') : command.replace('()', ''),
      {}
    );
    
    if (execError) {
      throw execError;
    }
    
    // Update last run time
    await supabase
      .from('system_settings')
      .update({
        value: {
          ...taskConfig.value,
          last_run: new Date().toISOString()
        }
      })
      .eq('category', 'scheduled_tasks')
      .eq('key', taskKey);
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error running scheduled task:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Task execution failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

2. Set up a cron job on an external scheduler (e.g., GitHub Actions, Vercel Cron, or a dedicated server) to trigger this function:

```yaml
# Example GitHub Actions workflow
name: Run Scheduled Tasks

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  process-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reports processing
        run: |
          curl -X POST "${{ secrets.SUPABASE_FUNCTION_URL }}/run-scheduled-task" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{"taskKey": "reports_processor"}'
```

### Option 3: Manual Execution

For testing or one-off runs, you can manually execute procedures:

```sql
-- Process scheduled reports
CALL process_scheduled_reports();

-- Update adaptive rate limits
SELECT update_adaptive_rate_limits('api/analyze');
```

## Key Scheduled Tasks

| Task Key | Description | Default Schedule | Procedure |
|----------|-------------|------------------|-----------|
| reports_processor | Processes due scheduled reports | */5 * * * * | process_scheduled_reports() |
| archive_old_reports | Archives old reports | 0 2 * * 0 | archive_old_reports() |
| update_rate_limits | Updates adaptive rate limits | */15 * * * * | update_all_rate_limits() |
| system_health_check | Monitors system health | */10 * * * * | check_system_health() |

## Troubleshooting

If scheduled tasks aren't executing properly:

1. Check the system_settings table to verify task configurations:
   ```sql
   SELECT * FROM system_settings WHERE category = 'scheduled_tasks';
   ```

2. For pg_cron jobs, check if they're correctly configured:
   ```sql
   SELECT * FROM pg_cron.job;
   ```

3. For external scheduler implementations, check the logs of your cron service. 