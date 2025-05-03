# ContentCreate Database Documentation

This document provides a comprehensive overview of the ContentCreate database structure, including tables, schemas, relationships, and Row Level Security (RLS) policies.

## Database Schema Overview

ContentCreate uses PostgreSQL with Supabase, implementing a structured schema for content analysis, user management, and system monitoring.

## Core Tables

### Authentication and Authorization

#### User Roles and Permissions
- `user_roles`: Defines different access levels (admin, manager, editor, viewer)
- `user_role_assignments`: Links users to roles
- `permissions`: Defines granular access controls
- `role_permissions`: Maps roles to specific permissions

#### Organizations
- `organizations`: Represents teams/companies using the system
- `organization_members`: Links users to organizations with roles
- `sso_providers`: Manages Single Sign-On integration
- `sso_domain_allowlist`: Controls domain-based access for SSO

#### API Keys
- `api_keys`: Manages API authentication
- `security_audit_log`: Tracks security events

### Content Analysis

#### Projects
- `projects`: Stores user websites and competitor URLs for analysis
  - RLS enabled: Users can only access their own projects
  - Includes name, user_url, and competitor_urls

#### Analysis
- `analysis_results`: Stores content analysis outcomes
  - RLS enabled: Users can only access their own analysis results
  - Tracks status (PENDING, PROCESSING, COMPLETED, FAILED)
  - Stores content_gaps and popular_themes

### System Monitoring

#### Basic Metrics
- `counters`: Simple numerical counters (page_views, api_calls)
- `access_logs`: Records system access events

#### Connection Pooling
Connection pool monitoring via stored procedures:
- `monitor_connection_pool()`: Provides real-time metrics
- `connection_pool_health`: View for connection pool statistics
- `connection_pool_stats`: Materialized view for historical data

#### Rate Limiting and Quotas
Functions for managing usage quotas and rate limiting:
- Tables for tracking API usage
- Organization quota management
- Rate limiting implementation

## Row Level Security (RLS)

RLS is implemented on the following tables to ensure data isolation:

### Projects Table
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_policy ON projects
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY projects_insert_policy ON projects
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY projects_update_policy ON projects
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY projects_delete_policy ON projects
  FOR DELETE TO authenticated USING (user_id = auth.uid());
```

### Analysis Results Table
```sql
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_results_select_policy ON analysis_results
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY analysis_results_insert_policy ON analysis_results
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY analysis_results_update_policy ON analysis_results
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY analysis_results_delete_policy ON analysis_results
  FOR DELETE TO authenticated USING (user_id = auth.uid());
```

## Database Functions

### API Keys
- `generate_api_key()`: Creates and stores API keys
- `validate_api_key()`: Validates API key authenticity

### Permissions
- `check_user_permission()`: Verifies user access to resources
- `get_user_permissions()`: Retrieves all permissions for a user

### Connection Pool Management
- `set_connection_pool_config()`: Configures connection pool parameters
- `monitor_connection_pool()`: Tracks connection pool metrics
- `reset_connection_pool()`: Terminates idle connections
- `maintain_connection_pool()`: Combined maintenance function

## Database Indexes

Indexes are implemented on frequently queried columns for performance:

### Project Indexes
- `idx_projects_user_id`: Speeds up user-based project queries

### Analysis Indexes
- `idx_analysis_results_project_id`: Optimizes project-based filtering
- `idx_analysis_results_user_id`: Speeds up user-based analysis queries
- `idx_analysis_results_status`: Filters by analysis status

### Organization Indexes
- `idx_organization_members_org_id`: Organization membership queries
- `idx_organization_members_user_id`: User membership queries
- `idx_analysis_jobs_organization_id`: Organization-based job queries

### Security Indexes
- `idx_security_audit_log_user_id`, `idx_security_audit_log_event_type`: Optimize audit log queries
- `idx_api_keys_user_id`, `idx_api_keys_organization_id`: Optimize API key lookups

## Database Migrations

The database schema has evolved through multiple migrations:
1. Initial setup (0001)
2. Content analysis (0002)
3. Background processing (0003)
4. Worker dashboard (0004)
5. Worker health monitoring (0005)
6. Data management (0006)
7. Monitoring enhancements (0007)
8. Authentication enhancements (0008)
9. Rate limiting and quotas (0009)
10. Cache and documentation (0010)
11. Connection pooling (0011) 