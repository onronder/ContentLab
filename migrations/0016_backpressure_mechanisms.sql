-- Migration number: 0016 Backpressure Mechanisms

-- Create system_settings table if it doesn't exist (needed for scheduling)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_key UNIQUE (category, key)
);

-- Create table for rate limit configuration
CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  burst_capacity INTEGER NOT NULL DEFAULT 10,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  adaptive_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  user_tier_multipliers JSONB DEFAULT '{"free": 1, "pro": 2, "enterprise": 5}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_endpoint UNIQUE (endpoint)
);

-- Create table for tracking endpoint traffic
CREATE TABLE IF NOT EXISTS endpoint_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  request_identifiers JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_endpoint_timestamp UNIQUE (endpoint, timestamp)
);

-- Create index for efficient queries on endpoint traffic
CREATE INDEX IF NOT EXISTS idx_endpoint_traffic_timestamp ON endpoint_traffic(timestamp);
CREATE INDEX IF NOT EXISTS idx_endpoint_traffic_endpoint ON endpoint_traffic(endpoint);

-- Create table for rate limit events
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  client_ip TEXT,
  limited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retry_after_seconds INTEGER NOT NULL DEFAULT 60,
  request_count INTEGER
);

-- Add index for rate limit events
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_id ON rate_limit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_limited_at ON rate_limit_events(limited_at);

-- Create table for adaptive rate limit state
CREATE TABLE IF NOT EXISTS adaptive_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  current_limit INTEGER NOT NULL,
  baseline_limit INTEGER NOT NULL,
  high_traffic_threshold INTEGER NOT NULL DEFAULT 80, -- percentage of baseline
  low_traffic_threshold INTEGER NOT NULL DEFAULT 20, -- percentage of baseline
  last_adjustment TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  adjustment_cooldown_seconds INTEGER NOT NULL DEFAULT 300, -- 5 minutes
  current_traffic_level TEXT NOT NULL DEFAULT 'NORMAL',
  
  CONSTRAINT unique_adaptive_endpoint UNIQUE (endpoint),
  CONSTRAINT valid_traffic_level CHECK (current_traffic_level IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL'))
);

-- Create a view to get current rate limits with adaptive adjustments
CREATE OR REPLACE VIEW current_rate_limits AS
SELECT 
  rlc.endpoint,
  CASE 
    WHEN arl.current_limit IS NOT NULL AND rlc.adaptive_enabled THEN arl.current_limit
    ELSE rlc.requests_per_minute
  END AS effective_limit,
  rlc.burst_capacity,
  rlc.cooldown_seconds,
  rlc.adaptive_enabled,
  arl.current_traffic_level,
  rlc.user_tier_multipliers
FROM rate_limit_config rlc
LEFT JOIN adaptive_rate_limits arl ON rlc.endpoint = arl.endpoint;

