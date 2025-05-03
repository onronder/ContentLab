-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_worker_timestamp ON worker_regions;

-- Drop functions
DROP FUNCTION IF EXISTS update_worker_timestamp();
DROP FUNCTION IF EXISTS track_regional_traffic();

-- Drop views
DROP VIEW IF EXISTS region_status;
DROP VIEW IF EXISTS traffic_analytics;

-- Drop tables
DROP TABLE IF EXISTS autoscaling_history;
DROP TABLE IF EXISTS worker_regions;
DROP TABLE IF EXISTS traffic_metrics; 