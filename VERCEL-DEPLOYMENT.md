# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Content Roadmap Tool to Vercel. Follow these instructions carefully to ensure a successful deployment.

## Prerequisites

- A Vercel account (https://vercel.com)
- Git repository with your code (GitHub, GitLab, or Bitbucket)
- Supabase account with a project set up
- Upstash Redis account (optional, but recommended for production)

## Step 1: Prepare Your Project for Deployment

1. Ensure your code is properly committed to your Git repository.
2. Make sure `vercel.json` is correctly configured (included in this project).
3. Check that your project's dependencies are all listed in `package.json`.

## Step 2: Set Up Environment Variables

Before deploying, you need to gather all required environment variables:

### Required Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Environment Variables (Recommended for Production):

- `REDIS_URL`: Your Upstash Redis URL
- `REDIS_TOKEN`: Your Upstash Redis token
- `RATE_LIMIT_REQUESTS`: Number of requests allowed per window (default: 10)
- `RATE_LIMIT_WINDOW_SECONDS`: Rate limit window in seconds (default: 60)
- `REQUESTS_PER_WORKER`: Number of requests a worker can handle (default: 500)
- `MIN_WORKERS_PER_REGION`: Minimum number of workers per region (default: 1)
- `MAX_WORKERS_PER_REGION`: Maximum number of workers per region (default: 10)
- `SCALING_COOLDOWN_SECONDS`: Time between scaling events (default: 300)
- `WORKER_WEBHOOK_SECRET`: Secret for worker webhook authentication
- `ADMIN_EMAIL`: Admin email for alerts and notifications
- `ALERT_WEBHOOK_URL`: Webhook URL for sending alerts (Slack, etc.)

## Step 3: Deploy to Vercel

### Option 1: Using the Vercel Dashboard (Recommended for First Deployment)

1. Log in to your Vercel account.
2. Click on "New Project".
3. Import your Git repository.
4. Configure the project with the following settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npx pnpm install --no-frozen-lockfile && npx pnpm build`
   - **Output Directory**: `.next`
   - **Environment Variables**: Add all the variables from Step 2

5. Click "Deploy".

### Option 2: Using Vercel CLI

1. Install Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Run our setup helper script:
   ```bash
   node scripts/setup-vercel-env.js
   ```

3. Configure Vercel CLI:
   ```bash
   vercel login
   ```

4. Link your project:
   ```bash
   vercel link
   ```

5. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Add other environment variables as needed
   ```

6. Deploy the project:
   ```bash
   vercel --prod
   ```

## Step 4: Verify the Deployment

1. Once deployed, verify that your application is working correctly.
2. Check the Vercel deployment logs for any errors.
3. Test the core functionality of your application.

## Troubleshooting Common Issues

### Build Fails with pnpm Errors

If you encounter pnpm-related errors during build:

1. Make sure `pnpm-workspace.yaml` exists in your project.
2. Use our updated build command: `npx pnpm install --no-frozen-lockfile && npx pnpm build`

### Environment Variable Issues

If your app deploys but doesn't function correctly:

1. Check the Vercel dashboard to ensure all environment variables are set.
2. Verify that there are no typos in environment variable names.
3. Make sure you've set the environment variables in the production environment.

### Redis Connection Issues

If you're encountering Redis-related errors:

1. Verify that your Upstash Redis URL and token are correct.
2. Check that your Redis instance is accessible from Vercel's servers.
3. The application is designed to use a fallback implementation if Redis is unavailable.

### Cron Job Issues

If the autoscaling cron job isn't working:

1. Verify that your Vercel plan supports Cron Jobs (requires a Pro or Enterprise plan).
2. Check that the path in `vercel.json` matches the actual file path in your project.

## Monitoring and Maintenance

- Monitor your Vercel deployment using Vercel Analytics.
- Set up alerts for deployment failures.
- Regularly update your dependencies to ensure security and performance.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.io/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis) 