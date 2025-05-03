-- Migration number: 0003 Background Processing Support 

-- Rename the analysis_results table to analysis_jobs to match the actual usage
ALTER TABLE IF EXISTS analysis_results RENAME TO analysis_jobs;

-- Add additional indexes for efficient background processing
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status_created_at ON analysis_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status_started_at ON analysis_jobs(status, started_at);

-- Add processing time tracking
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS processing_time INTERVAL;

-- Create a history table to track job state changes (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message TEXT,
  
  CONSTRAINT job_history_status_check CHECK (status_to IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- Add indexing for job history
CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_changed_at ON job_history(changed_at);

-- Add RLS policies for job_history
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_history_select_policy ON job_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM analysis_jobs
    WHERE analysis_jobs.id = job_history.job_id
    AND analysis_jobs.user_id = auth.uid()
  ));

-- Create a function to track job status changes
CREATE OR REPLACE FUNCTION track_job_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO job_history (job_id, status_from, status_to, message)
    VALUES (NEW.id, OLD.status, NEW.status, 
      CASE 
        WHEN NEW.status = 'FAILED' THEN NEW.error_message
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS job_status_change ON analysis_jobs;
CREATE TRIGGER job_status_change
  AFTER UPDATE ON analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION track_job_status_changes();

-- Add job priority support
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_priority ON analysis_jobs(priority);

-- Create a table for worker health monitoring
CREATE TABLE IF NOT EXISTS worker_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  jobs_processed INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  metadata JSONB,
  
  CONSTRAINT worker_health_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAILED'))
);

-- Add indexing for worker health
CREATE INDEX IF NOT EXISTS idx_worker_health_last_heartbeat ON worker_health(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_worker_health_status ON worker_health(status);

-- Create a function to update processing_time when a job is completed
CREATE OR REPLACE FUNCTION update_job_processing_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('COMPLETED', 'FAILED') AND NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
    NEW.processing_time = NEW.completed_at - NEW.started_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS job_update_processing_time ON analysis_jobs;
CREATE TRIGGER job_update_processing_time
  BEFORE UPDATE ON analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_processing_time(); 