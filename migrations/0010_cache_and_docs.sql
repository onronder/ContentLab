-- Migration number: 0010 Cache and Documentation

-- Create a table for caching frequently accessed data
CREATE TABLE IF NOT EXISTS cache_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (cache_key)
);

-- Create index for fast lookups by cache key
CREATE INDEX IF NOT EXISTS idx_cache_items_cache_key ON cache_items(cache_key);

-- Create index for efficient cleanup of expired items
CREATE INDEX IF NOT EXISTS idx_cache_items_expires_at ON cache_items(expires_at);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_cache_items_updated ON cache_items;
CREATE TRIGGER set_cache_items_updated
BEFORE UPDATE ON cache_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to clean up expired cache items
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_items
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create a table for system documentation
CREATE TABLE IF NOT EXISTS documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (category, title)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_documentation_updated ON documentation;
CREATE TRIGGER set_documentation_updated
BEFORE UPDATE ON documentation
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert initial documentation for rate limits and quotas
INSERT INTO documentation (category, title, content, is_public, order_index)
VALUES 
  (
    'rate_limits',
    'Rate Limiting Overview',
    E'# Rate Limiting Policy\n\nTo ensure fair usage and system stability, our API implements rate limiting based on your subscription plan. Rate limits are applied on a per-minute basis for API requests.\n\n## Rate Limits by Plan\n\n- **Free Plan**: 30 requests per minute (0.5 requests/second)\n- **Starter Plan**: 60 requests per minute (1 request/second)\n- **Professional Plan**: 120 requests per minute (2 requests/second)\n- **Enterprise Plan**: 240 requests per minute (4 requests/second)\n\n## Rate Limit Headers\n\nAll API responses include the following headers to help you track your rate limit usage:\n\n- `X-RateLimit-Limit`: The maximum number of requests allowed per minute\n- `X-RateLimit-Remaining`: The number of remaining requests in the current window\n- `X-RateLimit-Reset`: The time at which the current rate limit window resets (Unix timestamp)\n\nWhen you exceed the rate limit, you will receive a 429 Too Many Requests response with a `Retry-After` header indicating how many seconds to wait before retrying.',
    TRUE,
    1
  ),
  (
    'quotas',
    'Usage Quotas and Limits',
    E'# Usage Quotas and Limits\n\nOur platform enforces usage quotas based on your subscription plan to ensure fair usage and service reliability.\n\n## Quota Types\n\n1. **Analysis Jobs**\n   - Daily limit: Maximum number of analyses you can run per day\n   - Monthly limit: Maximum number of analyses you can run per month\n\n2. **Competitor URLs**\n   - Maximum number of unique competitor URLs you can track\n\n3. **API Requests**\n   - Daily limit: Maximum number of API requests per day\n\n4. **Storage**\n   - Maximum storage space for your account data and analysis results\n\n## Quota Increase Requests\n\nIf you need higher limits than your current plan provides, you can:\n\n1. Upgrade to a higher subscription plan\n2. Submit a quota increase request for consideration\n\nQuota increase requests are reviewed by our team and may be approved based on legitimate business needs and system capacity. Additional charges may apply for approved quota increases beyond your plan limits.\n\n## Monitoring Your Usage\n\nYou can monitor your current usage and remaining quotas in the dashboard under the "Quota & Usage" section.',
    TRUE,
    2
  ),
  (
    'admin',
    'Quota Management Guidelines',
    E'# Quota Management Guidelines for Administrators\n\n## Reviewing Quota Increase Requests\n\nWhen evaluating quota increase requests, consider the following factors:\n\n1. **User\'s subscription plan and current usage**\n   - Is the user consistently reaching their limits?\n   - Would an upgrade to a higher plan be more appropriate?\n\n2. **Legitimacy of request**\n   - Is the request for a reasonable amount?\n   - Does the business justification make sense?\n\n3. **System capacity**\n   - Can our infrastructure handle the increased load?\n   - Will this impact other users?\n\n## Approval Guidelines\n\n- For small increases (10-25% above plan limits): May approve if justification is reasonable\n- For medium increases (25-50% above plan limits): Recommend plan upgrade, but may approve for enterprise customers with valid needs\n- For large increases (>50% above plan limits): Typically require a plan upgrade or custom enterprise agreement\n\n## Implementing Approved Increases\n\nOnce approved, set the custom limit in the Organization Settings panel. Update the user\'s billing information if additional charges apply for the quota increase.',
    FALSE,
    3
  );

-- Create table for admin settings related to rate limiting and quotas
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (category, key)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_system_settings_updated ON system_settings;
CREATE TRIGGER set_system_settings_updated
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert default settings for rate limiting and quotas
INSERT INTO system_settings (category, key, value, description, is_public)
VALUES
  (
    'rate_limiting',
    'default_limits',
    jsonb_build_object(
      'free', 30,
      'starter', 60,
      'pro', 120,
      'enterprise', 240
    ),
    'Default rate limits (requests per minute) for each subscription plan',
    TRUE
  ),
  (
    'quotas',
    'grace_percentage',
    jsonb_build_object(
      'value', 10
    ),
    'Grace percentage allowed for quota overages before enforcing limits',
    FALSE
  ),
  (
    'caching',
    'default_ttl',
    jsonb_build_object(
      'organization_details', 300,
      'usage_stats', 60,
      'analysis_results', 1800,
      'public_data', 3600
    ),
    'Default time-to-live (in seconds) for different types of cached data',
    FALSE
  );

-- Add custom override limits to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_limits JSONB;

-- Function to update documentation
CREATE OR REPLACE FUNCTION update_documentation(
  p_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_is_public BOOLEAN
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE documentation
  SET 
    title = COALESCE(p_title, title),
    content = COALESCE(p_content, content),
    is_public = COALESCE(p_is_public, is_public),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Function to get all documentation for a category
CREATE OR REPLACE FUNCTION get_documentation(
  p_category TEXT,
  p_public_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'is_public', d.is_public,
        'order_index', d.order_index,
        'updated_at', d.updated_at
      )
      ORDER BY d.order_index ASC
    )
  INTO v_result
  FROM documentation d
  WHERE 
    d.category = p_category
    AND (NOT p_public_only OR d.is_public);
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$; 