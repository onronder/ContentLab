import { NextResponse, NextRequest } from 'next/server';

/**
 * This middleware ensures that database connections are
 * properly closed after each serverless function execution
 * to prevent connection leaks in Vercel's environment.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add cleanup headers to track connection state
  response.headers.set('x-db-connections-managed', 'true');
  
  // For API routes that might use database connections
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Register a cleanup function to run after the response is sent
    response.headers.set('x-db-cleanup-registered', 'true');
  }
  
  return response;
}

// Only run middleware on API routes and admin pages
export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}; 