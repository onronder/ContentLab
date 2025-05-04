#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Helper
 * 
 * This script helps list and validate all required environment variables
 * for a successful Vercel deployment.
 */

console.log("Content Roadmap Tool - Vercel Environment Variables Checklist");
console.log("===========================================================");
console.log("");
console.log("Run this script before deploying to Vercel to ensure all required");
console.log("environment variables are set up correctly.");
console.log("");

const requiredVariables = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Your Supabase project URL",
    example: "https://kmhyyczlvnlyndeffybg.supabase.co",
    required: true,
    default: "https://kmhyyczlvnlyndeffybg.supabase.co"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Your Supabase anonymous/public key",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    required: true
  },
  {
    name: "REDIS_URL",
    description: "Upstash Redis URL for caching and rate limiting",
    example: "https://skilled-deer-13580.upstash.io",
    required: true,
    default: "https://skilled-deer-13580.upstash.io"
  },
  {
    name: "REDIS_TOKEN",
    description: "Upstash Redis auth token",
    example: "AYJASd78asd78==",
    required: true
  },
  {
    name: "DB_POOL_MAX",
    description: "Maximum number of connections in the database pool",
    example: "20",
    required: false,
    default: "20"
  },
  {
    name: "DB_POOL_MIN",
    description: "Minimum number of connections in the database pool",
    example: "5",
    required: false,
    default: "5"
  },
  {
    name: "DB_POOL_IDLE_TIMEOUT",
    description: "Idle timeout for database connections in milliseconds",
    example: "30000",
    required: false,
    default: "30000"
  },
  {
    name: "DB_POOL_CONNECTION_TIMEOUT",
    description: "Connection timeout for database in milliseconds",
    example: "5000",
    required: false,
    default: "5000"
  },
  {
    name: "ANALYSIS_MAX_URLS",
    description: "Maximum number of URLs to analyze",
    example: "10",
    required: false,
    default: "10"
  },
  {
    name: "ANALYSIS_THROTTLE_MS",
    description: "Throttle rate for analysis in milliseconds",
    example: "1000",
    required: false,
    default: "1000"
  },
  {
    name: "RATE_LIMIT_REQUESTS",
    description: "Number of requests allowed per window",
    example: "30",
    required: false,
    default: "30"
  },
  {
    name: "RATE_LIMIT_WINDOW_SECONDS",
    description: "Rate limit window in seconds",
    example: "60",
    required: false,
    default: "60"
  },
  {
    name: "REQUESTS_PER_WORKER",
    description: "Number of requests a worker can handle",
    example: "500",
    required: false,
    default: "500"
  },
  {
    name: "MIN_WORKERS_PER_REGION",
    description: "Minimum number of workers per region",
    example: "1",
    required: false,
    default: "1"
  },
  {
    name: "MAX_WORKERS_PER_REGION",
    description: "Maximum number of workers per region",
    example: "10",
    required: false,
    default: "10"
  },
  {
    name: "SCALING_COOLDOWN_SECONDS",
    description: "Time between scaling events",
    example: "300",
    required: false,
    default: "300"
  },
  {
    name: "CACHE_TTL_SHORT",
    description: "Short cache TTL in seconds",
    example: "60",
    required: false,
    default: "60"
  },
  {
    name: "CACHE_TTL_MEDIUM",
    description: "Medium cache TTL in seconds",
    example: "300",
    required: false,
    default: "300"
  },
  {
    name: "CACHE_TTL_LONG",
    description: "Long cache TTL in seconds",
    example: "1800",
    required: false,
    default: "1800"
  },
  {
    name: "CACHE_TTL_VERY_LONG",
    description: "Very long cache TTL in seconds",
    example: "3600",
    required: false,
    default: "3600"
  },
  {
    name: "WORKER_WEBHOOK_SECRET",
    description: "Secret for worker webhook authentication",
    example: "your-secure-secret-here",
    required: false
  },
  {
    name: "ADMIN_EMAIL",
    description: "Admin email for alerts and notifications",
    example: "admin@example.com",
    required: false
  },
  {
    name: "ALERT_WEBHOOK_URL",
    description: "Webhook URL for sending alerts (Slack, etc.)",
    example: "https://hooks.slack.com/services/xxx/yyy/zzz",
    required: false
  },
  {
    name: "ENABLE_CONTENT_RECOMMENDATIONS",
    description: "Enable content recommendations feature",
    example: "false",
    required: false,
    default: "false"
  },
  {
    name: "ENABLE_CUSTOM_REPORTING",
    description: "Enable custom reporting feature",
    example: "false",
    required: false,
    default: "false"
  }
];

// Print out a table of all variables
console.log("Required Environment Variables:");
console.log("-------------------------------");
requiredVariables
  .filter(v => v.required)
  .forEach(variable => {
    console.log(`${variable.name}`);
    console.log(`  Description: ${variable.description}`);
    console.log(`  Example: ${variable.example}`);
    if (variable.default) {
      console.log(`  Default: ${variable.default}`);
    }
    console.log("");
  });

console.log("Optional Environment Variables:");
console.log("-------------------------------");
requiredVariables
  .filter(v => !v.required)
  .forEach(variable => {
    console.log(`${variable.name}`);
    console.log(`  Description: ${variable.description}`);
    console.log(`  Example: ${variable.example}`);
    if (variable.default) {
      console.log(`  Default: ${variable.default}`);
    }
    console.log("");
  });

console.log("Using Vercel CLI to set environment variables:");
console.log("--------------------------------------------");
console.log("You can use the Vercel CLI to set these variables with the following commands:");
console.log("");

requiredVariables.forEach(variable => {
  console.log(`vercel env add ${variable.name}`);
});

console.log("");
console.log("Or you can set them in the Vercel dashboard under your project's Settings > Environment Variables section.");
console.log("");

// Add instructions for setting up Upstash
console.log("Setting up Upstash Redis:");
console.log("------------------------");
console.log("1. Create an account at https://upstash.com/");
console.log("2. Create a new Redis database");
console.log("3. Go to the 'REST API' section to get your REDIS_URL and REDIS_TOKEN");
console.log("4. Add these to your Vercel environment variables");
console.log("");

// Add Vercel deployment instructions
console.log("Deploying to Vercel:");
console.log("-------------------");
console.log("1. Push your code to GitHub/GitLab/Bitbucket");
console.log("2. Import your repository in the Vercel dashboard");
console.log("3. Configure the build settings:");
console.log("   - Framework Preset: Next.js");
console.log("   - Build Command: npx pnpm install --no-frozen-lockfile && npx pnpm build");
console.log("   - Output Directory: .next");
console.log("4. Set all the environment variables listed above");
console.log("5. Deploy your application");
console.log("");

console.log("For more detailed instructions, refer to the documentation."); 