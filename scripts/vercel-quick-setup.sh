#!/bin/bash

# Vercel Quick Setup Script 
# This script automatically applies all environment variables from .env to Vercel
# without requiring user interaction

echo "Vercel Quick Setup - Applying Environment Variables"
echo "=================================================="
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

# Function to automatically set an environment variable
auto_setup_env_var() {
    local var_name=$1
    local var_value=$2
    
    if [ -z "$var_value" ]; then
        echo "⚠️ Skipping $var_name (no value available)"
        return
    fi
    
    echo "Setting $var_name..."
    vercel env add $var_name production <<< "$var_value"
    echo "✅ Set $var_name"
}

# Load values from .env file
if [ -f .env ]; then
    echo "Loading values from .env file..."
    source .env
else
    echo "⚠️ No .env file found, using predefined defaults"
fi

echo "Applying environment variables to Vercel..."

# Supabase variables
auto_setup_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
auto_setup_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Redis configuration
auto_setup_env_var "REDIS_URL" "$REDIS_URL"
auto_setup_env_var "REDIS_TOKEN" "$REDIS_TOKEN"

# Database Connection Pooling
auto_setup_env_var "DB_POOL_MAX" "$DB_POOL_MAX"
auto_setup_env_var "DB_POOL_MIN" "$DB_POOL_MIN"
auto_setup_env_var "DB_POOL_IDLE_TIMEOUT" "$DB_POOL_IDLE_TIMEOUT"
auto_setup_env_var "DB_POOL_CONNECTION_TIMEOUT" "$DB_POOL_CONNECTION_TIMEOUT"

# Content Analysis settings
auto_setup_env_var "ANALYSIS_MAX_URLS" "$ANALYSIS_MAX_URLS"
auto_setup_env_var "ANALYSIS_THROTTLE_MS" "$ANALYSIS_THROTTLE_MS"

# Rate limiting
auto_setup_env_var "RATE_LIMIT_REQUESTS" "$RATE_LIMIT_REQUESTS"
auto_setup_env_var "RATE_LIMIT_WINDOW_SECONDS" "$RATE_LIMIT_WINDOW_SECONDS"

# Autoscaling
auto_setup_env_var "REQUESTS_PER_WORKER" "$REQUESTS_PER_WORKER"
auto_setup_env_var "MIN_WORKERS_PER_REGION" "$MIN_WORKERS_PER_REGION"
auto_setup_env_var "MAX_WORKERS_PER_REGION" "$MAX_WORKERS_PER_REGION"
auto_setup_env_var "SCALING_COOLDOWN_SECONDS" "$SCALING_COOLDOWN_SECONDS"

# Cache settings
auto_setup_env_var "CACHE_TTL_SHORT" "$CACHE_TTL_SHORT"
auto_setup_env_var "CACHE_TTL_MEDIUM" "$CACHE_TTL_MEDIUM"
auto_setup_env_var "CACHE_TTL_LONG" "$CACHE_TTL_LONG"
auto_setup_env_var "CACHE_TTL_VERY_LONG" "$CACHE_TTL_VERY_LONG"

# Other configurations
auto_setup_env_var "WORKER_WEBHOOK_SECRET" "$WORKER_WEBHOOK_SECRET"
auto_setup_env_var "ADMIN_EMAIL" "$ADMIN_EMAIL"
auto_setup_env_var "ALERT_WEBHOOK_URL" "$ALERT_WEBHOOK_URL"
auto_setup_env_var "ENABLE_CONTENT_RECOMMENDATIONS" "$ENABLE_CONTENT_RECOMMENDATIONS"
auto_setup_env_var "ENABLE_CUSTOM_REPORTING" "$ENABLE_CUSTOM_REPORTING"

echo ""
echo "Setup complete! Your environment variables have been applied to Vercel."
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Import your repository in Vercel"
echo "3. Configure build settings if needed:"
echo "   - Build Command: npx pnpm install --no-frozen-lockfile && npx pnpm build"
echo "   - Output Directory: .next"
echo "4. Deploy!"
echo ""
echo "You can deploy manually with: vercel --prod" 