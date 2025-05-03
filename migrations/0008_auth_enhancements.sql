-- Migration number: 0008 Authentication Enhancements

-- Define user roles and permissions system

-- Roles table to define different access levels
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (name, description) 
VALUES 
  ('admin', 'Administrator with full access to all features'),
  ('manager', 'Can manage team members and view all content'),
  ('editor', 'Can create and edit content'),
  ('viewer', 'Read-only access to content')
ON CONFLICT (name) DO NOTHING;

-- Link users to roles
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role_id)
);

-- Add index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);

-- Permissions for granular control
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) 
VALUES 
  ('view_reports', 'reports', 'read', 'View analysis reports'),
  ('create_reports', 'reports', 'create', 'Create new analysis reports'),
  ('edit_reports', 'reports', 'update', 'Edit existing analysis reports'),
  ('delete_reports', 'reports', 'delete', 'Delete analysis reports'),
  ('manage_team', 'team', 'manage', 'Manage team members'),
  ('view_system', 'system', 'read', 'View system metrics and status'),
  ('manage_system', 'system', 'manage', 'Manage system settings'),
  ('manage_api_keys', 'api_keys', 'manage', 'Manage API keys')
ON CONFLICT (name) DO NOTHING;

-- Link roles to permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (role_id, permission_id)
);

