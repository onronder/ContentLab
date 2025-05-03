import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Create Redis client for distributed caching and rate limiting
let redis: Redis;
let rateLimiter: Record<string, Ratelimit>;

export function getRedisClient() {
  if (!redis) {
    redis = new Redis({
      url: process.env.REDIS_URL || '',
      token: process.env.REDIS_TOKEN || '',
    });
  }
  return redis;
}

/**
 * Get a rate limiter instance for a specific plan
 * @param planType - The plan type to get a rate limiter for
 * @returns RateLimiter instance
 */
export function getRateLimiter(planType: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom') {
  if (!rateLimiter) {
    rateLimiter = {};
  }

  if (!rateLimiter[planType]) {
    // Configure rate limits based on plan
    const limits = {
      free: { requests: 30, per: 60 },         // 30 req/min
      starter: { requests: 60, per: 60 },      // 60 req/min
      pro: { requests: 120, per: 60 },         // 120 req/min
      enterprise: { requests: 240, per: 60 },  // 240 req/min
      custom: { requests: 300, per: 60 },      // Custom rate limit
    };

    // Create the rate limiter using the Upstash sliding window algorithm
    rateLimiter[planType] = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(limits[planType].requests, `${limits[planType].per} s`),
      analytics: true,
      prefix: `ratelimit:${planType}`,
    });
  }

  return rateLimiter[planType];
}

/**
 * Set a value in Redis cache
 * @param key - Cache key
 * @param value - Value to store
 * @param expirySeconds - Expiry time in seconds
 */
export async function setCache<T>(key: string, value: T, expirySeconds: number): Promise<void> {
  const client = getRedisClient();
  await client.set(key, JSON.stringify(value), { ex: expirySeconds });
}

/**
 * Get a value from Redis cache
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  
  if (!data) {
    return null;
  }
  
  try {
    return JSON.parse(data as string) as T;
  } catch (err) {
    console.error('Error parsing cached data:', err);
    return null;
  }
}

/**
 * Delete a value from Redis cache
 * @param key - Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

/**
 * Clear cache by prefix
 * @param prefix - Prefix to clear
 */
export async function clearCacheByPrefix(prefix: string): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(`${prefix}*`);
  
  if (keys.length > 0) {
    // Use Promise.all to delete multiple keys if needed
    for (const key of keys) {
      await client.del(key);
    }
  }
}

/**
 * Record rate limit hit in Redis
 * @param key - Rate limit key (usually organization:endpoint)
 * @param timeWindowSeconds - Time window in seconds
 * @returns Current count and limit info
 */
export async function recordRateLimitHit(
  key: string,
  timeWindowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; limit: number; reset: number }> {
  const client = getRedisClient();
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / timeWindowSeconds)}`;
  
  // Increment counter for current window
  const count = await client.incr(windowKey);
  
  // Set expiry on first hit
  if (count === 1) {
    await client.expire(windowKey, timeWindowSeconds * 2); // 2x window size for safety
  }
  
  // Calculate reset time (end of current window)
  const resetTime = Math.ceil(now / timeWindowSeconds) * timeWindowSeconds;
  
  return {
    success: true,
    remaining: 0, // This will be calculated by the calling function based on plan
    limit: 0,     // This will be set by the calling function based on plan
    reset: resetTime
  };
}

/**
 * Checks distributed health of Redis connection
 * @returns Boolean indicating if Redis is healthy
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
} 