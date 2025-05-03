# ContentCreate - Traffic Scaling System

This document outlines the traffic spike handling and auto-scaling capabilities implemented for the ContentCreate application.

## Overview

The traffic scaling system provides robust, distributed mechanisms to handle traffic spikes through:

1. Redis-based distributed caching and rate limiting
2. Circuit breaker pattern implementation
3. Geographic distribution of processing
4. Traffic prediction and auto-scaling

## Components

### 1. Redis Implementation (src/lib/redis.ts)

- Distributed caching with Upstash Redis
- Rate limiting using the sliding window algorithm
- Cache invalidation and management
- Health check monitoring

### 2. Circuit Breaker Pattern (src/lib/circuit-breaker.ts)

- Fault tolerance through circuit states: CLOSED, OPEN, HALF-OPEN
- Automatic recovery from failures
- State tracking and statistics
- Progressive recovery with controlled testing

### 3. Geographic Distribution (migrations/0012_geo_distribution.sql)

- Region-based worker distribution
- Load balancing across geographic regions
- Worker capacity management
- Intelligent job routing based on region load

### 4. Traffic Prediction (migrations/0013_traffic_prediction.sql)

- Time-series traffic data collection with TimescaleDB
- Pattern recognition for traffic prediction
- Historical pattern matching
- Confidence scoring for predictions

### 5. Auto-scaling Function (supabase/functions/auto-scaling/index.ts)

- Predictive scaling based on traffic patterns
- Region-specific scaling with cooldown periods
- Redis-based distributed locking for coordination
- Traffic prediction caching for performance

## Deployment 

The system is deployed across:

1. **Edge Functions**: Auto-scaling and worker functions
2. **Database**: Migrations for worker regions, traffic patterns, and auto-scaling history
3. **Redis**: Distributed coordination and caching
4. **API Layer**: Rate limiting and circuit breaker implementation

## Testing Tools

Two scripts are provided for testing:

1. **test-autoscaling.js**: Tests the auto-scaling function directly
2. **simulate-traffic.js**: Simulates traffic patterns across regions to trigger auto-scaling

## Configuration

Key environment variables (configured in .env):

```
# Redis Configuration
REDIS_URL=https://your-redis-instance.upstash.io
REDIS_TOKEN=your-redis-token-here

# Auto-scaling Configuration
REQUESTS_PER_WORKER=500
MIN_WORKERS_PER_REGION=1
MAX_WORKERS_PER_REGION=10
SCALING_COOLDOWN_SECONDS=300
```

## Monitoring

The system provides several monitoring views:

1. **region_status**: Worker distribution and health by region
2. **autoscaling_analytics**: Historical scaling actions and results
3. **traffic_metrics**: Real-time and historical traffic patterns

## Maintenance

To maintain the system:

1. Run migrations to create the necessary database structures
2. Deploy the auto-scaling and worker functions
3. Set up a scheduled CRON job (*/15 * * * *) to trigger auto-scaling
4. Monitor the system through the provided views

## Testing

To test the system:

1. Run `node simulate-traffic.js` to generate sample traffic data
2. Run `node test-autoscaling.js` to manually trigger the auto-scaling function
3. Check the database for scaling actions in the `autoscaling_history` table 