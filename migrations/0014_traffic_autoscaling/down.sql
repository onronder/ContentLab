-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_worker_timestamp ON worker_regions;

-- Drop functions
DROP FUNCTION IF EXISTS update_worker_timestamp();
DROP FUNCTION IF EXISTS cleanup_old_traffic_metrics();

-- Drop views
DROP VIEW IF EXISTS region_status;

-- Remove added columns from worker_regions
ALTER TABLE IF EXISTS worker_regions 
  DROP COLUMN IF EXISTS active_workers,
  DROP COLUMN IF EXISTS max_workers,
  DROP COLUMN IF EXISTS min_workers,
  DROP COLUMN IF EXISTS last_scaled;

-- Drop indices
DROP INDEX IF EXISTS idx_autoscaling_history_region_time; 