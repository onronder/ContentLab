-- Create table for tracking traffic metrics by region
CREATE TABLE IF NOT EXISTS traffic_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  average_response_time FLOAT NOT NULL DEFAULT 0,
  p95_response_time FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on region and timestamp for efficient queries
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_region_timestamp ON traffic_metrics (region, created_at);

-- Create time-based partitioning for traffic metrics (if TimescaleDB is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable('traffic_metrics', 'created_at', if_not_exists => TRUE);
  END IF;
END
$$;

-- Create retention policy to automatically drop old traffic data after 90 days
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM add_retention_policy('traffic_metrics', INTERVAL '90 days', if_not_exists => TRUE);
  END IF;
END
$$;

-- Create table for managing worker distribution by region
CREATE TABLE IF NOT EXISTS worker_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL UNIQUE,
  active_workers INTEGER NOT NULL DEFAULT 1,
  max_workers INTEGER NOT NULL DEFAULT 10,
  min_workers INTEGER NOT NULL DEFAULT 1,
  last_scaled TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking auto-scaling history
CREATE TABLE IF NOT EXISTS autoscaling_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  previous_workers INTEGER NOT NULL,
  new_workers INTEGER NOT NULL,
  traffic INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying of scaling history
CREATE INDEX IF NOT EXISTS idx_autoscaling_history_region_timestamp ON autoscaling_history (region, created_at);

-- Create function to track regional traffic
CREATE OR REPLACE FUNCTION track_regional_traffic() RETURNS TRIGGER AS $$
BEGIN
  -- Increment request count for the region
  INSERT INTO traffic_metrics (region, request_count)
  VALUES (TG_ARGV[0], 1)
  ON CONFLICT (region, date_trunc('hour', created_at))
  DO UPDATE SET request_count = traffic_metrics.request_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add traffic metrics view for analytics
CREATE OR REPLACE VIEW traffic_analytics AS
SELECT
  region,
  date_trunc('hour', created_at) AS hour,
  SUM(request_count) AS requests,
  SUM(error_count) AS errors,
  AVG(average_response_time) AS avg_response_time,
  MAX(p95_response_time) AS p95_response_time
FROM traffic_metrics
GROUP BY region, date_trunc('hour', created_at)
ORDER BY date_trunc('hour', created_at) DESC;

-- Add regional status view for monitoring
CREATE OR REPLACE VIEW region_status AS
SELECT
  w.region,
  w.active_workers,
  w.max_workers,
  w.last_scaled,
  COALESCE(t.requests, 0) AS recent_requests,
  COALESCE(t.errors, 0) AS recent_errors
FROM worker_regions w
LEFT JOIN (
  SELECT
    region,
    SUM(request_count) AS requests,
    SUM(error_count) AS errors
  FROM traffic_metrics
  WHERE created_at > now() - INTERVAL '15 minutes'
  GROUP BY region
) t ON w.region = t.region;

-- Create function to update timestamps on worker changes
CREATE OR REPLACE FUNCTION update_worker_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamps
CREATE TRIGGER trigger_update_worker_timestamp
BEFORE UPDATE ON worker_regions
FOR EACH ROW
EXECUTE FUNCTION update_worker_timestamp(); 