"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, MailIcon } from "lucide-react";

export default function LoginForm() {
  // Using useState but with _ for the setter since we're not using it
  const [view] = useState<"sign_in" | "sign_up" | "forgotten_password">("sign_in");
  const supabase = createClient();
  
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
          appearance={{ theme: ThemeSupa }}
          providers={["google", "github", "azure"]}
          view={view}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          showLinks={true}
        />
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-gray-500">
        Protected by Content Roadmap Tool &copy; {new Date().getFullYear()}
      </CardFooter>
    </Card>
  );
} 