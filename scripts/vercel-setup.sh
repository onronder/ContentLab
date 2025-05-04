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

# Function to collect and set an environment variable
setup_env_var() {
    local var_name=$1
    local description=$2
    local default_value=$3
    local value

    echo ""
    echo "$description ($var_name):"
    if [ -n "$default_value" ]; then
        echo -n "[$default_value]: "
    fi
    read value

    # Use default if no value provided
    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value=$default_value
    fi

    # Only set if a value was provided
    if [ -n "$value" ]; then
        vercel env add $var_name production <<< "$value"
        echo "✅ Set $var_name"
    else
        echo "⚠️ Skipped $var_name (no value provided)"
    fi
}

echo "Setting up essential environment variables..."

# Supabase variables
setup_env_var "NEXT_PUBLIC_SUPABASE_URL" "Please provide your Supabase URL" "https://kmhyyczlvnlyndeffybg.supabase.co"
setup_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Please provide your Supabase Anon Key"

# Redis/Upstash
echo ""
echo "Would you like to set up Redis/Upstash for caching and rate limiting? (y/n)"
read setup_redis

if [ "$setup_redis" = "y" ]; then
    setup_env_var "REDIS_URL" "Please provide your Upstash Redis URL" "https://skilled-deer-13580.upstash.io"
    setup_env_var "REDIS_TOKEN" "Please provide your Upstash Redis token"
fi

# Database Connection Pooling
echo ""
echo "Would you like to set up Database Connection Pooling variables? (y/n)"
read setup_db_pool

if [ "$setup_db_pool" = "y" ]; then
    setup_env_var "DB_POOL_MAX" "Maximum number of connections in the pool" "20"
    setup_env_var "DB_POOL_MIN" "Minimum number of connections in the pool" "5"
    setup_env_var "DB_POOL_IDLE_TIMEOUT" "Idle timeout in milliseconds" "30000"
    setup_env_var "DB_POOL_CONNECTION_TIMEOUT" "Connection timeout in milliseconds" "5000"
fi

# Content Analysis Settings
echo ""
echo "Would you like to set up Content Analysis variables? (y/n)"
read setup_analysis

if [ "$setup_analysis" = "y" ]; then
    setup_env_var "ANALYSIS_MAX_URLS" "Maximum number of URLs to analyze" "10"
    setup_env_var "ANALYSIS_THROTTLE_MS" "Throttle rate in milliseconds" "1000"
fi

# Rate limiting
echo ""
echo "Would you like to set up rate limiting variables? (y/n)"
read setup_rate_limit

if [ "$setup_rate_limit" = "y" ]; then
    setup_env_var "RATE_LIMIT_REQUESTS" "Rate limit requests per window" "30"
    setup_env_var "RATE_LIMIT_WINDOW_SECONDS" "Rate limit window in seconds" "60"
fi

# Autoscaling
echo ""
echo "Would you like to set up autoscaling variables? (y/n)"
read setup_autoscaling

if [ "$setup_autoscaling" = "y" ]; then
    setup_env_var "REQUESTS_PER_WORKER" "Requests per worker" "500"
    setup_env_var "MIN_WORKERS_PER_REGION" "Minimum workers per region" "1"
    setup_env_var "MAX_WORKERS_PER_REGION" "Maximum workers per region" "10"
    setup_env_var "SCALING_COOLDOWN_SECONDS" "Scaling cooldown in seconds" "300"
fi

# Cache Settings
echo ""
echo "Would you like to set up cache TTL variables? (y/n)"
read setup_cache

if [ "$setup_cache" = "y" ]; then
    setup_env_var "CACHE_TTL_SHORT" "Short cache TTL in seconds" "60"
    setup_env_var "CACHE_TTL_MEDIUM" "Medium cache TTL in seconds" "300"
    setup_env_var "CACHE_TTL_LONG" "Long cache TTL in seconds" "1800"
    setup_env_var "CACHE_TTL_VERY_LONG" "Very long cache TTL in seconds" "3600"
fi

# Security
echo ""
echo "Would you like to set up security variables? (y/n)"
read setup_security

if [ "$setup_security" = "y" ]; then
    setup_env_var "WORKER_WEBHOOK_SECRET" "Worker webhook secret (for worker authentication)"
fi

# Notifications
echo ""
echo "Would you like to set up notification variables? (y/n)"
read setup_notifications

if [ "$setup_notifications" = "y" ]; then
    setup_env_var "ADMIN_EMAIL" "Admin email for alerts"
    setup_env_var "ALERT_WEBHOOK_URL" "Alert webhook URL (for Slack, etc.)"
fi

# Feature flags
echo ""
echo "Would you like to set up feature flag variables? (y/n)"
read setup_features

if [ "$setup_features" = "y" ]; then
    setup_env_var "ENABLE_CONTENT_RECOMMENDATIONS" "Enable content recommendations (true/false)" "false"
    setup_env_var "ENABLE_CUSTOM_REPORTING" "Enable custom reporting (true/false)" "false"
fi

echo ""
echo "Setup complete! Next steps:"
echo "1. Push your code to GitHub"
echo "2. Import your repository in Vercel"
echo "3. Configure build settings if needed:"
echo "   - Build Command: npx pnpm install --no-frozen-lockfile && npx pnpm build"
echo "   - Output Directory: .next"
echo "4. Deploy!"
echo ""
echo "You can deploy manually with: vercel --prod" 