import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Create Redis client for distributed caching and rate limiting
let redis: Redis | null = null;
let rateLimiter: Record<string, Ratelimit> = {};
let redisEnabled = false;

// Create a minimal interface that matches the Redis methods we actually use
interface MinimalRedisClient {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options?: { ex?: number, nx?: boolean }): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  ping(): Promise<string>;
}

/**
 * Checks if Redis is configured with required environment variables
 */
function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL && process.env.REDIS_TOKEN);
}

/**
 * Gets the Redis client, or returns a fallback implementation if Redis is not configured
 */
export function getRedisClient(): Redis {
  // Initialize the redisEnabled flag once
  if (redis === null) {
    redisEnabled = isRedisConfigured();
    
    if (redisEnabled) {
      // Create real Redis client if configured
      try {
        redis = new Redis({
          url: process.env.REDIS_URL || '',
          token: process.env.REDIS_TOKEN || '',
        });
        console.log("Redis client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Redis client:", error);
        redisEnabled = false;
        redis = createFallbackRedis() as unknown as Redis;
      }
    } else {
      console.warn("Redis is not configured. Using in-memory fallback implementation.");
      redis = createFallbackRedis() as unknown as Redis;
    }
  }
  
  return redis;
}

/**
 * Creates a fallback implementation when Redis is not available
 * This prevents the application from crashing but won't be distributed
 */
function createFallbackRedis(): MinimalRedisClient {
  // Simple in-memory store
  const store: Record<string, { value: unknown, expiry: number | null }> = {};
  
  // Return a minimal implementation of the Redis interface
  return {
    get: async (key: string) => {
      const item = store[key];
      if (!item) return null;
      
      // Check if expired
      if (item.expiry && item.expiry < Date.now()) {
        delete store[key];
        return null;
      }
      
      return item.value;
    },
    set: async (key: string, value: unknown, options?: { ex?: number, nx?: boolean }) => {
      // Check if key exists and nx option is true
      if (options?.nx && store[key]) {
        return null;
      }
      
      const expiry = options?.ex ? Date.now() + (options.ex * 1000) : null;
      store[key] = { value, expiry };
      return 'OK';
    },
    incr: async (key: string) => {
      const current = store[key]?.value || 0;
      const newValue = typeof current === 'number' ? current + 1 : 1;
      store[key] = { value: newValue, expiry: store[key]?.expiry || null };
      return newValue;
    },
    expire: async (key: string, seconds: number) => {
      if (!store[key]) return 0;
      store[key].expiry = Date.now() + (seconds * 1000);
      return 1;
    },
    del: async (key: string) => {
      if (!store[key]) return 0;
      delete store[key];
      return 1;
    },
    keys: async (pattern: string) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Object.keys(store).filter(key => regex.test(key));
    },
    ping: async () => 'PONG'
  };
}

/**
 * Get a rate limiter instance for a specific plan
 * @param planType - The plan type to get a rate limiter for
 * @returns RateLimiter instance
 */
export function getRateLimiter(planType: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom') {
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
    try {
      rateLimiter[planType] = new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(limits[planType].requests, `${limits[planType].per} s`),
        analytics: redisEnabled, // Only enable analytics if real Redis is used
        prefix: `ratelimit:${planType}`,
      });
    } catch (error) {
      console.error(`Failed to create rate limiter for ${planType}:`, error);
      // Return a dummy rate limiter that always allows requests
      rateLimiter[planType] = {
        limit: async () => ({ success: true, remaining: 1000, limit: 1000, reset: Date.now() + 60000 })
      } as any;
    }
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
  if (!redisEnabled) {
    console.warn("Redis health check: Redis is not configured");
    return false;
  }
  
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
} 