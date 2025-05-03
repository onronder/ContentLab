"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockIcon, MailIcon } from "lucide-react";

export default function LoginForm() {
  const [view, setView] = useState<"sign_in" | "sign_up" | "forgotten_password">("sign_in");
  const supabase = createClient();
  
  // Define appearance for Supabase Auth UI
  const appearance = {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: 'hsl(221.2 83.2% 53.3%)',
          brandAccent: 'hsl(221.2 83.2% 43.3%)',
        },
        borderWidths: {
          input: '1px',
        },
        borderRadius: {
          input: '0.5rem',
          button: '0.5rem',
        },
      },
    },
    className: {
      button: 'w-full py-2 rounded-md text-white',
      input: 'rounded-md border border-gray-300 px-4 py-2 mb-2',
      label: 'text-sm font-medium text-gray-700 mb-1',
      anchor: 'text-sm text-blue-600 hover:text-blue-800',
    },
  };
  
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
          appearance={appearance}
          providers={["google", "github", "azure"]}
          view={view}
          redirectTo={`${window.location.origin}/auth/callback`}
          showLinks={true}
          onViewChange={(newView) => setView(newView as any)}
        />
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-gray-500">
        Protected by Content Roadmap Tool &copy; {new Date().getFullYear()}
      </CardFooter>
    </Card>
  );
} 