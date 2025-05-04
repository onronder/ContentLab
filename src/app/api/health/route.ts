import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/redis';
import poolManager from '@/lib/db/pool-manager';
import { CircuitBreaker } from '@/lib/circuit-breaker';

// Environment information
const environment = process.env.NODE_ENV || 'development';
const region = process.env.VERCEL_REGION || 'local';
const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

/**
 * Health check API endpoint
 * Used by load balancers and monitoring tools
 * Provides status of database, Redis, and other dependencies
 */
export async function GET() {
  const startTime = Date.now();
  const healthStatus: {
    status: string;
    region: string;
    environment: string;
    version: string;
    timestamp: string;
    dependencies: {
      redis: boolean;
      database: {
        primary: boolean;
        replica: boolean;
      };
      circuits: Record<string, { 
        state: string; 
        failures?: number;
        error?: string;
      }>;
    };
    uptime: number;
    responseTime: number;
    error?: string;
  } = { 
    status: 'healthy',
    region,
    environment,
    version,
    timestamp: new Date().toISOString(),
    dependencies: {
      redis: false,
      database: {
        primary: false,
        replica: false
      },
      circuits: {}
    },
    uptime: process.uptime(),
    responseTime: 0
  };
  
  try {
    // Check Redis health
    const redisHealthy = await checkRedisHealth();
    healthStatus.dependencies.redis = redisHealthy;
    
    // Check database health (both primary and replica)
    const dbStatus = poolManager.getStatus();
    healthStatus.dependencies.database = {
      primary: dbStatus.pools.primary && dbStatus.isHealthy,
      replica: dbStatus.pools.readReplica
    };
    
    // Check circuit breaker status for critical services
    const circuitNames = ['api', 'auth', 'storage'];
    for (const name of circuitNames) {
      try {
        const circuit = new CircuitBreaker({ key: name });
        const stats = await circuit.getStats();
        healthStatus.dependencies.circuits[name] = {
          state: stats.state,
          failures: stats.failures
        };
      } catch (error) {
        healthStatus.dependencies.circuits[name] = { 
          state: 'unknown', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    // Determine overall health
    const isRedisHealthy = healthStatus.dependencies.redis;
    const isDatabaseHealthy = healthStatus.dependencies.database.primary;
    
    if (!isRedisHealthy || !isDatabaseHealthy) {
      healthStatus.status = 'degraded';
    }
    
    // Check for circuit breaker open states
    const hasOpenCircuits = Object.values(healthStatus.dependencies.circuits).some(
      circuit => typeof circuit === 'object' && 'state' in circuit && circuit.state === 'open'
    );
    
    if (hasOpenCircuits) {
      healthStatus.status = 'degraded';
    }
    
  } catch (error) {
    // Something went very wrong
    healthStatus.status = 'unhealthy';
    healthStatus.error = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    // Calculate response time
    healthStatus.responseTime = Date.now() - startTime;
  }
  
  // Return 200 for healthy/degraded, 503 for unhealthy
  const status = healthStatus.status === 'unhealthy' ? 503 : 200;
  
  return NextResponse.json(healthStatus, { 
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Region': region
    }
  });
}

/**
 * HEAD request for lightweight health checks
 * Returns 200 if the service is running at all, useful for basic load balancer checks
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Region': region
    }
  });
} 