-- Function to record a rate limit event
CREATE OR REPLACE FUNCTION record_rate_limit_event(
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_client_ip TEXT DEFAULT NULL,
  p_retry_after_seconds INTEGER DEFAULT 60,
  p_request_count INTEGER DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO rate_limit_events (
    user_id,
    endpoint,
    client_ip,
    retry_after_seconds,
    request_count
  ) VALUES (
    p_user_id,
    p_endpoint,
    p_client_ip,
    p_retry_after_seconds,
    p_request_count
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to update endpoint traffic statistics
CREATE OR REPLACE FUNCTION update_endpoint_traffic(
  p_endpoint TEXT,
  p_requests INTEGER DEFAULT 1,
  p_successes INTEGER DEFAULT 1,
  p_errors INTEGER DEFAULT 0,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_hour_bucket TIMESTAMPTZ;
BEGIN
  -- Round to the nearest hour for bucketing
  v_hour_bucket := date_trunc('hour', current_timestamp);
  
  -- Insert or update the traffic record for this endpoint and hour
  INSERT INTO endpoint_traffic (
    endpoint,
    timestamp,
    request_count,
    success_count,
    error_count,
    avg_response_time_ms,
    max_response_time_ms
  ) VALUES (
    p_endpoint,
    v_hour_bucket,
    p_requests,
    p_successes,
    p_errors,
    p_response_time_ms,
    p_response_time_ms
  )
  ON CONFLICT (endpoint, timestamp) DO UPDATE
  SET
    request_count = endpoint_traffic.request_count + p_requests,
    success_count = endpoint_traffic.success_count + p_successes,
    error_count = endpoint_traffic.error_count + p_errors,
    avg_response_time_ms = CASE
      WHEN endpoint_traffic.avg_response_time_ms IS NULL THEN p_response_time_ms
      WHEN p_response_time_ms IS NULL THEN endpoint_traffic.avg_response_time_ms
      ELSE (endpoint_traffic.avg_response_time_ms * endpoint_traffic.request_count + p_response_time_ms) / (endpoint_traffic.request_count + 1)
    END,
    max_response_time_ms = GREATEST(COALESCE(endpoint_traffic.max_response_time_ms, 0), COALESCE(p_response_time_ms, 0));
  
  -- Check if we need to update adaptive rate limits
  PERFORM update_adaptive_rate_limits(p_endpoint);
END;
$$;

-- Check if 'users' table contains a 'tier' column, if not, we'll handle it in the function
DO $$
DECLARE
  tier_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tier'
  ) INTO tier_column_exists;

  IF NOT tier_column_exists THEN
    EXECUTE $FUNC$
      CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
      RETURNS TEXT LANGUAGE plpgsql AS $BODY$
      DECLARE
        -- Get tier from user_metadata if available
        v_tier TEXT;
      BEGIN
        -- Try to get tier from user metadata
        SELECT 
          COALESCE(
            (raw_user_meta_data->>'tier')::TEXT, 
            'free'
          ) INTO v_tier
        FROM auth.users
        WHERE id = p_user_id;
        
        RETURN COALESCE(v_tier, 'free');
      END;
      $BODY$;
    $FUNC$;
  END IF;
END $$;

-- Function to get the effective rate limit for a user
CREATE OR REPLACE FUNCTION get_user_rate_limit(
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  requests_per_minute INTEGER,
  burst_capacity INTEGER,
  cooldown_seconds INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_user_tier TEXT := 'free';
  v_tier_multiplier NUMERIC := 1;
  v_tier_multipliers JSONB;
  v_has_tier_column BOOLEAN;
BEGIN
  -- Get current rate limit from the view
  WITH current_limit AS (
    SELECT 
      effective_limit,
      burst_capacity,
      cooldown_seconds,
      user_tier_multipliers
    FROM current_rate_limits
    WHERE endpoint = p_endpoint
  )
  
  -- Default values if endpoint not found
  SELECT 
    COALESCE(cl.effective_limit, 60) as effective_limit,
    COALESCE(cl.burst_capacity, 10) as burst_capacity,
    COALESCE(cl.cooldown_seconds, 60) as cooldown_seconds,
    COALESCE(cl.user_tier_multipliers, '{"free": 1, "pro": 2, "enterprise": 5}'::jsonb) as tier_multipliers
  INTO 
    requests_per_minute, 
    burst_capacity, 
    cooldown_seconds,
    v_tier_multipliers
  FROM current_limit cl;
  
  -- If user is authenticated, apply tier multiplier
  IF p_user_id IS NOT NULL THEN
    -- Check if users table has a tier column
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'tier'
    ) INTO v_has_tier_column;
    
    -- First attempt: Get tier from users table if column exists
    IF v_has_tier_column THEN
      BEGIN
        SELECT tier INTO v_user_tier FROM users WHERE id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
          -- If error, use default
          v_user_tier := 'free';
      END;
    -- Second attempt: Try using get_user_tier function
    ELSE
      BEGIN
        SELECT get_user_tier(p_user_id) INTO v_user_tier;
        EXCEPTION WHEN OTHERS THEN
          -- If error, use default
          v_user_tier := 'free';
      END;
    END IF;
    
    -- Apply tier multiplier if tier exists in the multipliers
    IF v_user_tier IS NOT NULL AND v_tier_multipliers ? v_user_tier THEN
      v_tier_multiplier := (v_tier_multipliers ->> v_user_tier)::NUMERIC;
      requests_per_minute := GREATEST(1, FLOOR(requests_per_minute * v_tier_multiplier));
      burst_capacity := GREATEST(1, FLOOR(burst_capacity * v_tier_multiplier));
    END IF;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Function to handle adaptive rate limit adjustments
CREATE OR REPLACE FUNCTION update_adaptive_rate_limits(
  p_endpoint TEXT
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_config RECORD;
  v_adaptive RECORD;
  v_traffic_last_hour INTEGER;
  v_traffic_average INTEGER;
  v_new_traffic_level TEXT;
  v_new_limit INTEGER;
  v_adjustment_needed BOOLEAN := FALSE;
  v_traffic_percent INTEGER;
BEGIN
  -- Get rate limit config for this endpoint
  SELECT * INTO v_config
  FROM rate_limit_config
  WHERE endpoint = p_endpoint;
  
  -- If endpoint not found or adaptive not enabled, do nothing
  IF NOT FOUND OR NOT v_config.adaptive_enabled THEN
    RETURN;
  END IF;
  
  -- Get adaptive state for this endpoint
  SELECT * INTO v_adaptive
  FROM adaptive_rate_limits
  WHERE endpoint = p_endpoint;
  
  -- If no adaptive state exists, create it
  IF NOT FOUND THEN
    INSERT INTO adaptive_rate_limits (
      endpoint,
      current_limit,
      baseline_limit
    ) VALUES (
      p_endpoint,
      v_config.requests_per_minute,
      v_config.requests_per_minute
    )
    RETURNING * INTO v_adaptive;
  END IF;
  
  -- Check if cooldown has elapsed
  IF v_adaptive.last_adjustment + (v_adaptive.adjustment_cooldown_seconds * interval '1 second') > CURRENT_TIMESTAMP THEN
    -- Still in cooldown period, don't adjust
    RETURN;
  END IF;
  
  -- Get traffic from the last hour
  SELECT COALESCE(SUM(request_count), 0) INTO v_traffic_last_hour
  FROM endpoint_traffic
  WHERE 
    endpoint = p_endpoint
    AND timestamp >= CURRENT_TIMESTAMP - interval '1 hour';
  
  -- Get average hourly traffic from the last day
  SELECT COALESCE(AVG(request_count), 0) INTO v_traffic_average
  FROM endpoint_traffic
  WHERE 
    endpoint = p_endpoint
    AND timestamp >= CURRENT_TIMESTAMP - interval '1 day';
  
  -- Determine traffic level based on percentage of average
  IF v_traffic_average > 0 THEN
    v_traffic_percent := (v_traffic_last_hour * 100) / GREATEST(v_traffic_average, 1);
    
    IF v_traffic_percent >= 200 THEN
      v_new_traffic_level := 'CRITICAL';
      v_adjustment_needed := TRUE;
    ELSIF v_traffic_percent >= v_adaptive.high_traffic_threshold THEN
      v_new_traffic_level := 'HIGH';
      v_adjustment_needed := v_adaptive.current_traffic_level != 'HIGH';
    ELSIF v_traffic_percent <= v_adaptive.low_traffic_threshold THEN
      v_new_traffic_level := 'LOW';
      v_adjustment_needed := v_adaptive.current_traffic_level != 'LOW';
    ELSE
      v_new_traffic_level := 'NORMAL';
      v_adjustment_needed := v_adaptive.current_traffic_level != 'NORMAL';
    END IF;
  ELSE
    -- Not enough data to determine traffic level
    v_new_traffic_level := 'NORMAL';
    v_adjustment_needed := v_adaptive.current_traffic_level != 'NORMAL';
  END IF;
  
  -- If adjustment is needed, calculate new limit
  IF v_adjustment_needed THEN
    CASE v_new_traffic_level
      WHEN 'CRITICAL' THEN
        -- Severe reduction to protect system
        v_new_limit := GREATEST(1, FLOOR(v_adaptive.baseline_limit * 0.3));
      WHEN 'HIGH' THEN
        -- Moderate reduction
        v_new_limit := GREATEST(1, FLOOR(v_adaptive.baseline_limit * 0.7));
      WHEN 'LOW' THEN
        -- Increase limit during low traffic
        v_new_limit := CEIL(v_adaptive.baseline_limit * 1.3);
      ELSE
        -- Normal traffic, use baseline
        v_new_limit := v_adaptive.baseline_limit;
    END CASE;
    
    -- Update adaptive state
    UPDATE adaptive_rate_limits
    SET
      current_limit = v_new_limit,
      current_traffic_level = v_new_traffic_level,
      last_adjustment = CURRENT_TIMESTAMP
    WHERE endpoint = p_endpoint;
  END IF;
END;
$$;

-- Function to check if a request should be rate limited
CREATE OR REPLACE FUNCTION should_rate_limit(
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_client_ip TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_limited BOOLEAN,
  retry_after_seconds INTEGER,
  current_limit INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_user_limit INTEGER;
  v_burst_capacity INTEGER;
  v_cooldown_seconds INTEGER;
  v_recent_requests INTEGER;
  v_identifier TEXT;
BEGIN
  -- Get rate limit for this user/endpoint
  SELECT requests_per_minute, burst_capacity, cooldown_seconds 
  INTO v_user_limit, v_burst_capacity, v_cooldown_seconds
  FROM get_user_rate_limit(p_endpoint, p_user_id);
  
  -- Create a consistent identifier (prefer user_id, fall back to IP)
  v_identifier := COALESCE(p_user_id::TEXT, p_client_ip, 'anonymous');
  
  -- Count recent requests in the rate limit window
  WITH recent_traffic AS (
    SELECT SUM((request_identifiers->>v_identifier)::int) AS count
    FROM endpoint_traffic
    WHERE 
      endpoint = p_endpoint
      AND timestamp >= CURRENT_TIMESTAMP - (v_cooldown_seconds * interval '1 second')
      AND request_identifiers ? v_identifier
  )
  SELECT count INTO v_recent_requests FROM recent_traffic;
  
  -- Determine if request should be limited
  is_limited := COALESCE(v_recent_requests, 0) >= (v_user_limit + v_burst_capacity);
  retry_after_seconds := v_cooldown_seconds;
  current_limit := v_user_limit;
  
  -- If limited, record the event
  IF is_limited THEN
    PERFORM record_rate_limit_event(
      p_endpoint,
      p_user_id,
      p_client_ip,
      v_cooldown_seconds,
      v_recent_requests
    );
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Initialize default rate limits for common endpoints
INSERT INTO rate_limit_config (endpoint, requests_per_minute, burst_capacity, adaptive_enabled)
VALUES 
  ('api/analyze', 30, 5, TRUE),
  ('api/reports', 60, 10, TRUE),
  ('api/jobs', 120, 20, FALSE),
  ('api/data', 120, 30, FALSE)
ON CONFLICT (endpoint) DO NOTHING;

-- Function to register a request (for tracking)
CREATE OR REPLACE FUNCTION register_request(
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_client_ip TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_hour_bucket TIMESTAMPTZ;
  v_identifier TEXT;
  v_current_identifiers JSONB;
BEGIN
  -- Round to the nearest hour for bucketing
  v_hour_bucket := date_trunc('hour', current_timestamp);
  
  -- Create a consistent identifier (prefer user_id, fall back to IP)
  v_identifier := COALESCE(p_user_id::TEXT, p_client_ip, 'anonymous');
  
  -- Get current request identifiers for this endpoint and hour
  SELECT request_identifiers INTO v_current_identifiers
  FROM endpoint_traffic
  WHERE 
    endpoint = p_endpoint
    AND timestamp = v_hour_bucket;
    
  -- If no existing record, create an empty JSONB
  IF v_current_identifiers IS NULL THEN
    v_current_identifiers := '{}'::jsonb;
  END IF;
  
  -- Increment count for this identifier
  IF v_current_identifiers ? v_identifier THEN
    v_current_identifiers := jsonb_set(
      v_current_identifiers,
      ARRAY[v_identifier],
      to_jsonb((v_current_identifiers ->> v_identifier)::int + 1)
    );
  ELSE
    v_current_identifiers := jsonb_set(
      v_current_identifiers,
      ARRAY[v_identifier],
      '1'::jsonb
    );
  END IF;
  
  -- Update traffic record with the new identifier counts
  INSERT INTO endpoint_traffic (
    endpoint,
    timestamp,
    request_count,
    success_count,
    error_count,
    avg_response_time_ms,
    max_response_time_ms,
    request_identifiers
  ) VALUES (
    p_endpoint,
    v_hour_bucket,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_response_time_ms,
    p_response_time_ms,
    v_current_identifiers
  )
  ON CONFLICT (endpoint, timestamp) DO UPDATE
  SET
    request_count = endpoint_traffic.request_count + 1,
    success_count = endpoint_traffic.success_count + (CASE WHEN p_success THEN 1 ELSE 0 END),
    error_count = endpoint_traffic.error_count + (CASE WHEN p_success THEN 0 ELSE 1 END),
    avg_response_time_ms = CASE
      WHEN endpoint_traffic.avg_response_time_ms IS NULL THEN p_response_time_ms
      WHEN p_response_time_ms IS NULL THEN endpoint_traffic.avg_response_time_ms
      ELSE (endpoint_traffic.avg_response_time_ms * endpoint_traffic.request_count + p_response_time_ms) / (endpoint_traffic.request_count + 1)
    END,
    max_response_time_ms = GREATEST(COALESCE(endpoint_traffic.max_response_time_ms, 0), COALESCE(p_response_time_ms, 0)),
    request_identifiers = v_current_identifiers;
  
  -- Update adaptive rate limits if needed
  PERFORM update_adaptive_rate_limits(p_endpoint);
END;
$$;

-- Function to update all adaptive rate limits at once (useful for scheduling)
CREATE OR REPLACE FUNCTION update_all_rate_limits()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_updated INTEGER := 0;
  v_endpoint RECORD;
  v_system_settings_exists BOOLEAN;
BEGIN
  -- Loop through all endpoints with adaptive rate limiting enabled
  FOR v_endpoint IN 
    SELECT endpoint FROM rate_limit_config WHERE adaptive_enabled = TRUE
  LOOP
    -- Update rate limits for this endpoint
    PERFORM update_adaptive_rate_limits(v_endpoint.endpoint);
    v_updated := v_updated + 1;
  END LOOP;
  
  -- Check if system_settings table exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'system_settings'
  ) INTO v_system_settings_exists;
  
  -- Only try to insert into system_settings if it exists
  IF v_system_settings_exists THEN
    BEGIN
      INSERT INTO system_settings (category, key, value, description, is_public)
      VALUES (
        'scheduled_tasks',
        'update_rate_limits',
        jsonb_build_object(
          'name', 'adaptive_rate_limit_updater',
          'schedule', '*/15 * * * *',
          'command', 'SELECT update_all_rate_limits()',
          'enabled', true,
          'last_run', NULL
        ),
        'Updates adaptive rate limits every 15 minutes based on traffic patterns',
        false
      ) ON CONFLICT (category, key) DO UPDATE
      SET value = jsonb_build_object(
        'name', 'adaptive_rate_limit_updater',
        'schedule', '*/15 * * * *',
        'command', 'SELECT update_all_rate_limits()',
        'enabled', true,
        'last_run', system_settings.value->'last_run'
      );
      EXCEPTION WHEN OTHERS THEN
        -- Ignore errors related to system_settings table
        NULL;
    END;
  END IF;
  
  RETURN v_updated;
END;
$$; 