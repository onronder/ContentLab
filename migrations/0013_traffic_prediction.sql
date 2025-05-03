-- Migration for traffic prediction and auto-scaling capabilities
-- Enables ML-based prediction of traffic patterns and automated resource scaling

-- Add timescaledb extension if available for time-series data
DO $$ 
BEGIN
    -- Check if timescaledb extension exists
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb'
    ) THEN
        -- Only try to create if it's available but not created
        IF NOT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
        ) THEN
            BEGIN
                CREATE EXTENSION timescaledb;
                RAISE NOTICE 'timescaledb extension created successfully';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create timescaledb extension. You may need admin privileges: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE 'timescaledb extension is not available on this server';
    END IF;
END $$;

-- Create table for traffic metrics history
CREATE TABLE IF NOT EXISTS traffic_metrics (
  time TIMESTAMPTZ NOT NULL,
  endpoint TEXT NOT NULL,
  region TEXT,
  requests INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  max_latency_ms INTEGER
);

-- Convert to hypertable if timescaledb is available
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) THEN
        -- Only convert if it hasn't been converted yet
        IF NOT EXISTS (
            SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = 'traffic_metrics'
        ) THEN
            PERFORM create_hypertable('traffic_metrics', 'time');
            RAISE NOTICE 'Converted traffic_metrics to hypertable';
        END IF;
    END IF;
END $$;

-- Create standard indices if not using timescaledb
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) THEN
        -- Create indices for non-timescaledb setup
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE tablename = 'traffic_metrics' AND indexname = 'idx_traffic_metrics_time'
        ) THEN
            CREATE INDEX idx_traffic_metrics_time ON traffic_metrics(time DESC);
            CREATE INDEX idx_traffic_metrics_endpoint ON traffic_metrics(endpoint);
            CREATE INDEX idx_traffic_metrics_region ON traffic_metrics(region);
            CREATE INDEX idx_traffic_metrics_composite ON traffic_metrics(endpoint, time DESC);
            RAISE NOTICE 'Created standard indices for traffic_metrics table';
        END IF;
    END IF;
END $$;

-- Create table for traffic predictions
CREATE TABLE IF NOT EXISTS traffic_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  region TEXT,
  predicted_for TIMESTAMPTZ NOT NULL,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  predicted_requests INTEGER NOT NULL,
  confidence_score FLOAT NOT NULL,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_traffic_predictions_updated ON traffic_predictions;
CREATE TRIGGER set_traffic_predictions_updated
BEFORE UPDATE ON traffic_predictions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create indices for traffic predictions
CREATE INDEX IF NOT EXISTS idx_traffic_predictions_endpoint ON traffic_predictions(endpoint);
CREATE INDEX IF NOT EXISTS idx_traffic_predictions_region ON traffic_predictions(region);
CREATE INDEX IF NOT EXISTS idx_traffic_predictions_predicted_for ON traffic_predictions(predicted_for);
CREATE INDEX IF NOT EXISTS idx_traffic_predictions_composite ON traffic_predictions(endpoint, predicted_for);

