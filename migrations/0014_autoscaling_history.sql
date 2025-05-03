-- Migration for autoscaling history table

-- Create table for tracking autoscaling actions
CREATE TABLE IF NOT EXISTS autoscaling_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES worker_regions(id),
  region_name TEXT NOT NULL,
  previous_workers INTEGER NOT NULL,
  new_workers INTEGER NOT NULL,
  predicted_requests INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_autoscaling_history_region_id ON autoscaling_history(region_id);
CREATE INDEX IF NOT EXISTS idx_autoscaling_history_created_at ON autoscaling_history(created_at DESC);

-- Create function to clean up old autoscaling history
CREATE OR REPLACE FUNCTION cleanup_autoscaling_history()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 30 days
  DELETE FROM autoscaling_history
  WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create view for autoscaling analytics
CREATE OR REPLACE VIEW autoscaling_analytics AS
SELECT
  date_trunc('day', created_at) AS day,
  region_name,
  COUNT(*) AS scaling_actions,
  SUM(CASE WHEN new_workers > previous_workers THEN 1 ELSE 0 END) AS scale_up_actions,
  SUM(CASE WHEN new_workers < previous_workers THEN 1 ELSE 0 END) AS scale_down_actions,
  SUM(new_workers - previous_workers) AS net_worker_change,
  AVG(predicted_requests) AS avg_predicted_requests,
  MAX(predicted_requests) AS max_predicted_requests
FROM
  autoscaling_history
WHERE
  created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
GROUP BY
  day, region_name
ORDER BY
  day DESC, region_name; 