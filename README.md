# Content Roadmap Tool

A tool for analyzing content against competitors to find gaps and popular themes.

## Features

### Authentication System
- Supabase Auth integration for secure user management
- Sign in, sign up, and password reset flows
- Support for social logins (Google, GitHub, Azure)
- Responsive authentication pages with consistent styling

### Dashboard Interface
- Personalized dashboard with user greeting
- Overview of content metrics and stats
- Activity feed showing recent actions
- Usage quota visualization
- Quick actions for common tasks
- Responsive sidebar navigation for dashboard sections

## Deployment on Vercel

This project is configured for easy deployment on Vercel with GitHub integration.

### Prerequisites

1. A [Supabase](https://supabase.com/) project with Edge Functions enabled
2. A [Vercel](https://vercel.com/) account connected to your GitHub repository

### Environment Variables

Set up the following environment variables in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

Optional:
- `RATE_LIMIT_REQUESTS` - Number of requests allowed in the window (default: 10)
- `RATE_LIMIT_WINDOW_SECONDS` - Time window for rate limiting in seconds (default: 60)
- `WORKER_WEBHOOK_SECRET` - Secret for worker webhook authentication
- `ADMIN_EMAIL` - Email for admin alerts
- `ALERT_WEBHOOK_URL` - URL for alert webhooks

### Deployment Steps

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure the environment variables
4. Deploy!

### Supabase Edge Functions

This project uses several Supabase Edge Functions:

- `analyze` - Main content analysis function
- `get-report` - Retrieves analysis results
- `worker` - Background processing worker
- `worker-heartbeat` - Worker health monitoring
- `worker-health-check` - System health monitoring
- `schedule-worker` - Scheduled worker invocation
- `data-management` - Data archiving and cleanup
- `cleanup-rate-limits` - Rate limit data cleanup
- `job-alerts` - System alerting
- `scheduled-alerts` - Scheduled system checks
- `scheduled-cleanup` - Scheduled data cleanup

Make sure all edge functions are deployed to Supabase using:

```bash
supabase functions deploy
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## UI Components

The project uses a comprehensive UI component library built with:

- Tailwind CSS for styling
- Shadcn UI components
- Responsive design principles
- Light and dark theme support

Main component categories:
- Authentication components
- Dashboard components
- Data visualization
- Form elements
- Navigation
- Feedback (toasts, alerts)

## License

[MIT](LICENSE)
