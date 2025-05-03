-- Migration number: 0009 Rate Limiting and Quotas

-- Subscription plans table with usage limits
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  max_analyses_daily INTEGER,
  max_analyses_monthly INTEGER,
  max_competitor_urls INTEGER,
  max_api_requests_daily INTEGER,
  storage_limit_mb INTEGER,
  priority_queue BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_subscription_plans_updated ON subscription_plans;
CREATE TRIGGER set_subscription_plans_updated
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  price_yearly, 
  max_analyses_daily, 
  max_analyses_monthly, 
  max_competitor_urls,
  max_api_requests_daily,
  storage_limit_mb,
  priority_queue
) VALUES 
  (
    'free', 
    'Free Plan', 
    'Basic plan for small websites', 
    0, 
    0, 
    3, 
    50, 
    5,
    100,
    500,
    FALSE
  ),
  (
    'starter', 
    'Starter Plan', 
    'For growing websites and blogs', 
    49.99, 
    499.90, 
    10, 
    200, 
    15,
    500,
    2000,
    FALSE
  ),
  (
    'pro', 
    'Professional Plan', 
    'For serious content marketers', 
    99.99, 
    999.90, 
    30, 
    500, 
    50,
    2000,
    10000,
    TRUE
  ),
  (
    'enterprise', 
    'Enterprise Plan', 
    'For large organizations', 
    299.99, 
    2999.90, 
    100, 
    2000, 
    200,
    10000,
    50000,
    TRUE
  )
ON CONFLICT (name) DO NOTHING;

-- Add subscription_plan_id to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ;

-- Set default subscription plan for existing organizations
UPDATE organizations
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free')
WHERE subscription_plan_id IS NULL;

-- Usage tracking table for rate limiting and quota enforcement
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  analyses_count INTEGER NOT NULL DEFAULT 0,
  api_requests_count INTEGER NOT NULL DEFAULT 0,
  competitor_urls_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (organization_id, date)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_usage_tracking_updated ON usage_tracking;
CREATE TRIGGER set_usage_tracking_updated
BEFORE UPDATE ON usage_tracking
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_organization_id ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);

-- Rate limiting table for short-term request tracking (by minute)
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  minute TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, endpoint, minute)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_organization_id ON rate_limit_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_minute ON rate_limit_tracking(minute);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_endpoint ON rate_limit_tracking(endpoint);

-- Quota increase requests table
CREATE TABLE IF NOT EXISTS quota_increase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'analyses', 'competitors', 'api_requests', 'storage'
  current_limit INTEGER NOT NULL,
  requested_limit INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_quota_increase_requests_updated ON quota_increase_requests;
