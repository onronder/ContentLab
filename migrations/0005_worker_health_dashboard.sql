-- Migration number: 0005 Worker Health Dashboard Enhancement

-- Add worker_health table if it doesn't exist already
CREATE TABLE IF NOT EXISTS worker_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL UNIQUE,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAILED')),
  jobs_processed INTEGER NOT NULL DEFAULT 0,
  jobs_failed INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  cpu_usage FLOAT,
  memory_usage FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create worker_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS worker_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES worker_health(id),
  status TEXT NOT NULL,
  previous_status TEXT,
  last_heartbeat TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on worker_status_history for efficient queries
CREATE INDEX IF NOT EXISTS idx_worker_status_history_worker_id ON worker_status_history(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_status_history_created_at ON worker_status_history(created_at);

-- Create updated_at trigger for worker_health
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_worker_health_updated ON worker_health;
CREATE TRIGGER set_worker_health_updated
BEFORE UPDATE ON worker_health
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to get worker statistics
CREATE OR REPLACE FUNCTION get_worker_stats()
RETURNS TABLE (
  total BIGINT,
  active BIGINT,
  inactive BIGINT,
  failed BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed
  FROM worker_health;
$$;

-- Function to get worker details with status and uptime
CREATE OR REPLACE FUNCTION get_worker_details()
RETURNS TABLE (
  id UUID,
  worker_id TEXT,
  status TEXT,
  last_heartbeat TIMESTAMPTZ,
  uptime_hours FLOAT,
  jobs_processed INTEGER,
  jobs_failed INTEGER,
  cpu_usage FLOAT,
  memory_usage FLOAT,
  first_seen TIMESTAMPTZ
) LANGUAGE SQL AS $$
  SELECT 
    id,
    worker_id,
    status,
    last_heartbeat,
    EXTRACT(EPOCH FROM (NOW() - first_seen))/3600 as uptime_hours,
    jobs_processed,
    jobs_failed,
    cpu_usage,
    memory_usage,
    first_seen
  FROM worker_health
  ORDER BY 
    CASE status 
      WHEN 'ACTIVE' THEN 1 
      WHEN 'INACTIVE' THEN 2 
      WHEN 'FAILED' THEN 3 
    END,
    last_heartbeat DESC;
$$;

-- Function to get worker health history for timeline visualization
CREATE OR REPLACE FUNCTION get_worker_health_history(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  day DATE,
  active_count BIGINT,
  inactive_count BIGINT,
  failed_count BIGINT
) LANGUAGE SQL AS $$
  WITH days AS (
    SELECT generate_series(
      CURRENT_DATE - (p_days || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as day
  ),
  worker_status_history AS (
    SELECT 
      DATE_TRUNC('day', updated_at)::DATE as day,
      status,
      COUNT(DISTINCT id) as worker_count
    FROM worker_health
    WHERE updated_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY day, status
  )
  SELECT 
    days.day,
    COALESCE(SUM(CASE WHEN wsh.status = 'ACTIVE' THEN wsh.worker_count ELSE 0 END), 0) as active_count,
    COALESCE(SUM(CASE WHEN wsh.status = 'INACTIVE' THEN wsh.worker_count ELSE 0 END), 0) as inactive_count,
    COALESCE(SUM(CASE WHEN wsh.status = 'FAILED' THEN wsh.worker_count ELSE 0 END), 0) as failed_count
  FROM days
  LEFT JOIN worker_status_history wsh ON days.day = wsh.day
  GROUP BY days.day
  ORDER BY days.day;
$$;

-- Enhanced worker_heartbeat function to include system metrics
CREATE OR REPLACE FUNCTION worker_heartbeat(
  p_worker_id TEXT,
  p_jobs_processed INTEGER DEFAULT NULL,
  p_jobs_failed INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_cpu_usage FLOAT DEFAULT NULL,
  p_memory_usage FLOAT DEFAULT NULL
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
      status,
      cpu_usage,
      memory_usage
    ) VALUES (
      p_worker_id,
      COALESCE(p_jobs_processed, 0),
      COALESCE(p_jobs_failed, 0),
      p_metadata,
      'ACTIVE',
      p_cpu_usage,
      p_memory_usage
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
      status = 'ACTIVE',
      cpu_usage = CASE WHEN p_cpu_usage IS NOT NULL THEN p_cpu_usage ELSE cpu_usage END,
      memory_usage = CASE WHEN p_memory_usage IS NOT NULL THEN p_memory_usage ELSE memory_usage END
    WHERE id = v_worker_id;
  END IF;
  
  RETURN v_worker_id;
END;
$$; 