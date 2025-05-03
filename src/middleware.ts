import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkRateLimit, RateLimitResult } from "./lib/rate-limiter";
import { getRateLimiter } from './lib/redis';

// In-memory store for rate limiting
// Note: This will reset on server restart, but works for basic protection
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Rate limit settings
const RATE_LIMIT = {
  // Higher limits for API endpoints that need more throughput
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: process.env.RATE_LIMIT_REQUESTS ? parseInt(process.env.RATE_LIMIT_REQUESTS) : 30,
  },
  // Lower limits for authentication endpoints to prevent brute force
  AUTH: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
  },
  // Very low limits for sensitive operations
  SENSITIVE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
  }
};

// Helper to apply rate limiting
function applyRateLimit(
  req: NextRequest, 
  limiterType: 'API' | 'AUTH' | 'SENSITIVE' = 'API'
): { limited: boolean; resetTime?: number } {
  // Get client identifier - prefer user ID if authenticated, fallback to IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
  const limiter = RATE_LIMIT[limiterType];
  const identifier = `${ip}:${limiterType}`;
  
  const now = Date.now();
  const rateData = rateLimitStore[identifier] || { count: 0, resetTime: now + limiter.windowMs };
  
  // Reset count if the time window has passed
  if (now > rateData.resetTime) {
    rateData.count = 0;
    rateData.resetTime = now + limiter.windowMs;
  }
  
  // Increment count and check if rate limited
  rateData.count += 1;
  rateLimitStore[identifier] = rateData;
  
  return {
    limited: rateData.count > limiter.max,
    resetTime: rateData.resetTime
  };
}

export async function middleware(request: NextRequest) {
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

// Only run middleware on matching routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    "/api/:path*", // Add API routes to matcher
    "/auth/:path*",
    "/admin/:path*",
    "/analyze",
  ],
}; 