CREATE TRIGGER set_quota_increase_requests_updated
BEFORE UPDATE ON quota_increase_requests
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_organization_id UUID,
  p_usage_type TEXT, -- 'analyses', 'api_requests', 'competitor_urls'
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_affected_rows INTEGER;
BEGIN
  -- Create or update usage record for today
  INSERT INTO usage_tracking (
    organization_id,
    date,
    analyses_count,
    api_requests_count,
    competitor_urls_count
  ) VALUES (
    p_organization_id,
    v_today,
    CASE WHEN p_usage_type = 'analyses' THEN p_increment ELSE 0 END,
    CASE WHEN p_usage_type = 'api_requests' THEN p_increment ELSE 0 END,
    CASE WHEN p_usage_type = 'competitor_urls' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (organization_id, date) DO UPDATE SET
    analyses_count = usage_tracking.analyses_count + 
      CASE WHEN p_usage_type = 'analyses' THEN p_increment ELSE 0 END,
    api_requests_count = usage_tracking.api_requests_count + 
      CASE WHEN p_usage_type = 'api_requests' THEN p_increment ELSE 0 END,
    competitor_urls_count = usage_tracking.competitor_urls_count + 
      CASE WHEN p_usage_type = 'competitor_urls' THEN p_increment ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  RETURN v_affected_rows > 0;
END;
$$;

-- Function to check if an organization has exceeded its quota
CREATE OR REPLACE FUNCTION check_organization_quota(
  p_organization_id UUID,
  p_quota_type TEXT -- 'daily_analyses', 'monthly_analyses', 'competitor_urls', 'daily_api_requests'
)
RETURNS TABLE (
  has_quota BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  remaining INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_plan_id UUID;
  v_daily_analyses_limit INTEGER;
  v_monthly_analyses_limit INTEGER;
  v_competitor_urls_limit INTEGER;
  v_api_requests_limit INTEGER;
  v_today DATE := CURRENT_DATE;
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  v_current_daily_analyses INTEGER := 0;
  v_current_monthly_analyses INTEGER := 0;
  v_current_competitor_urls INTEGER := 0;
  v_current_daily_api_requests INTEGER := 0;
BEGIN
  -- Get organization's subscription plan limits
  SELECT o.subscription_plan_id INTO v_plan_id
  FROM organizations o
  WHERE o.id = p_organization_id;
  
  SELECT 
    sp.max_analyses_daily,
    sp.max_analyses_monthly,
    sp.max_competitor_urls,
    sp.max_api_requests_daily
  INTO 
    v_daily_analyses_limit,
    v_monthly_analyses_limit,
    v_competitor_urls_limit,
    v_api_requests_limit
  FROM subscription_plans sp
  WHERE sp.id = v_plan_id;
  
  -- Get current daily and monthly usage
  SELECT COALESCE(SUM(ut.analyses_count), 0) INTO v_current_daily_analyses
  FROM usage_tracking ut
  WHERE ut.organization_id = p_organization_id AND ut.date = v_today;
  
  SELECT COALESCE(SUM(ut.analyses_count), 0) INTO v_current_monthly_analyses
  FROM usage_tracking ut
  WHERE 
    ut.organization_id = p_organization_id 
    AND ut.date BETWEEN v_month_start AND v_month_end;
  
  -- Get current competitor URLs count (from analysis_jobs table)
  SELECT COUNT(DISTINCT competitor_url) INTO v_current_competitor_urls
  FROM analysis_jobs
  WHERE organization_id = p_organization_id;
  
  -- Get current daily API requests
  SELECT COALESCE(SUM(ut.api_requests_count), 0) INTO v_current_daily_api_requests
  FROM usage_tracking ut
  WHERE ut.organization_id = p_organization_id AND ut.date = v_today;
  
  -- Return appropriate values based on quota type
  CASE p_quota_type
    WHEN 'daily_analyses' THEN
      RETURN QUERY SELECT 
        v_current_daily_analyses < v_daily_analyses_limit,
        v_current_daily_analyses,
        v_daily_analyses_limit,
        GREATEST(0, v_daily_analyses_limit - v_current_daily_analyses);
    WHEN 'monthly_analyses' THEN
      RETURN QUERY SELECT 
        v_current_monthly_analyses < v_monthly_analyses_limit,
        v_current_monthly_analyses,
        v_monthly_analyses_limit,
        GREATEST(0, v_monthly_analyses_limit - v_current_monthly_analyses);
    WHEN 'competitor_urls' THEN
      RETURN QUERY SELECT 
        v_current_competitor_urls < v_competitor_urls_limit,
        v_current_competitor_urls,
        v_competitor_urls_limit,
        GREATEST(0, v_competitor_urls_limit - v_current_competitor_urls);
    WHEN 'daily_api_requests' THEN
      RETURN QUERY SELECT 
        v_current_daily_api_requests < v_api_requests_limit,
        v_current_daily_api_requests,
        v_api_requests_limit,
        GREATEST(0, v_api_requests_limit - v_current_daily_api_requests);
    ELSE
      RETURN QUERY SELECT false, 0, 0, 0;
  END CASE;
END;
$$;

-- Function to record rate-limited requests
CREATE OR REPLACE FUNCTION record_rate_limit_request(
  p_organization_id UUID,
  p_user_id UUID,
  p_endpoint TEXT
)
RETURNS TABLE (
  is_rate_limited BOOLEAN,
  current_count INTEGER,
  limit_value INTEGER,
  reset_time TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
DECLARE
  v_plan_id UUID;
  v_api_requests_limit INTEGER;
  v_current_minute TIMESTAMPTZ := DATE_TRUNC('minute', CURRENT_TIMESTAMP);
  v_throttle_limit INTEGER := 60; -- Default requests per minute
  v_current_count INTEGER := 0;
BEGIN
  -- Get organization's subscription plan and rate limit
  SELECT o.subscription_plan_id INTO v_plan_id
  FROM organizations o
  WHERE o.id = p_organization_id;
  
  SELECT sp.max_api_requests_daily INTO v_api_requests_limit
  FROM subscription_plans sp
  WHERE sp.id = v_plan_id;
  
  -- Adjust throttle limit based on plan
  CASE
    WHEN v_api_requests_limit >= 10000 THEN v_throttle_limit := 240; -- Enterprise: 4 requests/sec
    WHEN v_api_requests_limit >= 2000 THEN v_throttle_limit := 120;  -- Pro: 2 requests/sec
    WHEN v_api_requests_limit >= 500 THEN v_throttle_limit := 60;    -- Starter: 1 request/sec
    ELSE v_throttle_limit := 30;                                     -- Free: 0.5 requests/sec
  END CASE;
  
  -- Record this request
  INSERT INTO rate_limit_tracking (
    organization_id,
    user_id,
    endpoint,
    minute,
    request_count
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_endpoint,
    v_current_minute,
    1
  )
  ON CONFLICT (organization_id, endpoint, minute) DO UPDATE SET
    request_count = rate_limit_tracking.request_count + 1;
  
  -- Get current count for this minute
  SELECT request_count INTO v_current_count
  FROM rate_limit_tracking
  WHERE 
    organization_id = p_organization_id 
    AND endpoint = p_endpoint
    AND minute = v_current_minute;
  
  -- Also increment the daily API request counter
  PERFORM increment_usage(p_organization_id, 'api_requests', 1);
  
  -- Return rate limit information
  RETURN QUERY SELECT 
    v_current_count > v_throttle_limit,
    v_current_count,
    v_throttle_limit,
    v_current_minute + INTERVAL '1 minute';
END;
$$;

-- Cleanup function for rate limiting data (keep only the last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE minute < CURRENT_TIMESTAMP - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create policy for usage tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_tracking_org_policy ON usage_tracking
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Create policy for quota requests
ALTER TABLE quota_increase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY quota_request_org_policy ON quota_increase_requests
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Function to request a quota increase
CREATE OR REPLACE FUNCTION request_quota_increase(
  p_organization_id UUID,
  p_request_type TEXT,
  p_requested_limit INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_limit INTEGER;
  v_plan_id UUID;
  v_request_id UUID;
BEGIN
  -- Get organization's current plan
  SELECT subscription_plan_id INTO v_plan_id
  FROM organizations
  WHERE id = p_organization_id;
  
  -- Get current limit based on request type
  CASE p_request_type
    WHEN 'analyses' THEN
      SELECT max_analyses_monthly INTO v_current_limit
      FROM subscription_plans
      WHERE id = v_plan_id;
    WHEN 'competitors' THEN
      SELECT max_competitor_urls INTO v_current_limit
      FROM subscription_plans
      WHERE id = v_plan_id;
    WHEN 'api_requests' THEN
      SELECT max_api_requests_daily INTO v_current_limit
      FROM subscription_plans
      WHERE id = v_plan_id;
    WHEN 'storage' THEN
      SELECT storage_limit_mb INTO v_current_limit
      FROM subscription_plans
      WHERE id = v_plan_id;
    ELSE
      RAISE EXCEPTION 'Invalid request type: %', p_request_type;
  END CASE;
  
  -- Create the request
  INSERT INTO quota_increase_requests (
    organization_id,
    requested_by,
    request_type,
    current_limit,
    requested_limit,
    reason
  ) VALUES (
    p_organization_id,
    auth.uid(),
    p_request_type,
    v_current_limit,
    p_requested_limit,
    p_reason
  ) RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;

-- Function to approve or reject a quota increase request
CREATE OR REPLACE FUNCTION process_quota_increase_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_custom_limit INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_organization_id UUID;
  v_request_type TEXT;
  v_requested_limit INTEGER;
  v_limit_to_set INTEGER;
BEGIN
  -- Get request details
  SELECT 
    organization_id,
    request_type,
    requested_limit
  INTO
    v_organization_id,
    v_request_type,
    v_requested_limit
  FROM quota_increase_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE quota_increase_requests
  SET 
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = CURRENT_TIMESTAMP
  WHERE id = p_request_id;
  
  -- If approved, update organization's custom limits
  IF p_approved THEN
    v_limit_to_set := COALESCE(p_custom_limit, v_requested_limit);
    
    -- Create a custom organization setting entry
    -- This would typically be stored in a separate organization_settings table
    -- that we would need to create for custom overrides
    -- For now, this is just a placeholder
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add subscription and quota info to get_organization_details function
CREATE OR REPLACE FUNCTION get_organization_details(
  p_organization_id UUID
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'description', o.description,
      'logo_url', o.logo_url,
      'created_at', o.created_at,
      'subscription', jsonb_build_object(
        'plan', sp.name,
        'display_name', sp.display_name,
        'daily_analyses_limit', sp.max_analyses_daily,
        'monthly_analyses_limit', sp.max_analyses_monthly,
        'competitor_urls_limit', sp.max_competitor_urls,
        'api_requests_limit', sp.max_api_requests_daily,
        'storage_limit_mb', sp.storage_limit_mb
      ),
      'usage', jsonb_build_object(
        'daily_analyses', COALESCE((
          SELECT SUM(analyses_count) 
          FROM usage_tracking 
          WHERE organization_id = o.id AND date = CURRENT_DATE
        ), 0),
        'monthly_analyses', COALESCE((
          SELECT SUM(analyses_count) 
          FROM usage_tracking 
          WHERE organization_id = o.id 
            AND date BETWEEN DATE_TRUNC('month', CURRENT_DATE)::DATE 
              AND (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
        ), 0),
        'competitor_urls', COALESCE((
          SELECT COUNT(DISTINCT competitor_url) 
          FROM analysis_jobs 
          WHERE organization_id = o.id
        ), 0),
        'daily_api_requests', COALESCE((
          SELECT SUM(api_requests_count) 
          FROM usage_tracking 
          WHERE organization_id = o.id AND date = CURRENT_DATE
        ), 0)
      )
    ) INTO v_result
  FROM 
    organizations o
    JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
  WHERE 
    o.id = p_organization_id;
    
  RETURN v_result;
END;
$$; 