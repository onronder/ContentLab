import { createClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';
import { getMemoryCache, setMemoryCache, withCache, CACHE_EXPIRY } from './cache';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  isLimited: boolean;
  exceeded: boolean;
}

export interface QuotaCheckResult {
  success: boolean;
  hasQuota: boolean;
  currentUsage: number;
  limitValue: number;
  remaining: number;
}

/**
 * Checks if a request is rate limited based on the organization and endpoint
 * @param organizationId - The organization ID
 * @param userId - The user ID
 * @param endpoint - The API endpoint being accessed
 * @returns Rate limit information
 */
export async function checkRateLimit(
  organizationId: string,
  userId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const supabase = createClient();
  
  try {
    // Rate limit checks should generally not be cached to ensure accurate limiting
    const { data, error } = await supabase.rpc('record_rate_limit_request', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_endpoint: endpoint
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      // Default to allowing the request if there's an error checking
      return {
        success: false,
        limit: 60, // Default limit
        remaining: 1,
        reset: new Date(Date.now() + 60000), // Reset in 1 minute
        isLimited: false,
        exceeded: false
      };
    }
    
    const result = data[0] || {};
    return {
      success: true,
      limit: result.limit_value || 60,
      remaining: Math.max(0, (result.limit_value || 60) - (result.current_count || 0)),
      reset: new Date(result.reset_time || Date.now() + 60000),
      isLimited: !!result.is_rate_limited,
      exceeded: !!result.is_rate_limited
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Default to allowing the request if there's an exception
    return {
      success: false,
      limit: 60,
      remaining: 1,
      reset: new Date(Date.now() + 60000),
      isLimited: false,
      exceeded: false
    };
  }
}

/**
 * Checks if an organization has exceeded its quota for a specific resource
 * @param organizationId - The organization ID
 * @param quotaType - The type of quota to check (daily_analyses, monthly_analyses, competitor_urls, daily_api_requests)
 * @returns Quota check result
 */
export async function checkQuota(
  organizationId: string,
  quotaType: 'daily_analyses' | 'monthly_analyses' | 'competitor_urls' | 'daily_api_requests'
): Promise<QuotaCheckResult> {
  // Use cache key that includes organization ID and quota type
  const cacheKey = `quota:${organizationId}:${quotaType}`;
  
  // Check memory cache first with a short TTL (30 seconds)
  const cachedResult = getMemoryCache<QuotaCheckResult>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('check_organization_quota', {
      p_organization_id: organizationId,
      p_quota_type: quotaType
    });
    
    if (error) {
      console.error('Quota check error:', error);
      return {
        success: false,
        hasQuota: true, // Default to allowing if check fails
        currentUsage: 0,
        limitValue: 0,
        remaining: 0
      };
    }
    
    const result = data[0] || {};
    const quotaResult = {
      success: true,
      hasQuota: !!result.has_quota,
      currentUsage: result.current_usage || 0,
      limitValue: result.limit_value || 0,
      remaining: result.remaining || 0
    };
    
    // Cache the result for 30 seconds to reduce database load
    // Quota data doesn't change that frequently
    setMemoryCache(cacheKey, quotaResult, 30 * 1000);
    
    return quotaResult;
  } catch (err) {
    console.error('Quota check error:', err);
    return {
      success: false,
      hasQuota: true, // Default to allowing if check fails
      currentUsage: 0,
      limitValue: 0,
      remaining: 0
    };
  }
}

/**
 * Get organization's subscription plan details with caching
 * @param organizationId - The organization ID
 * @returns Subscription plan details
 */
export async function getSubscriptionPlanDetails(organizationId: string) {
  return withCache(
    `org:${organizationId}:subscription`,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          subscription_plan_id,
          subscription_plans (
            id,
            name,
            display_name,
            max_analyses_daily,
            max_analyses_monthly,
            max_competitor_urls,
            max_api_requests_daily,
            storage_limit_mb,
            priority_queue
          )
        `)
        .eq('id', organizationId)
        .single();
        
      if (error || !data) {
        throw new Error(`Failed to fetch subscription plan: ${error?.message || 'No data'}`);
      }
      
      return data.subscription_plans;
    },
    {
      // Cache for 15 minutes in memory
      memoryExpiryMs: CACHE_EXPIRY.LONG,
      // Cache for 1 hour in persistent cache
      persistentExpirySeconds: 3600
    }
  );
}

/**
 * Increments the usage counter for a specific organization and usage type
 * @param organizationId - The organization ID
 * @param usageType - The type of usage to increment (analyses, api_requests, competitor_urls)
 * @param increment - The amount to increment (default: 1)
 * @returns Success status
 */
export async function incrementUsage(
  organizationId: string,
  usageType: 'analyses' | 'api_requests' | 'competitor_urls',
  increment: number = 1
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_organization_id: organizationId,
      p_usage_type: usageType,
      p_increment: increment
    });
    
    if (error) {
      console.error('Usage increment error:', error);
      return false;
    }
    
    // Clear cached quota information since it's now stale
    const quotaTypes = ['daily_analyses', 'monthly_analyses', 'competitor_urls', 'daily_api_requests'];
    quotaTypes.forEach(type => {
      const cacheKey = `quota:${organizationId}:${type}`;
      // Clear from memory cache to force a refresh on next check
      // No need to worry about persistent cache as it will expire naturally
      setMemoryCache(cacheKey, null, 0);
    });
    
    return !!data;
  } catch (err) {
    console.error('Usage increment error:', err);
    return false;
  }
}

/**
 * Creates a quota increase request
 * @param organizationId - The organization ID
 * @param requestType - The type of quota increase to request
 * @param requestedLimit - The requested limit
 * @param reason - The reason for the request
 * @returns Request ID if successful, null otherwise
 */
export async function requestQuotaIncrease(
  organizationId: string,
  requestType: 'analyses' | 'competitors' | 'api_requests' | 'storage',
  requestedLimit: number,
  reason?: string
): Promise<string | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('request_quota_increase', {
      p_organization_id: organizationId,
      p_request_type: requestType,
      p_requested_limit: requestedLimit,
      p_reason: reason
    });
    
    if (error) {
      console.error('Quota increase request error:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Quota increase request error:', err);
    return null;
  }
}

/**
 * Get all documentation for rate limits and quotas
 * @param category - Documentation category
 * @param publicOnly - Whether to return only public documentation
 * @returns Documentation items
 */
export async function getDocumentation(
  category: string,
  publicOnly: boolean = true
): Promise<any[]> {
  return withCache(
    `docs:${category}:${publicOnly ? 'public' : 'all'}`,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_documentation', {
        p_category: category,
        p_public_only: publicOnly
      });
      
      if (error) {
        console.error('Documentation fetch error:', error);
        return [];
      }
      
      return data || [];
    },
    {
      // Cache documentation for longer periods since it rarely changes
      memoryExpiryMs: CACHE_EXPIRY.VERY_LONG,
      persistentExpirySeconds: 24 * 60 * 60 // 24 hours
    }
  );
}

/**
 * Adds rate limiting headers to a Next.js Response object
 * @param response - The Response object
 * @param rateLimitResult - The rate limit check result
 * @returns The Response with headers added
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.reset.getTime() / 1000).toString());
  
  if (rateLimitResult.exceeded) {
    headers.set('Retry-After', Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString());
  }
  
  return new Response(response.body, {
    status: rateLimitResult.exceeded ? 429 : response.status,
    statusText: rateLimitResult.exceeded ? 'Too Many Requests' : response.statusText,
    headers
  });
} 