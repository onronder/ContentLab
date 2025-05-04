import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Redis client for distributed rate limiting
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

// Cache for rate limit configurations to avoid excessive DB queries
const rateLimitConfigCache = new Map<string, {
  config: any;
  expiresAt: number;
}>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get rate limit configuration for an endpoint
 */
async function getRateLimitConfig(endpoint: string): Promise<any> {
  // Check cache first
  const cachedConfig = rateLimitConfigCache.get(endpoint);
  if (cachedConfig && cachedConfig.expiresAt > Date.now()) {
    return cachedConfig.config;
  }

  // Query the database for the current rate limit
  const { data, error } = await supabase
    .from('current_rate_limits')
    .select('*')
    .eq('endpoint', endpoint)
    .single();

  if (error) {
    console.error(`Error fetching rate limit config for ${endpoint}:`, error);
    // Return default values if error
    return {
      effective_limit: 60,
      burst_capacity: 10,
      cooldown_seconds: 60,
      adaptive_enabled: false
    };
  }

  // Store in cache
  rateLimitConfigCache.set(endpoint, {
    config: data,
    expiresAt: Date.now() + CACHE_TTL
  });

  return data;
}

/**
 * Check user tier and get appropriate multiplier
 */
async function getUserTierMultiplier(
  userId: string | undefined,
  tierMultipliers: any
): Promise<number> {
  if (!userId) return 1; // Default multiplier for unauthenticated users

  try {
    // Get user tier from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('tier')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      console.error('Error fetching user tier:', error);
      return 1;
    }

    // Get multiplier for this tier or default to 1
    const tier = userData.tier || 'free';
    return parseFloat(tierMultipliers?.[tier] || 1);
  } catch (error) {
    console.error('Error in getUserTierMultiplier:', error);
    return 1;
  }
}

/**
 * Record a rate limit event
 */
async function recordRateLimitEvent(
  endpoint: string,
  userId: string | undefined,
  clientIp: string | undefined,
  retryAfterSeconds: number,
  requestCount?: number
): Promise<void> {
  try {
    await supabase.rpc('record_rate_limit_event', {
      p_endpoint: endpoint,
      p_user_id: userId,
      p_client_ip: clientIp,
      p_retry_after_seconds: retryAfterSeconds,
      p_request_count: requestCount
    });
  } catch (error) {
    console.error('Error recording rate limit event:', error);
  }
}

/**
 * Record a request for traffic analysis
 */
async function registerRequest(
  endpoint: string,
  userId: string | undefined,
  clientIp: string | undefined,
  responseTimeMs: number | undefined,
  success: boolean
): Promise<void> {
  try {
    await supabase.rpc('register_request', {
      p_endpoint: endpoint,
      p_user_id: userId,
      p_client_ip: clientIp,
      p_response_time_ms: responseTimeMs,
      p_success: success
    });
  } catch (error) {
    console.error('Error registering request:', error);
  }
}

/**
 * Check if a request should be rate limited using Redis as a distributed counter
 */
async function shouldRateLimit(
  endpoint: string,
  userId: string | undefined,
  clientIp: string | undefined,
  config: any
): Promise<{ isLimited: boolean; retryAfter: number }> {
  try {
    // Get user-specific limit based on their tier
    const tierMultiplier = await getUserTierMultiplier(userId, config.user_tier_multipliers);
    const requestsPerMinute = Math.max(1, Math.floor(config.effective_limit * tierMultiplier));
    const burstCapacity = Math.max(1, Math.floor(config.burst_capacity * tierMultiplier));
    const cooldownSeconds = config.cooldown_seconds || 60;

    // Create a consistent identifier (prefer user_id, fall back to IP)
    const identifier = userId || clientIp || 'anonymous';
    
    // Redis key for this endpoint and user
    const key = `ratelimit:${endpoint}:${identifier}`;
    
    // Get current count from Redis
    const currentCount = await redis.get(key) as number | null;
    const count = currentCount ? parseInt(currentCount.toString()) : 0;
    
    // Get TTL for the key
    const ttl = await redis.ttl(key);
    
    // If this is the first request in this window, set expiry
    if (count === 0 || ttl <= 0) {
      await redis.setex(key, cooldownSeconds, 1);
      return { isLimited: false, retryAfter: 0 };
    }
    
    // Check if the request exceeds the limit
    const isLimited = count >= (requestsPerMinute + burstCapacity);
    
    if (!isLimited) {
      // Increment the counter
      await redis.incr(key);
    } else {
      // Record the rate limit event
      await recordRateLimitEvent(endpoint, userId, clientIp, cooldownSeconds, count);
    }
    
    return {
      isLimited,
      retryAfter: ttl > 0 ? ttl : cooldownSeconds
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    
    // Fallback to database check if Redis is unavailable
    try {
      const { data, error: dbError } = await supabase.rpc('should_rate_limit', {
        p_endpoint: endpoint,
        p_user_id: userId,
        p_client_ip: clientIp
      });
      
      if (dbError) {
        console.error('Error using DB fallback for rate limiting:', dbError);
        return { isLimited: false, retryAfter: 0 }; // Allow request on error
      }
      
      return {
        isLimited: data.is_limited,
        retryAfter: data.retry_after_seconds
      };
    } catch (fallbackError) {
      console.error('Error in rate limit fallback:', fallbackError);
      return { isLimited: false, retryAfter: 0 }; // Allow request on error
    }
  }
}

/**
 * Extract endpoint path from request URL
 */
function getEndpoint(url: string): string {
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split('/');
  
  // Handle specific routes to match rate limit config
  if (pathParts.length >= 2 && pathParts[1] === 'api') {
    // For API routes, use format 'api/{route}'
    if (pathParts.length >= 3) {
      return `api/${pathParts[2]}`;
    }
    return 'api';
  }
  
  // Default to full path
  return parsedUrl.pathname;
}

/**
 * Extract user ID from request
 */
async function getUserId(req: NextRequest): Promise<string | undefined> {
  // Get JWT token from cookie
  const token = req.cookies.get('sb-access-token')?.value;
  
  if (!token) return undefined;
  
  try {
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return undefined;
    }
    
    return data.user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return undefined;
  }
}

/**
 * Extract client IP from request
 */
function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         req.headers.get('x-real-ip') ||
         '127.0.0.1';
}

/**
 * Middleware to implement rate limiting
 */
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const url = req.nextUrl.clone();
  const endpoint = getEndpoint(url.toString());
  
  // Skip rate limiting for non-API routes
  if (!endpoint.startsWith('api/')) {
    return NextResponse.next();
  }
  
  // Get rate limit configuration
  const config = await getRateLimitConfig(endpoint);
  
  // Extract user information
  const userId = await getUserId(req);
  const clientIp = getClientIp(req);
  
  // Check if the request should be rate limited
  const { isLimited, retryAfter } = await shouldRateLimit(endpoint, userId, clientIp, config);
  
  if (isLimited) {
    // Return rate limit response
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests, please try again later.',
        retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        }
      }
    );
  }
  
  // Allow the request to proceed
  const response = NextResponse.next();
  
  // Register the request for traffic analysis (after the request is handled)
  const responseTime = Date.now() - startTime;
  registerRequest(endpoint, userId, clientIp, responseTime, true)
    .catch(error => console.error('Error registering request:', error));
  
  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/api/:path*', // Apply to all API routes
  ],
};

/**
 * Create a middleware function that logs requests and applies rate limiting
 */
export default async function middleware(req: NextRequest) {
  return rateLimitMiddleware(req);
} 