-- Function to record traffic metrics (called from application code or scheduled jobs)
CREATE OR REPLACE FUNCTION record_traffic_metrics(
  p_time TIMESTAMPTZ,
  p_endpoint TEXT,
  p_region TEXT,
  p_requests INTEGER,
  p_errors INTEGER DEFAULT 0,
  p_avg_latency_ms INTEGER DEFAULT NULL,
  p_p95_latency_ms INTEGER DEFAULT NULL,
  p_max_latency_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO traffic_metrics (
    time,
    endpoint,
    region,
    requests,
    errors,
    avg_latency_ms,
    p95_latency_ms,
    max_latency_ms
  ) VALUES (
    p_time,
    p_endpoint,
    p_region,
    p_requests,
    p_errors,
    p_avg_latency_ms,
    p_p95_latency_ms,
    p_max_latency_ms
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error recording traffic metrics: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Table to store traffic pattern configurations
CREATE TABLE IF NOT EXISTS traffic_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  endpoint TEXT,
  day_of_week INTEGER[], -- 0 = Sunday, 1 = Monday, etc.
  hour_of_day INTEGER[], -- 0-23 hours
  multiplier FLOAT NOT NULL, -- Expected traffic multiplier (1.0 = normal, 2.0 = double, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_traffic_patterns_updated ON traffic_patterns;
CREATE TRIGGER set_traffic_patterns_updated
BEFORE UPDATE ON traffic_patterns
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert some common traffic patterns
INSERT INTO traffic_patterns (
  name, 
  description, 
  day_of_week, 
  hour_of_day, 
  multiplier
)
VALUES
  (
    'business-hours',
    'Higher traffic during business hours',
    ARRAY[1, 2, 3, 4, 5], -- Monday through Friday
    ARRAY[9, 10, 11, 12, 13, 14, 15, 16, 17], -- 9 AM to 5 PM
    1.5
  ),
  (
    'weekend-drop',
    'Lower traffic during weekends',
    ARRAY[0, 6], -- Sunday and Saturday
    ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], -- All hours
    0.6
  ),
  (
    'evening-peak',
    'Higher traffic in the evening',
    ARRAY[0, 1, 2, 3, 4, 5, 6], -- All days
    ARRAY[18, 19, 20, 21, 22], -- 6 PM to 10 PM
    1.8
  ),
  (
    'night-hours',
    'Lower traffic during night hours',
    ARRAY[0, 1, 2, 3, 4, 5, 6], -- All days
    ARRAY[0, 1, 2, 3, 4, 5], -- 12 AM to 5 AM
    0.3
  )
ON CONFLICT (name) DO NOTHING;

-- Function to get the predicted traffic multiplier for a specific time
CREATE OR REPLACE FUNCTION get_traffic_multiplier(
  p_time TIMESTAMPTZ,
  p_endpoint TEXT DEFAULT NULL
)
RETURNS FLOAT LANGUAGE plpgsql AS $$
DECLARE
  v_day INTEGER;
  v_hour INTEGER;
  v_multiplier FLOAT := 1.0; -- Default multiplier
  v_pattern RECORD;
BEGIN
  -- Extract day of week (0 = Sunday) and hour (0-23)
  v_day := EXTRACT(DOW FROM p_time);
  v_hour := EXTRACT(HOUR FROM p_time);
  
  -- Check for matching traffic patterns
  FOR v_pattern IN (
    SELECT * FROM traffic_patterns
    WHERE 
      is_active = TRUE
      AND (endpoint IS NULL OR endpoint = p_endpoint)
      AND v_day = ANY(day_of_week)
      AND v_hour = ANY(hour_of_day)
  )
  LOOP
    -- If multiple patterns match, take the highest multiplier
    v_multiplier := GREATEST(v_multiplier, v_pattern.multiplier);
  END LOOP;
  
  RETURN v_multiplier;
END;
$$;

-- Function to predict traffic for the next hour using historical data and patterns
CREATE OR REPLACE FUNCTION predict_traffic(
  p_endpoint TEXT,
  p_region TEXT DEFAULT NULL,
  p_hours_ahead INTEGER DEFAULT 1
)
RETURNS TABLE (
  predicted_for TIMESTAMPTZ,
  predicted_requests INTEGER,
  confidence_score FLOAT
) LANGUAGE plpgsql AS $$
DECLARE
  v_base_traffic FLOAT;
  v_current_time TIMESTAMPTZ := CURRENT_TIMESTAMP;
  v_prediction_time TIMESTAMPTZ;
  v_day_of_week INTEGER;
  v_hour_of_day INTEGER;
  v_multiplier FLOAT;
  v_confidence FLOAT;
BEGIN
  -- Calculate prediction time
  v_prediction_time := v_current_time + (p_hours_ahead || ' hours')::INTERVAL;
  
  -- Get baseline traffic (average from same hour in last 4 weeks)
  SELECT AVG(requests) INTO v_base_traffic
  FROM traffic_metrics
  WHERE 
    endpoint = p_endpoint
    AND (p_region IS NULL OR region = p_region)
    AND time >= (v_prediction_time - INTERVAL '4 weeks')
    AND time < (v_prediction_time - INTERVAL '1 day')
    AND EXTRACT(DOW FROM time) = EXTRACT(DOW FROM v_prediction_time)
    AND EXTRACT(HOUR FROM time) = EXTRACT(HOUR FROM v_prediction_time);
  
  -- If we don't have historical data, use recent average
  IF v_base_traffic IS NULL THEN
    SELECT AVG(requests) INTO v_base_traffic
    FROM traffic_metrics
    WHERE 
      endpoint = p_endpoint
      AND (p_region IS NULL OR region = p_region)
      AND time >= (v_current_time - INTERVAL '24 hours');
  END IF;
  
  -- If still no data, use a reasonable default
  IF v_base_traffic IS NULL THEN
    v_base_traffic := 100; -- Default baseline
    v_confidence := 0.3; -- Low confidence due to no historical data
  ELSE
    v_confidence := CASE
      WHEN p_hours_ahead <= 3 THEN 0.9 -- High confidence for near-term predictions
      WHEN p_hours_ahead <= 12 THEN 0.7 -- Medium confidence for same-day predictions
      WHEN p_hours_ahead <= 24 THEN 0.5 -- Lower confidence for next-day
      ELSE 0.3 -- Low confidence for predictions far in the future
    END;
  END IF;
  
  -- Get traffic pattern multiplier for the prediction time
  v_multiplier := get_traffic_multiplier(v_prediction_time, p_endpoint);
  
  -- Store the prediction
  INSERT INTO traffic_predictions (
    endpoint,
    region,
    predicted_for,
    predicted_requests,
    confidence_score,
    model_version
  ) VALUES (
    p_endpoint,
    p_region,
    v_prediction_time,
    ROUND(v_base_traffic * v_multiplier),
    v_confidence,
    'v1.0-statistical'
  );
  
  -- Return the prediction
  RETURN QUERY
  SELECT 
    v_prediction_time,
    ROUND(v_base_traffic * v_multiplier)::INTEGER,
    v_confidence;
END;
$$;

-- Scheduled function to generate predictions for major endpoints
CREATE OR REPLACE FUNCTION generate_traffic_predictions()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_endpoints TEXT[] := ARRAY['api/analyze', 'api/reports', 'api/jobs', 'api/data'];
  v_regions TEXT[] := ARRAY['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1'];
  v_hours INTEGER[] := ARRAY[1, 3, 6, 12, 24]; -- Generate predictions for various time horizons
  v_endpoint TEXT;
  v_region TEXT;
  v_hour INTEGER;
  v_prediction_count INTEGER := 0;
BEGIN
  -- Loop through endpoints
  FOREACH v_endpoint IN ARRAY v_endpoints
  LOOP
    -- Generate global predictions (all regions combined)
    FOREACH v_hour IN ARRAY v_hours
    LOOP
      PERFORM predict_traffic(v_endpoint, NULL, v_hour);
      v_prediction_count := v_prediction_count + 1;
    END LOOP;
    
    -- Generate region-specific predictions
    FOREACH v_region IN ARRAY v_regions
    LOOP
      FOREACH v_hour IN ARRAY v_hours
      LOOP
        PERFORM predict_traffic(v_endpoint, v_region, v_hour);
        v_prediction_count := v_prediction_count + 1;
      END LOOP;
    END LOOP;
  END LOOP;
  
  -- Clean up old predictions (keep 7 days of history)
  DELETE FROM traffic_predictions
  WHERE predicted_at < (CURRENT_TIMESTAMP - INTERVAL '7 days');
  
  RETURN v_prediction_count;
END;
$$; 