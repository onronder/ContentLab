import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkRateLimit } from "./lib/rate-limiter";
import { getRateLimiter } from './lib/redis';
import { createClient } from '@/lib/supabase/middleware';
import { recordRateLimitHit } from '@/lib/redis';

// Define constants
const API_ROUTES = /^\/api\//i;
const EXCLUDED_ROUTES = /^\/api\/(health|_next|static)\//i;

// Get current region
function getRegion(): string {
  // Default to IAD1 if not running in Vercel
  if (!process.env.VERCEL_REGION) {
    return 'iad1';
  }
  return process.env.VERCEL_REGION;
}

export async function middleware(request: NextRequest) {
  const requestStart = Date.now();
  const region = getRegion();
  
  // Skip tracking for certain routes
  if (EXCLUDED_ROUTES.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Create response
  const response = NextResponse.next();
  
  // Initialize Supabase client
  const supabase = createClient(request);
  
  try {
    // Only track metrics for API routes to avoid excessive logging
    if (API_ROUTES.test(request.nextUrl.pathname)) {
      // Asynchronously record traffic
      recordTraffic(supabase, request, region, requestStart).catch(err => {
        console.error('Failed to record traffic:', err);
      });
    }
    
    // For all routes, add region information to response headers
    response.headers.set('x-vercel-region', region);
    
  } catch (error) {
    console.error('Middleware error:', error);
  }
  
  return response;
}

// Routes to apply this middleware to
export const config = {
  matcher: [
    // Apply to all routes except for static assets
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)',
  ],
};

// Function to record traffic asynchronously without blocking the response
async function recordTraffic(
  supabase: any,
  request: NextRequest,
  region: string,
  requestStart: number
) {
  try {
    // Calculate response time
    const responseTime = Date.now() - requestStart;
    
    // Record metrics in database
    await supabase.from('traffic_metrics').insert({
      region,
      request_count: 1,
      error_count: 0, // Will be updated by error handlers if needed
      average_response_time: responseTime,
      p95_response_time: responseTime // Will be aggregated in analytics view
    });
    
    // Record in Redis for real-time rate limiting (non-blocking)
    const organizationId = request.headers.get('x-organization-id') || 'anonymous';
    const path = request.nextUrl.pathname;
    
    recordRateLimitHit(`${region}:${organizationId}:${path}`).catch(err => {
      console.error('Redis rate limit recording failed:', err);
    });
    
  } catch (error) {
    console.error('Error recording traffic:', error);
  }
}

let response = NextResponse.next({
  request: {
    headers: request.headers,
  },
});

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  }
);

// Refresh the session if it exists
const { data } = await supabase.auth.getSession();

// Protected routes that require authentication
const protectedRoutes = [
  "/admin",
  "/data-management",
  "/jobs",
  "/reports",
];

// API routes that need rate limiting
const apiRoutes = [
  "/api/analyze",
  "/api/reports",
  "/api/jobs",
  "/api/data",
];

// Check if the route is protected and if the user is authenticated
const isProtectedRoute = protectedRoutes.some(route => 
  request.nextUrl.pathname.startsWith(route)
);

// Check if route is an API route that needs rate limiting
const isApiRoute = apiRoutes.some(route => 
  request.nextUrl.pathname.startsWith(route)
);

if (isProtectedRoute && !data.session) {
  // Redirect to login page if user is not authenticated
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

// Apply rate limiting for API routes
if (isApiRoute) {
  // Get identification info for rate limiting
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";
  let userId = "anonymous";
  let organizationId = null;
  
  // If user is authenticated, use their ID and organization
  if (data.session) {
    userId = data.session.user.id;
    
    // Get organization ID from request header or user profile
    organizationId = request.headers.get("x-organization-id");
    
    if (!organizationId) {
      // If organization ID is not in headers, fetch it from user's organization membership
      const { data: orgData } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .single();
      
      organizationId = orgData?.organization_id;
    }
  }
  
  // Apply different rate limiting based on auth status
  if (organizationId) {
    // Authenticated user with organization - use database rate limits
    const rateLimitResult = await checkRateLimit(
      organizationId,
      userId,
      request.nextUrl.pathname
    );
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.reset.getTime() / 1000).toString());
    
    // Return 429 if rate limited
    if (rateLimitResult.exceeded) {
      response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString());
      return new NextResponse(JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
      }), {
        status: 429,
        headers: response.headers
      });
    }
  } else {
    // Anonymous user - use IP-based rate limiting with the free tier limits
    const freePlanLimiter = getRateLimiter('free');
    const rateLimitKey = `ip:${clientIp}:${request.nextUrl.pathname}`;
    
    const { success, limit, remaining, reset } = await freePlanLimiter.limit(rateLimitKey);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.floor(reset / 1000).toString());
    
    // Return 429 if rate limited
    if (!success) {
      const resetTime = new Date(reset);
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      
      response.headers.set('Retry-After', retryAfter.toString());
      return new NextResponse(JSON.stringify({
        error: 'Too Many Requests',
        message: 'Anonymous rate limit exceeded. Please try again later or sign in.',
        retryAfter
      }), {
        status: 429,
        headers: response.headers
      });
    }
  }
}

// Skip rate limiting for static assets and health checks
if (
  request.nextUrl.pathname.startsWith('/_next') || 
  request.nextUrl.pathname.startsWith('/static') ||
  request.nextUrl.pathname.startsWith('/images') ||
  request.nextUrl.pathname.startsWith('/api/health')
) {
  return response;
}

return response;
} 