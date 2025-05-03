-- Migration for geographic distribution of processing resources
-- Enables job routing to workers in specific regions for improved latency and redundancy

-- Create a table for regions where our workers can be deployed
CREATE TABLE IF NOT EXISTS worker_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  location TEXT NOT NULL,  -- e.g., "us-east", "eu-west"
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100, -- Lower number = higher priority
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_worker_regions_updated ON worker_regions;
CREATE TRIGGER set_worker_regions_updated
BEFORE UPDATE ON worker_regions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_worker_regions_is_active ON worker_regions(is_active);
CREATE INDEX IF NOT EXISTS idx_worker_regions_priority ON worker_regions(priority);

-- Insert default regions
INSERT INTO worker_regions (name, display_name, location, priority)
VALUES 
  ('us-east', 'US East (N. Virginia)', 'us-east-1', 10),
  ('us-west', 'US West (Oregon)', 'us-west-2', 20),
  ('eu-central', 'EU Central (Frankfurt)', 'eu-central-1', 30),
  ('ap-southeast', 'Asia Pacific (Singapore)', 'ap-southeast-1', 40)
ON CONFLICT (name) DO NOTHING;

-- Add region support to worker_health table
ALTER TABLE worker_health ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES worker_regions(id);
ALTER TABLE worker_health ADD COLUMN IF NOT EXISTS latency_ms INTEGER; -- Measured latency of this worker

-- Create table for worker capacity management
CREATE TABLE IF NOT EXISTS worker_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES worker_regions(id),
  max_workers INTEGER NOT NULL DEFAULT 5,
  current_workers INTEGER NOT NULL DEFAULT 0,
  target_workers INTEGER NOT NULL DEFAULT 3,
  auto_scaling BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (region_id)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_worker_capacity_updated ON worker_capacity;
CREATE TRIGGER set_worker_capacity_updated
BEFORE UPDATE ON worker_capacity
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert default capacity settings for each region
INSERT INTO worker_capacity (region_id, max_workers, current_workers, target_workers)
SELECT id, 5, 0, 3 FROM worker_regions
ON CONFLICT (region_id) DO NOTHING;

-- Add region information to analysis_jobs table
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES worker_regions(id);
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS region_assigned_at TIMESTAMPTZ;

