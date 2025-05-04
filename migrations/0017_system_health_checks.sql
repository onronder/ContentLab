-- Migration number: 0017 System Health Checks

-- Function to check system health and report issues
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_unhealthy_workers_count INTEGER;
  v_stuck_jobs_count INTEGER;
  v_high_resource_workers_count INTEGER;
  v_rate_limited_endpoints_count INTEGER;
  v_issues_found JSONB := '[]'::jsonb;
  v_overall_status TEXT := 'healthy';
BEGIN
  -- Check worker health
  SELECT COUNT(*) 
  INTO v_unhealthy_workers_count
  FROM worker_health
  WHERE status != 'ACTIVE' AND last_heartbeat > CURRENT_TIMESTAMP - INTERVAL '1 hour';
  
  -- Check for stuck jobs
  SELECT COUNT(*) 
  INTO v_stuck_jobs_count
  FROM analysis_jobs
  WHERE 
    status = 'PROCESSING'
    AND started_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes';
  
  -- Check for high resource usage
  SELECT COUNT(*) 
  INTO v_high_resource_workers_count
  FROM worker_health
  WHERE (cpu_usage > 90 OR memory_usage > 90)
    AND last_heartbeat > CURRENT_TIMESTAMP - INTERVAL '15 minutes';
  
  -- Check for rate-limited endpoints
  SELECT COUNT(DISTINCT endpoint)
  INTO v_rate_limited_endpoints_count
  FROM rate_limit_events
  WHERE limited_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes';
  
  -- Build list of issues
  IF v_unhealthy_workers_count > 0 THEN
    v_issues_found = v_issues_found || jsonb_build_object(
      'type', 'unhealthy_workers',
      'count', v_unhealthy_workers_count,
      'severity', 'critical',
      'message', 'Unhealthy workers detected'
    );
    v_overall_status := 'critical';
  END IF;
  
  IF v_stuck_jobs_count > 0 THEN
    v_issues_found = v_issues_found || jsonb_build_object(
      'type', 'stuck_jobs',
      'count', v_stuck_jobs_count,
      'severity', 'warning',
      'message', 'Jobs have been stuck in processing state for over 30 minutes'
    );
    
    IF v_overall_status != 'critical' THEN
      v_overall_status := 'warning';
    END IF;
  END IF;
  
  IF v_high_resource_workers_count > 0 THEN
    v_issues_found = v_issues_found || jsonb_build_object(
      'type', 'high_resource_usage',
      'count', v_high_resource_workers_count,
      'severity', 'warning',
      'message', 'Workers with high resource usage detected'
    );
    
    IF v_overall_status != 'critical' THEN
      v_overall_status := 'warning';
    END IF;
  END IF;
  
  IF v_rate_limited_endpoints_count > 0 THEN
    v_issues_found = v_issues_found || jsonb_build_object(
      'type', 'rate_limited_endpoints',
      'count', v_rate_limited_endpoints_count,
      'severity', 'info',
      'message', 'Endpoints experiencing rate limiting'
    );
  END IF;
  
  -- Log this health check
  INSERT INTO scheduled_check_log (
    check_type,
    result
  ) VALUES (
    'system_health',
    jsonb_build_object(
      'status', v_overall_status,
      'timestamp', CURRENT_TIMESTAMP,
      'issues', v_issues_found,
      'metrics', jsonb_build_object(
        'unhealthy_workers', v_unhealthy_workers_count,
        'stuck_jobs', v_stuck_jobs_count,
        'high_resource_workers', v_high_resource_workers_count,
        'rate_limited_endpoints', v_rate_limited_endpoints_count
      )
    )
  );
  
  -- When issues are critical, also create an alert
  IF v_overall_status = 'critical' THEN
    INSERT INTO alert_log (
      alert_type,
      description,
      entity_id,
      severity
    ) VALUES (
      'system_health',
      'Critical system health issues detected',
      'system',
      'critical'
    );
  END IF;
  
  -- Register this as a system task
  INSERT INTO system_settings (category, key, value, description, is_public)
  VALUES (
    'scheduled_tasks',
    'system_health_check',
    jsonb_build_object(
      'name', 'system_health_monitor',
      'schedule', '*/10 * * * *',
      'command', 'SELECT check_system_health()',
      'enabled', true,
      'last_run', NULL
    ),
    'Checks system health every 10 minutes and records results',
    false
  ) ON CONFLICT (category, key) DO UPDATE
  SET value = jsonb_build_object(
    'name', 'system_health_monitor',
    'schedule', '*/10 * * * *',
    'command', 'SELECT check_system_health()',
    'enabled', true,
    'last_run', system_settings.value->'last_run'
  );
  
  -- Return system health status
  RETURN jsonb_build_object(
    'status', v_overall_status,
    'timestamp', CURRENT_TIMESTAMP,
    'issues', v_issues_found,
    'metrics', jsonb_build_object(
      'unhealthy_workers', v_unhealthy_workers_count,
      'stuck_jobs', v_stuck_jobs_count,
      'high_resource_workers', v_high_resource_workers_count,
      'rate_limited_endpoints', v_rate_limited_endpoints_count
    )
  );
END;
$$; 