-- Add default role-permission mappings
DO $$
DECLARE
  admin_role_id UUID;
  manager_role_id UUID;
  editor_role_id UUID;
  viewer_role_id UUID;
  
  view_reports_id UUID;
  create_reports_id UUID;
  edit_reports_id UUID;
  delete_reports_id UUID;
  manage_team_id UUID;
  view_system_id UUID;
  manage_system_id UUID;
  manage_api_keys_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
  SELECT id INTO manager_role_id FROM user_roles WHERE name = 'manager';
  SELECT id INTO editor_role_id FROM user_roles WHERE name = 'editor';
  SELECT id INTO viewer_role_id FROM user_roles WHERE name = 'viewer';
  
  -- Get permission IDs
  SELECT id INTO view_reports_id FROM permissions WHERE name = 'view_reports';
  SELECT id INTO create_reports_id FROM permissions WHERE name = 'create_reports';
  SELECT id INTO edit_reports_id FROM permissions WHERE name = 'edit_reports';
  SELECT id INTO delete_reports_id FROM permissions WHERE name = 'delete_reports';
  SELECT id INTO manage_team_id FROM permissions WHERE name = 'manage_team';
  SELECT id INTO view_system_id FROM permissions WHERE name = 'view_system';
  SELECT id INTO manage_system_id FROM permissions WHERE name = 'manage_system';
  SELECT id INTO manage_api_keys_id FROM permissions WHERE name = 'manage_api_keys';
  
  -- Admin role gets all permissions
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (admin_role_id, view_reports_id),
    (admin_role_id, create_reports_id),
    (admin_role_id, edit_reports_id),
    (admin_role_id, delete_reports_id),
    (admin_role_id, manage_team_id),
    (admin_role_id, view_system_id),
    (admin_role_id, manage_system_id),
    (admin_role_id, manage_api_keys_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Manager role permissions
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (manager_role_id, view_reports_id),
    (manager_role_id, create_reports_id),
    (manager_role_id, edit_reports_id),
    (manager_role_id, delete_reports_id),
    (manager_role_id, manage_team_id),
    (manager_role_id, view_system_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Editor role permissions
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (editor_role_id, view_reports_id),
    (editor_role_id, create_reports_id),
    (editor_role_id, edit_reports_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Viewer role permissions
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (viewer_role_id, view_reports_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Team/organization capabilities

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active'
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE (organization_id, user_id)
);

-- Add index for faster member lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Join organizations to analysis jobs to maintain proper access control
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_organization_id ON analysis_jobs(organization_id);

-- API key management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Store only the hash of the key, never the actual key
  key_prefix TEXT NOT NULL, -- First few chars for display purposes
  permissions JSONB, -- Specific permissions for this key
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Function to generate and store an API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_user_id UUID,
  p_organization_id UUID,
  p_name TEXT,
  p_expires_in INTERVAL DEFAULT NULL,
  p_permissions JSONB DEFAULT NULL
)
RETURNS TABLE (
  key TEXT,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key TEXT;
  v_key_prefix TEXT;
  v_key_hash TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate a random API key
  v_key := encode(gen_random_bytes(32), 'hex');
  v_key_prefix := substring(v_key from 1 for 8);
  
  -- Hash the key for storage
  v_key_hash := crypt(v_key, gen_salt('bf'));
  
  -- Calculate expiration time if provided
  IF p_expires_in IS NOT NULL THEN
    v_expires_at := CURRENT_TIMESTAMP + p_expires_in;
  END IF;
  
  -- Store the key details
  INSERT INTO api_keys (
    user_id,
    organization_id,
    name,
    key_hash,
    key_prefix,
    permissions,
    expires_at
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_name,
    v_key_hash,
    v_key_prefix,
    p_permissions,
    v_expires_at
  );
  
  -- Return the full key (will only be shown once) and expiration
  RETURN QUERY SELECT v_key AS key, v_expires_at AS expires_at;
END;
$$;

-- Function to validate an API key
CREATE OR REPLACE FUNCTION validate_api_key(
  p_key TEXT
)
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  permissions JSONB,
  key_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key_prefix TEXT;
BEGIN
  -- Get the prefix for searching
  v_key_prefix := substring(p_key from 1 for 8);
  
  -- Find and validate the key
  RETURN QUERY
  SELECT 
    k.user_id, 
    k.organization_id, 
    k.permissions,
    k.id AS key_id
  FROM api_keys k
  WHERE 
    k.key_prefix = v_key_prefix
    AND k.key_hash = crypt(p_key, k.key_hash)
    AND k.is_active = TRUE
    AND (k.expires_at IS NULL OR k.expires_at > CURRENT_TIMESTAMP);
    
  -- Update last used timestamp
  UPDATE api_keys
  SET last_used_at = CURRENT_TIMESTAMP
  WHERE key_prefix = v_key_prefix
    AND key_hash = crypt(p_key, key_hash);
END;
$$;

-- Security audit trail
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  api_key_id UUID REFERENCES api_keys(id),
  organization_id UUID REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  resource TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster audit log querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_organization_id ON security_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Function to record a security audit event
CREATE OR REPLACE FUNCTION record_security_audit(
  p_user_id UUID,
  p_api_key_id UUID,
  p_organization_id UUID,
  p_event_type TEXT,
  p_resource TEXT,
  p_action TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    api_key_id,
    organization_id,
    event_type,
    resource,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_api_key_id,
    p_organization_id,
    p_event_type,
    p_resource,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Enable Row Level Security on tables for proper data isolation
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policy for analysis_jobs - users can only see jobs belonging to their organization
CREATE POLICY analysis_jobs_org_isolation ON analysis_jobs
  USING (
    (organization_id IS NULL) -- Legacy data with no organization
    OR 
    (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );

-- Create SSO-related tables
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL, -- 'google', 'microsoft', 'okta', etc.
  provider_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL, -- Provider-specific configuration (client_id, tenant_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  UNIQUE (organization_id, provider_type)
);

-- SSO domain allowlist for organizations
CREATE TABLE IF NOT EXISTS sso_domain_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- e.g., 'example.com'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, domain)
);

-- Add indexes for SSO tables
CREATE INDEX IF NOT EXISTS idx_sso_providers_organization_id ON sso_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_domain_allowlist_organization_id ON sso_domain_allowlist(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_domain_allowlist_domain ON sso_domain_allowlist(domain);

-- Create a helper function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_resource TEXT, 
  p_action TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ura.user_id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;

-- Create a helper function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  resource TEXT,
  action TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT DISTINCT p.resource, p.action
  FROM user_role_assignments ura
  JOIN role_permissions rp ON ura.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ura.user_id = p_user_id;
$$; 