-- Function to get the best region for a new job based on:
-- 1. User's geographic location (if available)
-- 2. Current worker capacity and load distribution
-- 3. Region priority settings
CREATE OR REPLACE FUNCTION assign_job_region(
  p_job_id UUID,
  p_client_region TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_region_id UUID;
  v_client_region_id UUID;
BEGIN
  -- Try to match client region first if provided
  IF p_client_region IS NOT NULL THEN
    SELECT id INTO v_client_region_id
    FROM worker_regions
    WHERE 
      location ILIKE (p_client_region || '%') 
      AND is_active = TRUE;
      
    IF v_client_region_id IS NOT NULL THEN
      v_region_id := v_client_region_id;
    END IF;
  END IF;
  
  -- If no client region match, find region with best capacity
  IF v_region_id IS NULL THEN
    SELECT wr.id INTO v_region_id
    FROM worker_regions wr
    JOIN worker_capacity wc ON wr.id = wc.region_id
    JOIN worker_health wh ON wr.id = wh.region_id
    WHERE 
      wr.is_active = TRUE
      AND wh.status = 'ACTIVE'  -- Only consider regions with active workers
    GROUP BY wr.id, wr.priority, wc.current_workers, wc.max_workers
    ORDER BY 
      -- Prioritize regions with lower job counts relative to capacity
      (SELECT COUNT(*) FROM analysis_jobs 
       WHERE region_id = wr.id AND status = 'PROCESSING') / 
       GREATEST(wc.current_workers, 1) ASC,
      wr.priority ASC  -- Then consider priority setting
    LIMIT 1;
  END IF;
  
  -- If still no region found, use any active region as fallback
  IF v_region_id IS NULL THEN
    SELECT id INTO v_region_id
    FROM worker_regions
    WHERE is_active = TRUE
    ORDER BY priority ASC
    LIMIT 1;
  END IF;
  
  -- Update the job with the assigned region
  IF v_region_id IS NOT NULL THEN
    UPDATE analysis_jobs
    SET 
      region_id = v_region_id,
      region_assigned_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
  END IF;
  
  RETURN v_region_id;
END;
$$;

-- Function to track worker region performance
CREATE OR REPLACE FUNCTION update_worker_region_stats()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  -- Update worker counts by region
  UPDATE worker_capacity wc
  SET 
    current_workers = subquery.worker_count,
    updated_at = CURRENT_TIMESTAMP
  FROM (
    SELECT 
      region_id, 
      COUNT(*) as worker_count
    FROM worker_health
    WHERE status = 'ACTIVE'
    GROUP BY region_id
  ) AS subquery
  WHERE wc.region_id = subquery.region_id;
  
  -- Set 0 for regions with no active workers
  UPDATE worker_capacity
  SET 
    current_workers = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE 
    region_id NOT IN (
      SELECT DISTINCT region_id 
      FROM worker_health 
      WHERE status = 'ACTIVE'
    );
END;
$$;

-- Function to get job counts by region for load balancing
CREATE OR REPLACE FUNCTION get_region_job_stats()
RETURNS TABLE (
  region_id UUID,
  region_name TEXT,
  active_workers INTEGER,
  pending_jobs INTEGER,
  processing_jobs INTEGER,
  jobs_per_worker NUMERIC,
  priority INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wr.id AS region_id,
    wr.name AS region_name,
    COALESCE(wc.current_workers, 0) AS active_workers,
    COUNT(aj.id) FILTER (WHERE aj.status = 'PENDING') AS pending_jobs,
    COUNT(aj.id) FILTER (WHERE aj.status = 'PROCESSING') AS processing_jobs,
    CASE 
      WHEN COALESCE(wc.current_workers, 0) > 0 THEN 
        COUNT(aj.id) FILTER (WHERE aj.status IN ('PENDING', 'PROCESSING'))::NUMERIC / wc.current_workers
      ELSE 0
    END AS jobs_per_worker,
    wr.priority
  FROM 
    worker_regions wr
  LEFT JOIN 
    worker_capacity wc ON wr.id = wc.region_id
  LEFT JOIN 
    analysis_jobs aj ON wr.id = aj.region_id
  WHERE 
    wr.is_active = TRUE
  GROUP BY 
    wr.id, wr.name, wc.current_workers, wr.priority
  ORDER BY 
    wr.priority ASC;
END;
$$;

-- Create a view for monitoring region status
CREATE OR REPLACE VIEW region_status AS
SELECT 
  wr.id,
  wr.name,
  wr.display_name,
  wr.location,
  wr.is_active,
  wr.priority,
  wc.max_workers,
  wc.current_workers,
  wc.target_workers,
  wc.auto_scaling,
  COUNT(wh.id) FILTER (WHERE wh.status = 'ACTIVE') AS active_workers,
  COUNT(wh.id) FILTER (WHERE wh.status = 'INACTIVE') AS inactive_workers,
  COUNT(wh.id) FILTER (WHERE wh.status = 'FAILED') AS failed_workers,
  COUNT(aj.id) FILTER (WHERE aj.status = 'PENDING') AS pending_jobs,
  COUNT(aj.id) FILTER (WHERE aj.status = 'PROCESSING') AS processing_jobs,
  AVG(wh.latency_ms) FILTER (WHERE wh.status = 'ACTIVE') AS avg_latency_ms
FROM 
  worker_regions wr
LEFT JOIN 
  worker_capacity wc ON wr.id = wc.region_id
LEFT JOIN 
  worker_health wh ON wr.id = wh.region_id
LEFT JOIN 
  analysis_jobs aj ON wr.id = aj.region_id
GROUP BY 
  wr.id, wr.name, wr.display_name, wr.location, wr.is_active, wr.priority,
  wc.max_workers, wc.current_workers, wc.target_workers, wc.auto_scaling
ORDER BY 
  wr.priority ASC; 