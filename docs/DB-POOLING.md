# Database Connection Pooling

This document explains the database connection pooling implementation for ContentCreate and how to apply the migration.

## Overview

Database connection pooling is crucial for performance in applications with many concurrent users. It reduces the overhead of creating new database connections by reusing existing ones from a pool. The refactored `0011_connection_pooling.sql` migration adds connection pooling functionality to your Supabase database.

## Key Changes in the Refactored Migration

The original migration file had several issues which have been fixed:

1. **Enhanced pg_cron handling**: Now checks if the extension is available before attempting to use it
2. **Removed pgbouncer direct configuration**: Since Supabase projects already have pgbouncer configured, removed the function that attempted to set pgbouncer parameters directly
3. **Added robust error handling**: All functions now include proper exception handling
4. **Added fallback mechanisms**: Added a regular table for connection history in addition to the materialized view
5. **Safer cron job scheduling**: Improved the way scheduled jobs are created
6. **Added detailed logging**: Functions now provide feedback through RAISE NOTICE
7. **Added diagnostic function**: New function to check current pool configuration

## Database Objects Created

The migration creates the following objects:

### Tables
- `connection_pool_history`: Stores connection pool metrics over time

### Views
- `connection_pool_health`: Real-time view of connection pool status

### Materialized Views
- `connection_pool_stats`: Snapshot of connection pool status at a point in time

### Functions
- `monitor_connection_pool()`: Returns current pool statistics
- `refresh_connection_pool_stats()`: Updates the materialized view
- `maintain_connection_pool()`: Runs all maintenance tasks
- `pg_track_connection_context()`: Adds metadata to connections
- `record_connection_pool_stats()`: Records metrics to history table
- `get_connection_pool_config()`: Shows current pool configuration

### Procedures
- `reset_connection_pool()`: Terminates idle connections

## How to Apply the Migration

### Option 1: Apply via Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Go to SQL Editor
4. Copy the contents of the `migrations/0011_connection_pooling.sql` file
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

### Option 2: Apply via Supabase CLI (Local Development)

If Docker is installed and your local Supabase development environment is running:

```bash
supabase start
supabase migration up
```

### Option 3: Apply via Supabase CLI (Remote Project)

If you want to apply directly to your remote Supabase project:

```bash
# Link to your remote project (Run once)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Option 4: Apply via direct SQL connection

If you have direct database access:

```bash
psql -U postgres -h database.server.address -d your_database_name -f migrations/0011_connection_pooling.sql
```

## Using Connection Pooling in Your Application

### Monitoring Pool Status

To check the current state of the connection pool:

```sql
SELECT * FROM connection_pool_health;
```

To view historical connection pool metrics:

```sql
SELECT * FROM connection_pool_history 
ORDER BY recorded_at DESC 
LIMIT 100;
```

### Manually Running Maintenance

To manually run pool maintenance:

```sql
SELECT maintain_connection_pool();
```

### Checking Pool Configuration

To view the current connection pool configuration:

```sql
SELECT * FROM get_connection_pool_config();
```

## Troubleshooting

### Common Issues

1. **pg_cron not available**: If you see notices about pg_cron not being available, the maintenance tasks will not be automatically scheduled. You'll need to set up an external scheduler or manually run `SELECT maintain_connection_pool()` periodically.

2. **Permission issues**: If you encounter permission errors, make sure your database user has sufficient privileges.

3. **Materialized view refresh failures**: If you see errors about refreshing the materialized view, you can use the `connection_pool_history` table as an alternative. 