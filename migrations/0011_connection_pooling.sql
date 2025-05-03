-- Migration for database connection pooling setup
-- We'll configure pgbouncer settings for efficient connection pooling

-- First, check if pg_cron extension exists and create it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Create the extension if you have permission
        BEGIN
            CREATE EXTENSION pg_cron;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create pg_cron extension. You may need admin privileges: %', SQLERRM;
        END;
    END IF;
END $$;

-- Create a function to check and set pgbouncer configuration
CREATE OR REPLACE FUNCTION set_connection_pool_config()
RETURNS void AS $$
BEGIN
    -- Set max pool size
    PERFORM set_config('pgbouncer.max_client_conn', '300', false);
    
    -- Set default pool mode to transaction
    PERFORM set_config('pgbouncer.pool_mode', 'transaction', false);
    
    -- Set maximum pool size per user
    PERFORM set_config('pgbouncer.max_user_connections', '100', false);
    
    -- Set connection idle timeout (in seconds)
    PERFORM set_config('pgbouncer.server_idle_timeout', '60', false);
    
    -- Set client idle timeout (in seconds)
    PERFORM set_config('pgbouncer.client_idle_timeout', '60', false);
    
    -- Set server reset query
    PERFORM set_config('pgbouncer.server_reset_query', 'DISCARD ALL', false);
    
    -- Set connection lifetime (in seconds)
    PERFORM set_config('pgbouncer.server_lifetime', '3600', false);
    
    -- Set default pool size
    PERFORM set_config('pgbouncer.default_pool_size', '20', false);
    
    -- Set minimum pool size
    PERFORM set_config('pgbouncer.min_pool_size', '5', false);
    
    -- Set reserve pool size for handling bursts of connections
    PERFORM set_config('pgbouncer.reserve_pool_size', '10', false);
    
    -- Set reserve pool timeout (in seconds)
    PERFORM set_config('pgbouncer.reserve_pool_timeout', '5', false);
END;
$$ LANGUAGE plpgsql;

-- Create a function to monitor connection pool usage
CREATE OR REPLACE FUNCTION monitor_connection_pool()
RETURNS TABLE (
    database_name text,
    total_connections integer,
    active_connections integer,
    idle_connections integer,
    waiting_clients integer,
    connection_max_age interval
) AS $$
BEGIN
    RETURN QUERY
    WITH pool_stats AS (
        SELECT 
            current_database() as db,
            count(*) as total,
            count(*) FILTER (WHERE state = 'active') as active,
            count(*) FILTER (WHERE state = 'idle') as idle,
            count(*) FILTER (WHERE waiting) as waiting,
            max(CURRENT_TIMESTAMP - backend_start) as max_age
        FROM 
            pg_stat_activity
        WHERE 
            backend_type = 'client backend'
    )
    SELECT 
        db as database_name,
        total as total_connections,
        active as active_connections, 
        idle as idle_connections,
        waiting as waiting_clients,
        max_age as connection_max_age
    FROM 
        pool_stats;
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure to reset connection pool if needed
CREATE OR REPLACE PROCEDURE reset_connection_pool()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Terminate all idle connections
    PERFORM pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE 
        pid <> pg_backend_pid() AND 
        state = 'idle' AND
        backend_type = 'client backend';
END;
$$;

-- Create a view to monitor pool health
CREATE OR REPLACE VIEW connection_pool_health AS
SELECT * FROM monitor_connection_pool();

-- Create a function to safely refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_connection_pool_stats()
RETURNS void AS $$
BEGIN
    -- Check if the materialized view exists
    IF EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'connection_pool_stats'
    ) THEN
        -- Refresh the materialized view
        EXECUTE 'REFRESH MATERIALIZED VIEW connection_pool_stats';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a combined maintenance function for all pool tasks
CREATE OR REPLACE FUNCTION maintain_connection_pool()
RETURNS void AS $$
BEGIN
    -- Refresh the stats
    PERFORM refresh_connection_pool_stats();
    
    -- Run the connection pool reset
    CALL reset_connection_pool();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh pool stats only if pg_cron is available
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Schedule the job only if pg_cron exists
        PERFORM cron.schedule(
            'refresh-connection-pool-stats',
            '*/5 * * * *',  -- every 5 minutes
            'DO $$ BEGIN PERFORM maintain_connection_pool(); END $$;'
        );
    ELSE
        RAISE NOTICE 'pg_cron extension is not available. Scheduled jobs will not be created.';
    END IF;
END $$;

-- Create a materialized view to store historical pool data
CREATE MATERIALIZED VIEW IF NOT EXISTS connection_pool_stats AS
SELECT 
    now() as recorded_at,
    *
FROM 
    monitor_connection_pool();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS connection_pool_stats_recorded_at_idx 
ON connection_pool_stats(recorded_at);

-- Create a function to add connection context information
CREATE OR REPLACE FUNCTION pg_track_connection_context(
    app_name text,
    user_id text,
    session_id text
) RETURNS void AS $$
BEGIN
    -- Set application context parameters
    PERFORM set_config('app.context.app_name', app_name, false);
    PERFORM set_config('app.context.user_id', user_id, false);
    PERFORM set_config('app.context.session_id', session_id, false);
END;
$$ LANGUAGE plpgsql;

-- Add comments for better documentation
COMMENT ON FUNCTION set_connection_pool_config() IS 'Sets optimal connection pool configuration parameters';
COMMENT ON FUNCTION monitor_connection_pool() IS 'Provides real-time metrics about the database connection pool';
COMMENT ON PROCEDURE reset_connection_pool() IS 'Terminates idle connections to free up pool resources';
COMMENT ON VIEW connection_pool_health IS 'Real-time view of connection pool health metrics';
COMMENT ON MATERIALIZED VIEW connection_pool_stats IS 'Historical record of connection pool metrics';
COMMENT ON FUNCTION pg_track_connection_context(text, text, text) IS 'Tracks application-specific context for connections';
COMMENT ON FUNCTION refresh_connection_pool_stats() IS 'Safely refreshes the connection pool statistics materialized view';
COMMENT ON FUNCTION maintain_connection_pool() IS 'Combined maintenance function for connection pool operations'; 