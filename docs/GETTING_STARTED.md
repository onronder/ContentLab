# Getting Started with Content Roadmap Tool

This guide will help you set up and run the Content Roadmap Tool for development.

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase CLI installed
- Git

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/content-roadmap-tool.git
cd content-roadmap-tool
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Supabase

#### Install Supabase CLI (if not installed)

```bash
# Using Homebrew (macOS)
brew install supabase/tap/supabase

# Using npm
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

#### Link to Your Project

```bash
supabase link --project-ref <your-project-reference>
```

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run Database Migrations

```bash
supabase db push
```

### 6. Deploy Edge Functions

```bash
supabase functions deploy analyze --no-verify-jwt
supabase functions deploy get-report --no-verify-jwt
```

### 7. Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `/src` - Main application code
  - `/app` - Next.js app directory
  - `/components` - React components
  - `/lib` - Utility functions and libraries
  - `/hooks` - React hooks
- `/supabase` - Supabase-related code
  - `/functions` - Edge functions
  - `/migrations` - Database migrations
- `/docs` - Documentation
- `/public` - Static assets

## Development Workflow

### Making Changes to Edge Functions

1. Modify function code in `/supabase/functions/[function-name]/index.ts`
2. Deploy the function:
   ```bash
   supabase functions deploy [function-name] --no-verify-jwt
   ```

### Database Changes

1. Create a new migration:
   ```bash
   supabase migration new [migration-name]
   ```
2. Edit the generated SQL file in `/supabase/migrations/`
3. Apply the migration:
   ```bash
   supabase db push
   ```

### UI Development

1. Make changes to components in `/src/components/`
2. Create new pages in `/src/app/`
3. Use existing UI components from Shadcn UI

## Testing

### Running Tests

```bash
pnpm test
```

### Manual Testing

For testing the full analysis flow:
1. Sign up/log in
2. Enter your website URL (e.g., `https://yourblog.com`)
3. Add 1-5 competitor URLs
4. Click "Analyze Content"
5. Wait for the analysis to complete

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure your Supabase edge functions have proper CORS headers.
2. **Authentication issues**: Verify JWT settings in Supabase functions.
3. **Database connection errors**: Check that your PostgreSQL connection strings are correct.

### Getting Help

If you encounter issues:
1. Check the logs in the Supabase dashboard
2. Review the Next.js error logs in the console
3. Open an issue on GitHub

## Next Steps

Once you're up and running, check out the [TODO.md](./TODO.md) for development tasks and the [ARCHITECTURE.md](./ARCHITECTURE.md) for system design documentation. 