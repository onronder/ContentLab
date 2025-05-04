-- Migration number: 0015 Scheduled Reports

-- Create table for scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  recipient_emails TEXT[],
  parameters JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly'))
);

-- Add indexing for scheduled reports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user_id ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run) WHERE is_active = TRUE;

-- Add RLS policies for scheduled reports
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own scheduled reports
CREATE POLICY scheduled_reports_select_policy ON scheduled_reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only allow users to insert/update/delete their own scheduled reports
CREATE POLICY scheduled_reports_all_policy ON scheduled_reports
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create table for report execution history
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  recipient_emails TEXT[],
  report_url TEXT,
  error_message TEXT,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add indexing for report executions
CREATE INDEX IF NOT EXISTS idx_report_executions_scheduled_report_id ON report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);

-- Add RLS policies for report executions
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own report executions
CREATE POLICY report_executions_select_policy ON report_executions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scheduled_reports
    WHERE scheduled_reports.id = report_executions.scheduled_report_id
    AND scheduled_reports.user_id = auth.uid()
  ));

-- Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency TEXT,
  p_last_run TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
BEGIN
  -- If no last run, start from now
  IF p_last_run IS NULL THEN
    p_last_run := CURRENT_TIMESTAMP;
  END IF;
  
  -- Calculate next run based on frequency
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_run := p_last_run + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_next_run := p_last_run + INTERVAL '1 week';
    WHEN 'monthly' THEN
      v_next_run := p_last_run + INTERVAL '1 month';
    ELSE
      -- Default to daily if invalid frequency
      v_next_run := p_last_run + INTERVAL '1 day';
  END CASE;
  
  RETURN v_next_run;
END;
$$;

-- Function to get due reports
CREATE OR REPLACE FUNCTION get_due_reports()
RETURNS TABLE (
  report_id UUID,
  report_name TEXT,
  report_type TEXT,
  user_id UUID,
  parameters JSONB,
  recipient_emails TEXT[]
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id AS report_id,
    sr.name AS report_name,
    sr.report_type,
    sr.user_id,
    sr.parameters,
    sr.recipient_emails
  FROM scheduled_reports sr
  WHERE
    sr.is_active = TRUE
    AND sr.next_run <= CURRENT_TIMESTAMP
    AND NOT EXISTS (
      -- Ensure no pending or processing executions exist for this report
      SELECT 1
      FROM report_executions re
      WHERE
        re.scheduled_report_id = sr.id
        AND re.status IN ('pending', 'processing')
    );
END;
$$;

-- Function to update report status after execution
CREATE OR REPLACE FUNCTION update_report_schedule(
  p_report_id UUID,
  p_execution_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_report_url TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  -- Update the execution record
  UPDATE report_executions
  SET
    status = p_status,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END,
    error_message = p_error_message,
    report_url = p_report_url
  WHERE id = p_execution_id;
  
  -- If completed successfully, update the scheduled report's last/next run
  IF p_status = 'completed' THEN
    UPDATE scheduled_reports
    SET
      last_run = CURRENT_TIMESTAMP,
      next_run = calculate_next_run(frequency, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_report_id;
  END IF;
END;
$$;

-- Function to schedule a report and get its next execution time
CREATE OR REPLACE FUNCTION schedule_report(
  p_name TEXT,
  p_description TEXT,
  p_report_type TEXT,
  p_frequency TEXT,
  p_recipient_emails TEXT[],
  p_parameters JSONB DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Insert new scheduled report
  INSERT INTO scheduled_reports (
    user_id,
    name,
    description,
    report_type,
    frequency,
    next_run,
    recipient_emails,
    parameters
  ) VALUES (
    auth.uid(),
    p_name,
    p_description,
    p_report_type,
    p_frequency,
    calculate_next_run(p_frequency),
    p_recipient_emails,
    p_parameters
  ) RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;

-- Create reports view for users
CREATE OR REPLACE VIEW user_scheduled_reports AS
SELECT
  sr.id,
  sr.name,
  sr.description,
  sr.report_type,
  sr.frequency,
  sr.next_run,
  sr.last_run,
  sr.is_active,
  sr.created_at,
  sr.updated_at,
  sr.recipient_emails,
  sr.parameters,
  (
    SELECT json_build_object(
      'status', COALESCE(re.status, 'none'),
      'started_at', re.started_at,
      'completed_at', re.completed_at,
      'report_url', re.report_url
    )
    FROM report_executions re
    WHERE re.scheduled_report_id = sr.id
    ORDER BY re.started_at DESC
    LIMIT 1
  ) AS last_execution
FROM scheduled_reports sr
WHERE sr.user_id = auth.uid();

-- Create procedure to generate and queue due reports
CREATE OR REPLACE PROCEDURE process_scheduled_reports()
LANGUAGE plpgsql AS $$
DECLARE
  v_report RECORD;
  v_execution_id UUID;
BEGIN
  FOR v_report IN SELECT * FROM get_due_reports()
  LOOP
    -- Create a new execution record
    INSERT INTO report_executions (
      scheduled_report_id,
      status,
      recipient_emails
    ) VALUES (
      v_report.report_id,
      'pending',
      v_report.recipient_emails
    ) RETURNING id INTO v_execution_id;
    
    -- Insert into job queue for processing
    INSERT INTO analysis_jobs (
      user_id,
      status,
      job_type,
      parameters,
      priority,
      related_id
    ) VALUES (
      v_report.user_id,
      'PENDING',
      'scheduled_report',
      jsonb_build_object(
        'report_type', v_report.report_type,
        'report_id', v_report.report_id,
        'execution_id', v_execution_id,
        'parameters', v_report.parameters
      ),
      2, -- Higher priority than standard analysis jobs
      v_execution_id
    );
  END LOOP;
END;
$$;

-- Create a system_settings entry to track scheduled job information
-- This avoids direct dependency on pg_cron
INSERT INTO system_settings (category, key, value, description, is_public)
VALUES (
  'scheduled_tasks',
  'reports_processor',
  jsonb_build_object(
    'name', 'scheduled_reports_processor',
    'schedule', '*/5 * * * *',
    'command', 'CALL process_scheduled_reports()',
    'enabled', true,
    'last_run', NULL
  ),
  'Configuration for the scheduled reports processor that runs every 5 minutes',
  false
) ON CONFLICT (category, key) DO UPDATE
SET value = jsonb_build_object(
  'name', 'scheduled_reports_processor',
  'schedule', '*/5 * * * *',
  'command', 'CALL process_scheduled_reports()',
  'enabled', true,
  'last_run', system_settings.value->'last_run'
);

-- This comment provides information for manual setup of the cron job:
-- To enable scheduled report processing, manually run:
-- 
-- If using pg_cron extension:
-- SELECT cron.schedule('scheduled_reports_processor', '*/5 * * * *', 'CALL process_scheduled_reports()');
--
-- If using an external scheduler (like Supabase Edge Functions):
-- Create a function that calls the process_scheduled_reports() procedure every 5 minutes 