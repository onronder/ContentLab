-- Migration number: 0004 Worker Dashboard Support 

-- Create a function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats()
RETURNS TABLE (
  total BIGINT,
  pending BIGINT,
  processing BIGINT,
  completed BIGINT,
  failed BIGINT,
  cancelled BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
    COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
  FROM analysis_jobs;
$$;

-- Create a function to get average processing time
CREATE OR REPLACE FUNCTION get_avg_processing_time()
RETURNS TABLE (
  avg_time TEXT
) LANGUAGE SQL AS $$
  SELECT 
    TO_CHAR(AVG(processing_time), 'MI:SS') as avg_time
  FROM analysis_jobs
  WHERE status = 'COMPLETED' 
    AND processing_time IS NOT NULL;
$$;

-- Create a function to record worker heartbeats
CREATE OR REPLACE FUNCTION worker_heartbeat(
  p_worker_id TEXT,
  p_jobs_processed INTEGER DEFAULT NULL,
  p_jobs_failed INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_worker_id UUID;
BEGIN
  -- Check if worker exists
  SELECT id INTO v_worker_id
  FROM worker_health
  WHERE worker_id = p_worker_id;
  
  IF v_worker_id IS NULL THEN
    -- Create new worker record
    INSERT INTO worker_health (
      worker_id,
      jobs_processed,
      jobs_failed,
      metadata,
      status
    ) VALUES (
      p_worker_id,
      COALESCE(p_jobs_processed, 0),
      COALESCE(p_jobs_failed, 0),
      p_metadata,
      'ACTIVE'
    )
    RETURNING id INTO v_worker_id;
  ELSE
    -- Update existing worker record
    UPDATE worker_health
    SET
      last_heartbeat = CURRENT_TIMESTAMP,
      jobs_processed = CASE WHEN p_jobs_processed IS NOT NULL THEN p_jobs_processed ELSE jobs_processed END,
      jobs_failed = CASE WHEN p_jobs_failed IS NOT NULL THEN p_jobs_failed ELSE jobs_failed END,
      metadata = CASE WHEN p_metadata IS NOT NULL THEN p_metadata ELSE metadata END,
      status = 'ACTIVE'
    WHERE id = v_worker_id;
  END IF;
  
  RETURN v_worker_id;
END;
$$;

-- Create a function to get recently completed jobs
CREATE OR REPLACE FUNCTION get_recent_jobs(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time INTERVAL,
  user_url TEXT
) LANGUAGE SQL AS $$
  SELECT 
    id, 
    user_id, 
    status, 
    created_at, 
    completed_at, 
    processing_time, 
    user_url
  FROM analysis_jobs
  WHERE status IN ('COMPLETED', 'FAILED')
  ORDER BY completed_at DESC NULLS LAST
  LIMIT p_limit;
$$;

-- Create a function to get job processing statistics by day
CREATE OR REPLACE FUNCTION get_job_stats_by_day(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  day DATE,
  total BIGINT,
  completed BIGINT,
  failed BIGINT,
  avg_processing_time INTERVAL
) LANGUAGE SQL AS $$
  SELECT 
    DATE_TRUNC('day', created_at)::DATE as day,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    AVG(processing_time) FILTER (WHERE processing_time IS NOT NULL) as avg_processing_time
  FROM analysis_jobs
  WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  GROUP BY day
  ORDER BY day DESC;
$$; 