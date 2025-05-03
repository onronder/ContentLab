-- Migration number: 0006 Data Management Enhancement

-- Create an archive table for old analysis reports
CREATE TABLE IF NOT EXISTS analysis_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  content JSONB,
  competitors JSONB,
  results JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries on archived data
CREATE INDEX IF NOT EXISTS idx_analysis_archives_user_id ON analysis_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_archives_created_at ON analysis_archives(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_archives_archived_at ON analysis_archives(archived_at);

-- Add version column to analysis_jobs for data versioning
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS archive_eligible_at TIMESTAMPTZ;

-- Create function to mark old reports as eligible for archiving (90 days)
CREATE OR REPLACE FUNCTION mark_eligible_for_archiving()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE analysis_jobs
  SET archive_eligible_at = CURRENT_TIMESTAMP
  WHERE 
    status = 'COMPLETED' 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND archive_eligible_at IS NULL
    AND archived = FALSE;
END;
$$;

-- Function to archive old reports
CREATE OR REPLACE FUNCTION archive_old_reports()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Insert eligible jobs into archive table
  INSERT INTO analysis_archives(
    original_id, user_id, url, status, created_at, 
    completed_at, error_message, content, competitors, results
  )
  SELECT 
    id, user_id, user_url, status, created_at, 
    completed_at, error_message, content, competitors, results
  FROM analysis_jobs
  WHERE 
    archive_eligible_at IS NOT NULL
    AND archived = FALSE
    AND archive_eligible_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  -- Get number of records affected
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Mark original records as archived
  UPDATE analysis_jobs
  SET archived = TRUE
  WHERE 
    archive_eligible_at IS NOT NULL
    AND archived = FALSE
    AND archive_eligible_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  RETURN archived_count;
END;
$$;

-- Function to permanently delete very old archived data (180 days)
CREATE OR REPLACE FUNCTION cleanup_old_archives()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete very old archives
  DELETE FROM analysis_archives
  WHERE archived_at < CURRENT_TIMESTAMP - INTERVAL '180 days';
  
  -- Get number of records affected
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create a scheduled task to run data cleanup operations (runs daily)
-- Note: This uses pg_cron, which needs to be enabled in your database
-- If pg_cron is not available, you can run this manually or via an external scheduler
DO $$
BEGIN
  -- Only create if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Check if job already exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_cron.job WHERE command LIKE '%mark_eligible_for_archiving%') THEN
      -- Schedule daily check to mark eligible reports for archiving
      PERFORM pg_cron.schedule('0 1 * * *', 'SELECT mark_eligible_for_archiving()');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_cron.job WHERE command LIKE '%archive_old_reports%') THEN
      -- Schedule weekly archiving job
      PERFORM pg_cron.schedule('0 2 * * 0', 'SELECT archive_old_reports()');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_cron.job WHERE command LIKE '%cleanup_old_archives%') THEN
      -- Schedule monthly cleanup of very old archives
      PERFORM pg_cron.schedule('0 3 1 * *', 'SELECT cleanup_old_archives()');
    END IF;
  END IF;
END $$;

-- Create a function to handle report versioning
CREATE OR REPLACE FUNCTION create_analysis_version(
  p_job_id UUID
) 
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_new_job_id UUID;
  v_current_version INTEGER;
BEGIN
  -- Get current version
  SELECT version INTO v_current_version
  FROM analysis_jobs
  WHERE id = p_job_id;
  
  -- Create a new version of the analysis job
  INSERT INTO analysis_jobs(
    user_id, user_url, status, competitors, version
  )
  SELECT 
    user_id, user_url, 'PENDING', competitors, v_current_version + 1
  FROM analysis_jobs
  WHERE id = p_job_id
  RETURNING id INTO v_new_job_id;
  
  RETURN v_new_job_id;
END;
$$;

-- Create a function to get versions of a report by URL
CREATE OR REPLACE FUNCTION get_analysis_versions(
  p_user_id UUID,
  p_url TEXT
)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) LANGUAGE SQL AS $$
  SELECT 
    id, version, status, created_at, completed_at
  FROM analysis_jobs
  WHERE 
    user_id = p_user_id
    AND user_url = p_url
  ORDER BY version DESC;
$$; 