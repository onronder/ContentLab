"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, MailIcon } from "lucide-react";

// Define the view types for better type safety
type AuthView = "sign_in" | "sign_up" | "forgotten_password";

export default function LoginForm() {
  const pathname = usePathname();
  
  // Determine initial view based on the current path
  const getInitialView = useCallback((): AuthView => {
    if (pathname === "/signup") return "sign_up";
    if (pathname === "/reset-password") return "forgotten_password";
    return "sign_in";
  }, [pathname]);
  
  const [view, setView] = useState<AuthView>(getInitialView());
  const supabase = createClient();
  
  // Update view when pathname changes
  useEffect(() => {
    setView(getInitialView());
  }, [pathname, getInitialView]);
  
  // Map of view titles
  const viewTitles = {
    sign_in: "Sign in to your account",
    sign_up: "Create a new account",
    forgotten_password: "Reset your password",
  };
  
  // Map of view descriptions
  const viewDescriptions = {
    sign_in: "Enter your email and password to sign in to your account",
    sign_up: "Fill in your information to create a new account",
    forgotten_password: "Enter your email and we'll send you a reset link",
  };

  // Handle view change manually
  const handleViewChange = (newView: AuthView) => {
    setView(newView);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {view === "forgotten_password" ? (
            <MailIcon className="h-10 w-10 text-primary" />
          ) : (
            <LockIcon className="h-10 w-10 text-primary" />
          )}
        </div>
        <CardTitle>{viewTitles[view]}</CardTitle>
        <CardDescription>{viewDescriptions[view]}</CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'var(--primary)',
                  brandAccent: 'var(--primary-foreground)',
                },
              },
            },
            style: {
              button: {
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                fontWeight: '500',
              },
              anchor: {
                color: 'var(--primary)',
                fontWeight: '500',
              },
              input: {
                borderRadius: 'var(--radius)',
                fontSize: '14px',
              },
            },
          }}
          providers={["google", "github", "azure"]}
          view={view}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          showLinks={true}
          // @ts-expect-error - The Supabase Auth UI types are incorrect, this prop does exist
          onViewChange={(newView: AuthView) => handleViewChange(newView)}
        />
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-gray-500">
        Protected by Content Roadmap Tool &copy; {new Date().getFullYear()}
      </CardFooter>
    </Card>
  );
} 