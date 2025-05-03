import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  getConnectionPoolStats, 
  getConnectionPoolHistory, 
  resetConnectionPool,
  configureConnectionPool,
  checkDatabaseExtensions
} from '@/app/api/db-config';

// Define cookie option type
interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * GET handler - retrieve connection pool status and metrics
 */
export async function GET(request: NextRequest) {
  // Create server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if user has admin role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .contains('role', ['admin', 'super_admin']);
  
  const isAdmin = userRoles && userRoles.length > 0;
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }
  
  // Check for hours parameter
  const url = new URL(request.url);
  const hours = url.searchParams.get('hours');
  const historyHours = hours ? parseInt(hours) : 24;
  
  // Get current pool stats and history
  const currentStats = await getConnectionPoolStats();
  const history = await getConnectionPoolHistory(historyHours);
  
  // Check database extensions
  const extensions = await checkDatabaseExtensions();
  
  return NextResponse.json({
    current: currentStats,
    history: history,
    extensions: extensions,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST handler - perform connection pool actions
 */
export async function POST(request: NextRequest) {
  // Create server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if user has admin role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .contains('role', ['admin', 'super_admin']);
  
  const isAdmin = userRoles && userRoles.length > 0;
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }
  
  // Get request body for action
  try {
    const body = await request.json() as { action: string };
    const { action } = body;
    
    if (action === 'reset') {
      const result = await resetConnectionPool();
      return NextResponse.json(result);
    } else if (action === 'configure') {
      const result = await configureConnectionPool();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: reset, configure' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 