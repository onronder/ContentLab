import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
          async set(name, value, options) {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/", request.url));
} 