-- Migration for database connection pooling setup
-- We'll configure connection pooling settings and monitoring functions

-- Check if pg_cron extension exists and only attempt to use it if available
DO $$ 
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
    ) THEN
        -- Only try to create if it's available but not created
        IF NOT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
        ) THEN
            BEGIN
                CREATE EXTENSION pg_cron;
                RAISE NOTICE 'pg_cron extension created successfully';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not create pg_cron extension. You may need admin privileges: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'pg_cron extension already exists';
        END IF;
    ELSE
        RAISE NOTICE 'pg_cron extension is not available on this server';
    END IF;
END $$;

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

-- Create a view to monitor pool health in real-time
CREATE OR REPLACE VIEW connection_pool_health AS
SELECT * FROM monitor_connection_pool();

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

    RAISE NOTICE 'Connection pool reset completed';
END;
$$;

-- Create a materialized view to store historical pool data
DO $$
BEGIN
    -- Only create if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'connection_pool_stats'
    ) THEN
        CREATE MATERIALIZED VIEW connection_pool_stats AS
        SELECT 
            now() as recorded_at,
            *
        FROM 
            monitor_connection_pool();
            
        -- Create index for faster queries
        CREATE INDEX connection_pool_stats_recorded_at_idx 
        ON connection_pool_stats(recorded_at);
        
        -- Add comment to the materialized view inside the block
        EXECUTE 'COMMENT ON MATERIALIZED VIEW connection_pool_stats IS ''Historical record of connection pool metrics''';
        
        RAISE NOTICE 'Created connection_pool_stats materialized view';
    ELSE
        RAISE NOTICE 'connection_pool_stats materialized view already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating materialized view: %', SQLERRM;
END $$;

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
        RAISE NOTICE 'Refreshed connection_pool_stats materialized view';
    ELSE
        RAISE NOTICE 'connection_pool_stats materialized view does not exist';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing materialized view: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create a combined maintenance function for all pool tasks
CREATE OR REPLACE FUNCTION maintain_connection_pool()
RETURNS void AS $$
BEGIN
    -- Try to refresh the stats
    BEGIN
        PERFORM refresh_connection_pool_stats();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error refreshing pool stats: %', SQLERRM;
    END;
    
    -- Try to reset the connection pool
    BEGIN
        CALL reset_connection_pool();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error resetting connection pool: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Connection pool maintenance completed';
END;
$$ LANGUAGE plpgsql;

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
    
    RAISE NOTICE 'Connection context updated for: %', app_name;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting connection context: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to get pooling configuration (safer alternative to set_connection_pool_config)
CREATE OR REPLACE FUNCTION get_connection_pool_config()
RETURNS TABLE (
    parameter_name text,
    current_value text,
    description text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        name::text as parameter_name, 
        setting::text as current_value,
        short_desc::text as description
    FROM 
        pg_settings
    WHERE 
        name LIKE '%pool%' OR
        name LIKE '%connection%' OR
        name = 'max_connections';
END;
$$ LANGUAGE plpgsql;

-- Safely schedule a cron job for maintenance if pg_cron is available
DO $$ 
DECLARE
    cron_exists boolean;
BEGIN
    -- Check if pg_cron extension exists and is active
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO cron_exists;
    
    IF cron_exists THEN
        -- Try to remove the job if it exists to avoid duplicates
        BEGIN
            PERFORM cron.unschedule('refresh-connection-pool-stats');
        EXCEPTION WHEN OTHERS THEN
            -- Job might not exist yet, that's fine
        END;
        
        -- Schedule the job only if pg_cron exists - with simpler syntax
        BEGIN
            PERFORM cron.schedule(
                'refresh-connection-pool-stats',
                '*/5 * * * *',  -- every 5 minutes
                'SELECT maintain_connection_pool()'
            );
            RAISE NOTICE 'Scheduled connection pool maintenance job with pg_cron';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not schedule job with pg_cron: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'pg_cron extension is not available or active. Scheduled jobs will not be created.';
    END IF;
END $$;

-- Create connection pool monitoring table for systems without materialized views
CREATE TABLE IF NOT EXISTS connection_pool_history (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    database_name TEXT,
    total_connections INTEGER,
    active_connections INTEGER,
    idle_connections INTEGER,
    waiting_clients INTEGER,
    connection_max_age INTERVAL
);

-- Create index on the history table
CREATE INDEX IF NOT EXISTS idx_connection_pool_history_recorded_at 
ON connection_pool_history(recorded_at);

-- Function to record current pool stats in history table
CREATE OR REPLACE FUNCTION record_connection_pool_stats()
RETURNS void AS $$
BEGIN
    INSERT INTO connection_pool_history (
        database_name, 
        total_connections, 
        active_connections, 
        idle_connections, 
        waiting_clients, 
        connection_max_age
    )
    SELECT * FROM monitor_connection_pool();
    
    -- Keep only recent data (last 7 days)
    DELETE FROM connection_pool_history 
    WHERE recorded_at < (CURRENT_TIMESTAMP - INTERVAL '7 days');
    
    RAISE NOTICE 'Recorded connection pool statistics';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error recording connection pool stats: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation, but avoid commenting on objects that might not exist
COMMENT ON FUNCTION monitor_connection_pool() IS 'Provides real-time metrics about the database connection pool';
COMMENT ON PROCEDURE reset_connection_pool() IS 'Terminates idle connections to free up pool resources';
COMMENT ON VIEW connection_pool_health IS 'Real-time view of connection pool health metrics';
COMMENT ON FUNCTION pg_track_connection_context(text, text, text) IS 'Tracks application-specific context for connections';
COMMENT ON FUNCTION refresh_connection_pool_stats() IS 'Safely refreshes the connection pool statistics materialized view';
COMMENT ON FUNCTION maintain_connection_pool() IS 'Combined maintenance function for connection pool operations';
COMMENT ON FUNCTION get_connection_pool_config() IS 'Retrieves current connection pool configuration settings';
COMMENT ON TABLE connection_pool_history IS 'Historical tracking of connection pool metrics';
COMMENT ON FUNCTION record_connection_pool_stats() IS 'Records current connection pool metrics to the history table'; 