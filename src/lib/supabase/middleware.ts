import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

/**
 * Create a Supabase client for use in middleware
 */
export function createClient(request: NextRequest) {
  // Create a Cookies instance with the request and response
  const cookies = {
    get(name: string) {
      return request.cookies.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      request.cookies.set({
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
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
} 