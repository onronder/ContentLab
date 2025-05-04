| table_name              | column_name                 | data_type                   |
| ----------------------- | --------------------------- | --------------------------- |
| alert_log               | id                          | uuid                        |
| alert_log               | alert_type                  | text                        |
| alert_log               | description                 | text                        |
| alert_log               | entity_id                   | text                        |
| alert_log               | severity                    | text                        |
| alert_log               | email_sent                  | boolean                     |
| alert_log               | webhook_sent                | boolean                     |
| alert_log               | resolved                    | boolean                     |
| alert_log               | created_at                  | timestamp with time zone    |
| alert_log               | resolved_at                 | timestamp with time zone    |
| analysis_archives       | id                          | uuid                        |
| analysis_archives       | original_id                 | uuid                        |
| analysis_archives       | user_id                     | uuid                        |
| analysis_archives       | url                         | text                        |
| analysis_archives       | status                      | text                        |
| analysis_archives       | created_at                  | timestamp with time zone    |
| analysis_archives       | completed_at                | timestamp with time zone    |
| analysis_archives       | error_message               | text                        |
| analysis_archives       | content                     | jsonb                       |
| analysis_archives       | competitors                 | jsonb                       |
| analysis_archives       | results                     | jsonb                       |
| analysis_archives       | archived_at                 | timestamp with time zone    |
| analysis_jobs           | id                          | uuid                        |
| analysis_jobs           | user_id                     | uuid                        |
| analysis_jobs           | user_url                    | text                        |
| analysis_jobs           | competitor_urls             | ARRAY                       |
| analysis_jobs           | status                      | text                        |
| analysis_jobs           | error_message               | text                        |
| analysis_jobs           | created_at                  | timestamp with time zone    |
| analysis_jobs           | started_at                  | timestamp with time zone    |
| analysis_jobs           | completed_at                | timestamp with time zone    |
| analysis_jobs           | content_gaps                | ARRAY                       |
| analysis_jobs           | popular_themes              | ARRAY                       |
| analysis_jobs           | version                     | integer                     |
| analysis_jobs           | archived                    | boolean                     |
| analysis_jobs           | archive_eligible_at         | timestamp with time zone    |
| analysis_jobs           | organization_id             | uuid                        |
| analysis_jobs           | region_id                   | uuid                        |
| analysis_jobs           | region_assigned_at          | timestamp with time zone    |
| analysis_results        | id                          | uuid                        |
| analysis_results        | project_id                  | uuid                        |
| analysis_results        | user_id                     | uuid                        |
| analysis_results        | status                      | text                        |
| analysis_results        | content_gaps                | jsonb                       |
| analysis_results        | popular_themes              | jsonb                       |
| analysis_results        | error_message               | text                        |
| analysis_results        | started_at                  | timestamp with time zone    |
| analysis_results        | completed_at                | timestamp with time zone    |
| analysis_results        | created_at                  | timestamp with time zone    |
| api_keys                | id                          | uuid                        |
| api_keys                | user_id                     | uuid                        |
| api_keys                | organization_id             | uuid                        |
| api_keys                | name                        | text                        |
| api_keys                | key_hash                    | text                        |
| api_keys                | key_prefix                  | text                        |
| api_keys                | permissions                 | jsonb                       |
| api_keys                | created_at                  | timestamp with time zone    |
| api_keys                | expires_at                  | timestamp with time zone    |
| api_keys                | last_used_at                | timestamp with time zone    |
| api_keys                | is_active                   | boolean                     |
| audit_log_entries       | instance_id                 | uuid                        |
| audit_log_entries       | id                          | uuid                        |
| audit_log_entries       | payload                     | json                        |
| audit_log_entries       | created_at                  | timestamp with time zone    |
| audit_log_entries       | ip_address                  | character varying           |
| autoscaling_analytics   | day                         | timestamp with time zone    |
| autoscaling_analytics   | region_name                 | text                        |
| autoscaling_analytics   | scaling_actions             | bigint                      |
| autoscaling_analytics   | scale_up_actions            | bigint                      |
| autoscaling_analytics   | scale_down_actions          | bigint                      |
| autoscaling_analytics   | net_worker_change           | bigint                      |
| autoscaling_analytics   | avg_predicted_requests      | numeric                     |
| autoscaling_analytics   | max_predicted_requests      | integer                     |
| autoscaling_history     | id                          | uuid                        |
| autoscaling_history     | region_id                   | uuid                        |
| autoscaling_history     | region_name                 | text                        |
| autoscaling_history     | previous_workers            | integer                     |
| autoscaling_history     | new_workers                 | integer                     |
| autoscaling_history     | predicted_requests          | integer                     |
| autoscaling_history     | reason                      | text                        |
| autoscaling_history     | created_at                  | timestamp with time zone    |
| cache_items             | id                          | uuid                        |
| cache_items             | cache_key                   | text                        |
| cache_items             | cache_value                 | jsonb                       |
| cache_items             | expires_at                  | timestamp with time zone    |
| cache_items             | created_at                  | timestamp with time zone    |
| cache_items             | updated_at                  | timestamp with time zone    |
| connection_pool_health  | database_name               | text                        |
| connection_pool_health  | total_connections           | integer                     |
| connection_pool_health  | active_connections          | integer                     |
| connection_pool_health  | idle_connections            | integer                     |
| connection_pool_health  | waiting_clients             | integer                     |
| connection_pool_health  | connection_max_age          | interval                    |
| connection_pool_history | id                          | integer                     |
| connection_pool_history | recorded_at                 | timestamp with time zone    |
| connection_pool_history | database_name               | text                        |
| connection_pool_history | total_connections           | integer                     |
| connection_pool_history | active_connections          | integer                     |
| connection_pool_history | idle_connections            | integer                     |
| connection_pool_history | waiting_clients             | integer                     |
| connection_pool_history | connection_max_age          | interval                    |
| documentation           | id                          | uuid                        |
| documentation           | category                    | text                        |
| documentation           | title                       | text                        |
| documentation           | content                     | text                        |
| documentation           | is_public                   | boolean                     |
| documentation           | order_index                 | integer                     |
| documentation           | created_at                  | timestamp with time zone    |
| documentation           | updated_at                  | timestamp with time zone    |
| flow_state              | id                          | uuid                        |
| flow_state              | user_id                     | uuid                        |
| flow_state              | auth_code                   | text                        |
| flow_state              | code_challenge_method       | USER-DEFINED                |
| flow_state              | code_challenge              | text                        |
| flow_state              | provider_type               | text                        |
| flow_state              | provider_access_token       | text                        |
| flow_state              | provider_refresh_token      | text                        |
| flow_state              | created_at                  | timestamp with time zone    |
| flow_state              | updated_at                  | timestamp with time zone    |
| flow_state              | authentication_method       | text                        |
| flow_state              | auth_code_issued_at         | timestamp with time zone    |
| identities              | provider_id                 | text                        |
| identities              | user_id                     | uuid                        |
| identities              | identity_data               | jsonb                       |
| identities              | provider                    | text                        |
| identities              | last_sign_in_at             | timestamp with time zone    |
| identities              | created_at                  | timestamp with time zone    |
| identities              | updated_at                  | timestamp with time zone    |
| identities              | email                       | text                        |
| identities              | id                          | uuid                        |
| instances               | id                          | uuid                        |
| instances               | uuid                        | uuid                        |
| instances               | raw_base_config             | text                        |
| instances               | created_at                  | timestamp with time zone    |
| instances               | updated_at                  | timestamp with time zone    |
| job_status_log          | id                          | uuid                        |
| job_status_log          | job_id                      | uuid                        |
| job_status_log          | previous_status             | text                        |
| job_status_log          | new_status                  | text                        |
| job_status_log          | changed_at                  | timestamp with time zone    |
| mfa_amr_claims          | session_id                  | uuid                        |
| mfa_amr_claims          | created_at                  | timestamp with time zone    |
| mfa_amr_claims          | updated_at                  | timestamp with time zone    |
| mfa_amr_claims          | authentication_method       | text                        |
| mfa_amr_claims          | id                          | uuid                        |
| mfa_challenges          | id                          | uuid                        |
| mfa_challenges          | factor_id                   | uuid                        |
| mfa_challenges          | created_at                  | timestamp with time zone    |
| mfa_challenges          | verified_at                 | timestamp with time zone    |
| mfa_challenges          | ip_address                  | inet                        |
| mfa_challenges          | otp_code                    | text                        |
| mfa_challenges          | web_authn_session_data      | jsonb                       |
| mfa_factors             | id                          | uuid                        |
| mfa_factors             | user_id                     | uuid                        |
| mfa_factors             | friendly_name               | text                        |
| mfa_factors             | factor_type                 | USER-DEFINED                |
| mfa_factors             | status                      | USER-DEFINED                |
| mfa_factors             | created_at                  | timestamp with time zone    |
| mfa_factors             | updated_at                  | timestamp with time zone    |
| mfa_factors             | secret                      | text                        |
| mfa_factors             | phone                       | text                        |
| mfa_factors             | last_challenged_at          | timestamp with time zone    |
| mfa_factors             | web_authn_credential        | jsonb                       |
| mfa_factors             | web_authn_aaguid            | uuid                        |
| one_time_tokens         | id                          | uuid                        |
| one_time_tokens         | user_id                     | uuid                        |
| one_time_tokens         | token_type                  | USER-DEFINED                |
| one_time_tokens         | token_hash                  | text                        |
| one_time_tokens         | relates_to                  | text                        |
| one_time_tokens         | created_at                  | timestamp without time zone |
| one_time_tokens         | updated_at                  | timestamp without time zone |
| organization_members    | id                          | uuid                        |
| organization_members    | organization_id             | uuid                        |
| organization_members    | user_id                     | uuid                        |
| organization_members    | role                        | text                        |
| organization_members    | joined_at                   | timestamp with time zone    |
| organization_members    | invited_by                  | uuid                        |
| organizations           | id                          | uuid                        |
| organizations           | name                        | text                        |
| organizations           | description                 | text                        |
| organizations           | logo_url                    | text                        |
| organizations           | created_at                  | timestamp with time zone    |
| organizations           | updated_at                  | timestamp with time zone    |
| organizations           | subscription_tier           | text                        |
| organizations           | subscription_status         | text                        |
| organizations           | subscription_plan_id        | uuid                        |
| organizations           | subscription_updated_at     | timestamp with time zone    |
| organizations           | custom_limits               | jsonb                       |
| permissions             | id                          | uuid                        |
| permissions             | name                        | text                        |
| permissions             | description                 | text                        |
| permissions             | resource                    | text                        |
| permissions             | action                      | text                        |
| permissions             | created_at                  | timestamp with time zone    |
| projects                | id                          | uuid                        |
| projects                | user_id                     | uuid                        |
| projects                | project_name                | text                        |
| projects                | user_url                    | text                        |
| projects                | competitor_urls             | jsonb                       |
| projects                | created_at                  | timestamp with time zone    |
| projects                | updated_at                  | timestamp with time zone    |
| quota_increase_requests | id                          | uuid                        |
| quota_increase_requests | organization_id             | uuid                        |
| quota_increase_requests | requested_by                | uuid                        |
| quota_increase_requests | request_type                | text                        |
| quota_increase_requests | current_limit               | integer                     |
| quota_increase_requests | requested_limit             | integer                     |
| quota_increase_requests | reason                      | text                        |
| quota_increase_requests | status                      | text                        |
| quota_increase_requests | reviewed_by                 | uuid                        |
| quota_increase_requests | reviewed_at                 | timestamp with time zone    |
| quota_increase_requests | created_at                  | timestamp with time zone    |
| quota_increase_requests | updated_at                  | timestamp with time zone    |
| rate_limit_tracking     | id                          | uuid                        |
| rate_limit_tracking     | organization_id             | uuid                        |
| rate_limit_tracking     | user_id                     | uuid                        |
| rate_limit_tracking     | endpoint                    | text                        |
| rate_limit_tracking     | minute                      | timestamp with time zone    |
| rate_limit_tracking     | request_count               | integer                     |
| rate_limit_tracking     | created_at                  | timestamp with time zone    |
| refresh_tokens          | instance_id                 | uuid                        |
| refresh_tokens          | id                          | bigint                      |
| refresh_tokens          | token                       | character varying           |
| refresh_tokens          | user_id                     | character varying           |
| refresh_tokens          | revoked                     | boolean                     |
| refresh_tokens          | created_at                  | timestamp with time zone    |
| refresh_tokens          | updated_at                  | timestamp with time zone    |
| refresh_tokens          | parent                      | character varying           |
| refresh_tokens          | session_id                  | uuid                        |
| region_status           | id                          | uuid                        |
| region_status           | name                        | text                        |
| region_status           | display_name                | text                        |
| region_status           | location                    | text                        |
| region_status           | is_active                   | boolean                     |
| region_status           | priority                    | integer                     |
| region_status           | max_workers                 | integer                     |
| region_status           | current_workers             | integer                     |
| region_status           | target_workers              | integer                     |
| region_status           | auto_scaling                | boolean                     |
| region_status           | active_workers              | bigint                      |
| region_status           | inactive_workers            | bigint                      |
| region_status           | failed_workers              | bigint                      |
| region_status           | pending_jobs                | bigint                      |
| region_status           | processing_jobs             | bigint                      |
| region_status           | avg_latency_ms              | numeric                     |
| role_permissions        | id                          | uuid                        |
| role_permissions        | role_id                     | uuid                        |
| role_permissions        | permission_id               | uuid                        |
| role_permissions        | granted_at                  | timestamp with time zone    |
| saml_providers          | id                          | uuid                        |
| saml_providers          | sso_provider_id             | uuid                        |
| saml_providers          | entity_id                   | text                        |
| saml_providers          | metadata_xml                | text                        |
| saml_providers          | metadata_url                | text                        |
| saml_providers          | attribute_mapping           | jsonb                       |
| saml_providers          | created_at                  | timestamp with time zone    |
| saml_providers          | updated_at                  | timestamp with time zone    |
| saml_providers          | name_id_format              | text                        |
| saml_relay_states       | id                          | uuid                        |
| saml_relay_states       | sso_provider_id             | uuid                        |
| saml_relay_states       | request_id                  | text                        |
| saml_relay_states       | for_email                   | text                        |
| saml_relay_states       | redirect_to                 | text                        |
| saml_relay_states       | created_at                  | timestamp with time zone    |
| saml_relay_states       | updated_at                  | timestamp with time zone    |
| saml_relay_states       | flow_state_id               | uuid                        |
| scheduled_check_log     | id                          | uuid                        |
| scheduled_check_log     | check_type                  | text                        |
| scheduled_check_log     | result                      | jsonb                       |
| scheduled_check_log     | created_at                  | timestamp with time zone    |
| schema_migrations       | version                     | character varying           |
| security_audit_log      | id                          | uuid                        |
| security_audit_log      | user_id                     | uuid                        |
| security_audit_log      | api_key_id                  | uuid                        |
| security_audit_log      | organization_id             | uuid                        |
| security_audit_log      | event_type                  | text                        |
| security_audit_log      | resource                    | text                        |
| security_audit_log      | action                      | text                        |
| security_audit_log      | details                     | jsonb                       |
| security_audit_log      | ip_address                  | text                        |
| security_audit_log      | user_agent                  | text                        |
| security_audit_log      | created_at                  | timestamp with time zone    |
| sessions                | id                          | uuid                        |
| sessions                | user_id                     | uuid                        |
| sessions                | created_at                  | timestamp with time zone    |
| sessions                | updated_at                  | timestamp with time zone    |
| sessions                | factor_id                   | uuid                        |
| sessions                | aal                         | USER-DEFINED                |
| sessions                | not_after                   | timestamp with time zone    |
| sessions                | refreshed_at                | timestamp without time zone |
| sessions                | user_agent                  | text                        |
| sessions                | ip                          | inet                        |
| sessions                | tag                         | text                        |
| sso_domain_allowlist    | id                          | uuid                        |
| sso_domain_allowlist    | organization_id             | uuid                        |
| sso_domain_allowlist    | domain                      | text                        |
| sso_domain_allowlist    | created_at                  | timestamp with time zone    |
| sso_domains             | id                          | uuid                        |
| sso_domains             | sso_provider_id             | uuid                        |
| sso_domains             | domain                      | text                        |
| sso_domains             | created_at                  | timestamp with time zone    |
| sso_domains             | updated_at                  | timestamp with time zone    |
| sso_providers           | id                          | uuid                        |
| sso_providers           | id                          | uuid                        |
| sso_providers           | resource_id                 | text                        |
| sso_providers           | organization_id             | uuid                        |
| sso_providers           | provider_type               | text                        |
| sso_providers           | created_at                  | timestamp with time zone    |
| sso_providers           | provider_name               | text                        |
| sso_providers           | updated_at                  | timestamp with time zone    |
| sso_providers           | is_active                   | boolean                     |
| sso_providers           | config                      | jsonb                       |
| sso_providers           | created_at                  | timestamp with time zone    |
| sso_providers           | updated_at                  | timestamp with time zone    |
| subscription_plans      | id                          | uuid                        |
| subscription_plans      | name                        | text                        |
| subscription_plans      | display_name                | text                        |
| subscription_plans      | description                 | text                        |
| subscription_plans      | is_active                   | boolean                     |
| subscription_plans      | price_monthly               | numeric                     |
| subscription_plans      | price_yearly                | numeric                     |
| subscription_plans      | max_analyses_daily          | integer                     |
| subscription_plans      | max_analyses_monthly        | integer                     |
| subscription_plans      | max_competitor_urls         | integer                     |
| subscription_plans      | max_api_requests_daily      | integer                     |
| subscription_plans      | storage_limit_mb            | integer                     |
| subscription_plans      | priority_queue              | boolean                     |
| subscription_plans      | created_at                  | timestamp with time zone    |
| subscription_plans      | updated_at                  | timestamp with time zone    |
| system_settings         | id                          | uuid                        |
| system_settings         | category                    | text                        |
| system_settings         | key                         | text                        |
| system_settings         | value                       | jsonb                       |
| system_settings         | description                 | text                        |
| system_settings         | is_public                   | boolean                     |
| system_settings         | created_at                  | timestamp with time zone    |
| system_settings         | updated_at                  | timestamp with time zone    |
| traffic_metrics         | time                        | timestamp with time zone    |
| traffic_metrics         | endpoint                    | text                        |
| traffic_metrics         | region                      | text                        |
| traffic_metrics         | requests                    | integer                     |
| traffic_metrics         | errors                      | integer                     |
| traffic_metrics         | avg_latency_ms              | integer                     |
| traffic_metrics         | p95_latency_ms              | integer                     |
| traffic_metrics         | max_latency_ms              | integer                     |
| traffic_patterns        | id                          | uuid                        |
| traffic_patterns        | name                        | text                        |
| traffic_patterns        | description                 | text                        |
| traffic_patterns        | is_active                   | boolean                     |
| traffic_patterns        | endpoint                    | text                        |
| traffic_patterns        | day_of_week                 | ARRAY                       |
| traffic_patterns        | hour_of_day                 | ARRAY                       |
| traffic_patterns        | multiplier                  | double precision            |
| traffic_patterns        | created_at                  | timestamp with time zone    |
| traffic_patterns        | updated_at                  | timestamp with time zone    |
| traffic_predictions     | id                          | uuid                        |
| traffic_predictions     | endpoint                    | text                        |
| traffic_predictions     | region                      | text                        |
| traffic_predictions     | predicted_for               | timestamp with time zone    |
| traffic_predictions     | predicted_at                | timestamp with time zone    |
| traffic_predictions     | predicted_requests          | integer                     |
| traffic_predictions     | confidence_score            | double precision            |
| traffic_predictions     | model_version               | text                        |
| traffic_predictions     | created_at                  | timestamp with time zone    |
| traffic_predictions     | updated_at                  | timestamp with time zone    |
| usage_tracking          | id                          | uuid                        |
| usage_tracking          | organization_id             | uuid                        |
| usage_tracking          | date                        | date                        |
| usage_tracking          | analyses_count              | integer                     |
| usage_tracking          | api_requests_count          | integer                     |
| usage_tracking          | competitor_urls_count       | integer                     |
| usage_tracking          | created_at                  | timestamp with time zone    |
| usage_tracking          | updated_at                  | timestamp with time zone    |
| user_role_assignments   | id                          | uuid                        |
| user_role_assignments   | user_id                     | uuid                        |
| user_role_assignments   | role_id                     | uuid                        |
| user_role_assignments   | assigned_at                 | timestamp with time zone    |
| user_role_assignments   | assigned_by                 | uuid                        |
| user_roles              | id                          | uuid                        |
| user_roles              | name                        | text                        |
| user_roles              | description                 | text                        |
| user_roles              | created_at                  | timestamp with time zone    |
| users                   | instance_id                 | uuid                        |
| users                   | id                          | uuid                        |
| users                   | aud                         | character varying           |
| users                   | role                        | character varying           |
| users                   | email                       | character varying           |
| users                   | encrypted_password          | character varying           |
| users                   | email_confirmed_at          | timestamp with time zone    |
| users                   | invited_at                  | timestamp with time zone    |
| users                   | confirmation_token          | character varying           |
| users                   | confirmation_sent_at        | timestamp with time zone    |
| users                   | recovery_token              | character varying           |
| users                   | recovery_sent_at            | timestamp with time zone    |
| users                   | email_change_token_new      | character varying           |
| users                   | email_change                | character varying           |
| users                   | email_change_sent_at        | timestamp with time zone    |
| users                   | last_sign_in_at             | timestamp with time zone    |
| users                   | raw_app_meta_data           | jsonb                       |
| users                   | raw_user_meta_data          | jsonb                       |
| users                   | is_super_admin              | boolean                     |
| users                   | created_at                  | timestamp with time zone    |
| users                   | updated_at                  | timestamp with time zone    |
| users                   | phone                       | text                        |
| users                   | phone_confirmed_at          | timestamp with time zone    |
| users                   | phone_change                | text                        |
| users                   | phone_change_token          | character varying           |
| users                   | phone_change_sent_at        | timestamp with time zone    |
| users                   | confirmed_at                | timestamp with time zone    |
| users                   | email_change_token_current  | character varying           |
| users                   | email_change_confirm_status | smallint                    |
| users                   | banned_until                | timestamp with time zone    |
| users                   | reauthentication_token      | character varying           |
| users                   | reauthentication_sent_at    | timestamp with time zone    |
| users                   | is_sso_user                 | boolean                     |
| users                   | deleted_at                  | timestamp with time zone    |
| users                   | is_anonymous                | boolean                     |
| worker_capacity         | id                          | uuid                        |
| worker_capacity         | region_id                   | uuid                        |
| worker_capacity         | max_workers                 | integer                     |
| worker_capacity         | current_workers             | integer                     |
| worker_capacity         | target_workers              | integer                     |
| worker_capacity         | auto_scaling                | boolean                     |
| worker_capacity         | created_at                  | timestamp with time zone    |
| worker_capacity         | updated_at                  | timestamp with time zone    |
| worker_health           | id                          | uuid                        |
| worker_health           | worker_id                   | text                        |
| worker_health           | last_heartbeat              | timestamp with time zone    |
| worker_health           | first_seen                  | timestamp with time zone    |
| worker_health           | status                      | text                        |
| worker_health           | jobs_processed              | integer                     |
| worker_health           | jobs_failed                 | integer                     |
| worker_health           | metadata                    | jsonb                       |
| worker_health           | cpu_usage                   | double precision            |
| worker_health           | memory_usage                | double precision            |
| worker_health           | created_at                  | timestamp with time zone    |
| worker_health           | updated_at                  | timestamp with time zone    |
| worker_health           | region_id                   | uuid                        |
| worker_health           | latency_ms                  | integer                     |
| worker_regions          | id                          | uuid                        |
| worker_regions          | name                        | text                        |
| worker_regions          | display_name                | text                        |
| worker_regions          | location                    | text                        |
| worker_regions          | is_active                   | boolean                     |
| worker_regions          | priority                    | integer                     |
| worker_regions          | created_at                  | timestamp with time zone    |
| worker_regions          | updated_at                  | timestamp with time zone    |
| worker_status_history   | id                          | uuid                        |
| worker_status_history   | worker_id                   | uuid                        |
| worker_status_history   | status                      | text                        |
| worker_status_history   | previous_status             | text                        |
| worker_status_history   | last_heartbeat              | timestamp with time zone    |
| worker_status_history   | created_at                  | timestamp with time zone    |