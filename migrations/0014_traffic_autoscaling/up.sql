-- Create table for tracking traffic metrics by region if not exists
CREATE TABLE IF NOT EXISTS traffic_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time TIMESTAMPTZ NOT NULL,
  endpoint TEXT NOT NULL,
  region TEXT,
  requests INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  max_latency_ms INTEGER
);

-- Create index on region and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_region_time ON traffic_metrics (region, time);

-- Create table for managing worker distribution by region if not exists
CREATE TABLE IF NOT EXISTS worker_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  active_workers INTEGER NOT NULL DEFAULT 1,
  max_workers INTEGER NOT NULL DEFAULT 10,
  min_workers INTEGER NOT NULL DEFAULT 1,
  last_scaled TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to worker_regions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'worker_regions' AND column_name = 'active_workers') THEN
    ALTER TABLE worker_regions ADD COLUMN active_workers INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'worker_regions' AND column_name = 'max_workers') THEN
    ALTER TABLE worker_regions ADD COLUMN max_workers INTEGER NOT NULL DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'worker_regions' AND column_name = 'min_workers') THEN
    ALTER TABLE worker_regions ADD COLUMN min_workers INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'worker_regions' AND column_name = 'last_scaled') THEN
    ALTER TABLE worker_regions ADD COLUMN last_scaled TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END
$$;

-- Create table for tracking auto-scaling history
CREATE TABLE IF NOT EXISTS autoscaling_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID,
  region_name TEXT NOT NULL,
  previous_workers INTEGER NOT NULL,
  new_workers INTEGER NOT NULL,
  predicted_requests INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying of scaling history
CREATE INDEX IF NOT EXISTS idx_autoscaling_history_region_time ON autoscaling_history (created_at);

-- Create function to track regional traffic
CREATE OR REPLACE FUNCTION track_regional_traffic() RETURNS TRIGGER AS $$
DECLARE
  found_id UUID;
BEGIN
  -- Try to update an existing record for the current hour
  UPDATE traffic_metrics 
  SET requests = requests + 1
  WHERE region = TG_ARGV[0] 
    AND time = date_trunc('hour', now())
  RETURNING id INTO found_id;
  
  -- If no row was updated, insert a new one
  IF found_id IS NULL THEN
    INSERT INTO traffic_metrics (region, time, endpoint, requests, errors)
    VALUES (TG_ARGV[0], date_trunc('hour', now()), 'api', 1, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add traffic metrics view for analytics
CREATE OR REPLACE VIEW traffic_analytics AS
SELECT
  region,
  time,
  SUM(requests) AS requests,
  SUM(errors) AS errors,
  AVG(avg_latency_ms) AS avg_response_time,
  MAX(p95_latency_ms) AS p95_response_time
FROM traffic_metrics
GROUP BY region, time
ORDER BY time DESC;

-- Create time-based partitioning for traffic metrics (if TimescaleDB is available)
-- Check for TimescaleDB extension and appropriate license
DO $$
DECLARE
  timescale_license TEXT;
BEGIN
  -- Check if TimescaleDB extension is available and installed
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Check TimescaleDB license
    BEGIN
      SELECT current_setting('timescaledb.license') INTO timescale_license;
    EXCEPTION WHEN OTHERS THEN
      timescale_license := 'apache';
    END;
    
    -- Create hypertable if not already done
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = '_timescaledb_internal' 
      AND tablename LIKE 'chunks_%_traffic_metrics_%'
    ) THEN
      PERFORM create_hypertable('traffic_metrics', 'time', if_not_exists => TRUE, migrate_data => TRUE);
      RAISE NOTICE 'Created hypertable for traffic_metrics';
    END IF;
    
    -- Only try to add retention policy if using Timescale license
    IF timescale_license = 'timescale' THEN
      -- Add retention policy (only works with Timescale license)
      BEGIN
        PERFORM add_retention_policy('traffic_metrics', INTERVAL '90 days', if_not_exists => TRUE);
        RAISE NOTICE 'Added retention policy to traffic_metrics';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add retention policy: %. Using manual cleanup instead.', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'TimescaleDB Apache license detected. Skipping add_retention_policy.';
      RAISE NOTICE 'You may need to implement a manual cleanup job for traffic_metrics older than 90 days.';
    END IF;
  END IF;
END
$$;

-- Create manual cleanup function for traffic_metrics when TimescaleDB license is not available
CREATE OR REPLACE FUNCTION cleanup_old_traffic_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM traffic_metrics
  WHERE time < (now() - INTERVAL '90 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps on worker changes
CREATE OR REPLACE FUNCTION update_worker_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamps
DROP TRIGGER IF EXISTS trigger_update_worker_timestamp ON worker_regions;
CREATE TRIGGER trigger_update_worker_timestamp
BEFORE UPDATE ON worker_regions
FOR EACH ROW
EXECUTE FUNCTION update_worker_timestamp();

-- First drop the region_status view if it exists
DROP VIEW IF EXISTS region_status CASCADE;

-- Add regional status view for monitoring
CREATE OR REPLACE VIEW region_status AS
SELECT
  w.id,
  w.name,
  w.display_name,
  w.location,
  w.is_active,
  w.priority,
  w.max_workers,
  w.active_workers as current_workers,
  w.active_workers as target_workers,
  true as auto_scaling,
  COALESCE(t.req, 0) AS recent_requests,
  COALESCE(t.err, 0) AS recent_errors,
  COALESCE(count(wh.id) FILTER (WHERE wh.status = 'active'), 0) as active_workers,
  COALESCE(count(wh.id) FILTER (WHERE wh.status = 'inactive'), 0) as inactive_workers,
  COALESCE(count(wh.id) FILTER (WHERE wh.status = 'failed'), 0) as failed_workers,
  COALESCE(avg(wh.latency_ms), 0) as avg_latency_ms
FROM worker_regions w
LEFT JOIN (
  SELECT
    region,
    SUM(requests) AS req,
    SUM(errors) AS err
  FROM traffic_metrics
  WHERE time > now() - INTERVAL '15 minutes'
  GROUP BY region
) t ON w.name = t.region
LEFT JOIN worker_health wh ON w.id = wh.region_id
GROUP BY w.id, w.name, w.display_name, w.location, w.is_active, w.priority, w.max_workers, 
         w.active_workers, t.req, t.err; 