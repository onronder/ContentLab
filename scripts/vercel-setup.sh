#!/bin/bash

# Script to help with Vercel deployment setup
echo "Vercel Deployment Setup Helper"
echo "=============================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Create necessary directories
mkdir -p .vercel/output

# Initialize Vercel if not already done
if [ ! -f .vercel/project.json ]; then
    echo "Initializing Vercel project..."
    vercel link
fi

# Set up environment variables
echo "Setting up environment variables..."
echo ""
echo "Please provide your Supabase URL (e.g., https://YOUR_PROJECT_ID.supabase.co):"
read supabase_url
vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Please provide your Supabase Anon Key:"
read supabase_anon_key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Optional environment variables
echo ""
echo "Would you like to set up optional environment variables? (y/n)"
read setup_optional

if [ "$setup_optional" = "y" ]; then
    echo "Setting up rate limiting variables..."
    echo "Rate limit requests (default 10):"
    read rate_limit_requests
    vercel env add RATE_LIMIT_REQUESTS production
    
    echo "Rate limit window in seconds (default 60):"
    read rate_limit_window
    vercel env add RATE_LIMIT_WINDOW_SECONDS production
    
    echo "Worker webhook secret (for worker authentication):"
    read webhook_secret
    vercel env add WORKER_WEBHOOK_SECRET production
    
    echo "Admin email (for alerts):"
    read admin_email
    vercel env add ADMIN_EMAIL production
    
    echo "Alert webhook URL (optional):"
    read alert_webhook
    vercel env add ALERT_WEBHOOK_URL production
fi

echo ""
echo "Setup complete! Next steps:"
echo "1. Push your code to GitHub"
echo "2. Import your repository in Vercel"
echo "3. Deploy!"
echo ""
echo "You can deploy manually with: vercel --prod" 