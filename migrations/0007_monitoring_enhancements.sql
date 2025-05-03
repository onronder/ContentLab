-- Migration number: 0007 Monitoring Enhancements

-- Create a function to get job statistics
CREATE OR REPLACE FUNCTION get_job_statistics()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  pending_count INTEGER;
  active_count INTEGER;
  completed_count INTEGER;
  failed_count INTEGER;
  avg_time NUMERIC;
BEGIN
  -- Get count of pending jobs
  SELECT COUNT(*) 
  INTO pending_count
  FROM analysis_jobs
  WHERE status = 'PENDING';
  
  -- Get count of active jobs
  SELECT COUNT(*) 
  INTO active_count
  FROM analysis_jobs
  WHERE status = 'PROCESSING';
  
  -- Get count of completed jobs in the last 24 hours
  SELECT COUNT(*) 
  INTO completed_count
  FROM analysis_jobs
  WHERE 
    status = 'COMPLETED'
    AND completed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
  
  -- Get count of failed jobs in the last 24 hours
  SELECT COUNT(*) 
  INTO failed_count
  FROM analysis_jobs
  WHERE 
    status = 'ERROR'
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
  
  -- Get average completion time in minutes
  SELECT 
    EXTRACT(EPOCH FROM AVG(completed_at - created_at)) / 60
  INTO avg_time
  FROM analysis_jobs
  WHERE 
    status = 'COMPLETED'
    AND completed_at > CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  -- Return as a JSON object
  RETURN jsonb_build_object(
    'pending_jobs', pending_count,
    'active_jobs', active_count,
    'completed_jobs_24h', completed_count,
    'failed_jobs_24h', failed_count,
    'avg_completion_time', COALESCE(avg_time, 0)
  );
END;
$$;

-- Create a trigger function to record job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only log changes to the 'status' column
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO job_status_log (
      job_id, 
      previous_status, 
      new_status, 
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CURRENT_TIMESTAMP
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a table to log job status changes
CREATE TABLE IF NOT EXISTS job_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES analysis_jobs(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes to the job_status_log table
CREATE INDEX IF NOT EXISTS idx_job_status_log_job_id ON job_status_log(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_log_changed_at ON job_status_log(changed_at);

-- Create a trigger to log job status changes
DROP TRIGGER IF EXISTS job_status_change_trigger ON analysis_jobs;
CREATE TRIGGER job_status_change_trigger
AFTER UPDATE OF status ON analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION log_job_status_change();

-- Create an alert log table to track sent alerts
CREATE TABLE IF NOT EXISTS alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_id TEXT,
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  email_sent BOOLEAN DEFAULT FALSE,
  webhook_sent BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);

-- Add indexes to the alert_log table
CREATE INDEX IF NOT EXISTS idx_alert_log_type ON alert_log(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_log_created_at ON alert_log(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_log_resolved ON alert_log(resolved);

-- Create a function to register an alert
CREATE OR REPLACE FUNCTION register_alert(
  p_alert_type TEXT,
  p_description TEXT,
  p_entity_id TEXT,
  p_severity TEXT DEFAULT 'warning'
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Check if a similar unresolved alert already exists
  SELECT id INTO v_alert_id
  FROM alert_log
  WHERE 
    alert_type = p_alert_type
    AND entity_id = p_entity_id
    AND resolved = FALSE
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
  
  -- If no existing alert, create a new one
  IF v_alert_id IS NULL THEN
    INSERT INTO alert_log (
      alert_type,
      description,
      entity_id,
      severity
    ) VALUES (
      p_alert_type,
      p_description,
      p_entity_id,
      p_severity
    ) RETURNING id INTO v_alert_id;
  END IF;
  
  RETURN v_alert_id;
END;
$$;

-- Create a function to mark an alert as resolved
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE alert_log
  SET 
    resolved = TRUE,
    resolved_at = CURRENT_TIMESTAMP
  WHERE id = p_alert_id AND resolved = FALSE;
  
  RETURN FOUND;
END;
$$;

-- Create a function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  unhealthy_workers_count INTEGER;
  stuck_jobs_count INTEGER;
  high_resource_workers_count INTEGER;
  overall_status TEXT := 'healthy';
  issues_found JSONB := '[]'::JSONB;
BEGIN
  -- Check worker health
  SELECT COUNT(*) 
  INTO unhealthy_workers_count
  FROM worker_health
  WHERE status != 'HEALTHY';
  
  -- Check for stuck jobs
  SELECT COUNT(*) 
  INTO stuck_jobs_count
  FROM analysis_jobs
  WHERE 
    status = 'PENDING'
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes';
  
  -- Check for high resource usage
  SELECT COUNT(*) 
  INTO high_resource_workers_count
  FROM worker_health
  WHERE cpu_usage > 80 OR memory_usage > 80;
  
  -- Build list of issues
  IF unhealthy_workers_count > 0 THEN
    issues_found = issues_found || jsonb_build_object(
      'type', 'unhealthy_workers',
      'count', unhealthy_workers_count,
      'severity', 'critical'
    );
    overall_status := 'critical';
  END IF;
  
  IF stuck_jobs_count > 0 THEN
    issues_found = issues_found || jsonb_build_object(
      'type', 'stuck_jobs',
      'count', stuck_jobs_count,
      'severity', 'warning'
    );
    
    IF overall_status != 'critical' THEN
      overall_status := 'warning';
    END IF;
  END IF;
  
  IF high_resource_workers_count > 0 THEN
    issues_found = issues_found || jsonb_build_object(
      'type', 'high_resource_usage',
      'count', high_resource_workers_count,
      'severity', 'warning'
    );
    
    IF overall_status != 'critical' THEN
      overall_status := 'warning';
    END IF;
  END IF;
  
  -- Return system health status
  RETURN jsonb_build_object(
    'status', overall_status,
    'timestamp', CURRENT_TIMESTAMP,
    'issues', issues_found,
    'unhealthy_workers', unhealthy_workers_count,
    'stuck_jobs', stuck_jobs_count,
    'high_resource_workers', high_resource_workers_count
  );
END;
$$;

-- Create a table to log scheduled checks
CREATE TABLE IF NOT EXISTS scheduled_check_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes to the scheduled_check_log table
CREATE INDEX IF NOT EXISTS idx_scheduled_check_log_check_type ON scheduled_check_log(check_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_check_log_created_at ON scheduled_check_log(created_at); 