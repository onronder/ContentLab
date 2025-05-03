import { createClient } from '@/lib/supabase/client';
import { getRateLimiter, setCache, getCache, deleteCache } from './redis';

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

// Define types for documentation
export interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  order_index: number;
}

/**
 * Gets the plan type string for rate limiting
 * @param planId - The plan ID
 * @returns Plan type string
 */
async function getPlanType(planId: string): Promise<'free' | 'starter' | 'pro' | 'enterprise' | 'custom'> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', planId)
      .single();
      
    if (error || !data) {
      return 'free'; // Default to free plan on error
    }
    
    // Check if it's one of our standard plans
    if (['free', 'starter', 'pro', 'enterprise'].includes(data.name)) {
      return data.name as 'free' | 'starter' | 'pro' | 'enterprise';
    }
    
    // If it's a custom plan
    return 'custom';
  } catch (err) {
    console.error('Error getting plan type:', err);
    return 'free'; // Default to free plan on error
  }
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
    // Get organization's subscription plan
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan_id, custom_limits')
      .eq('id', organizationId)
      .single();
      
    if (orgError || !orgData) {
      console.error('Error fetching organization:', orgError);
      // Default to lowest limits
      return {
        success: false,
        limit: 30, // Default limit (free plan)
        remaining: 1,
        reset: new Date(Date.now() + 60000), // Reset in 1 minute
        isLimited: false,
        exceeded: false
      };
    }
    
    // Get plan type for rate limiting
    const planType = await getPlanType(orgData.subscription_plan_id);
    
    // Check for custom rate limit in organization settings
    let customLimit = null;
    if (orgData.custom_limits && orgData.custom_limits.rate_limit) {
      customLimit = orgData.custom_limits.rate_limit;
    }
    
    // Get the appropriate rate limiter
    const limiter = getRateLimiter(planType);
    
    // Create a key for this specific organization and endpoint
    const rateLimitKey = `${organizationId}:${endpoint}`;
    
    // Check the limit
    const { success, limit, remaining, reset } = await limiter.limit(rateLimitKey);
    
    // Apply custom limit override if available
    const actualLimit = customLimit || limit;
    
    // Also record in database for analytics (but don't block on this)
    supabase.rpc('record_rate_limit_request', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_endpoint: endpoint
    }).then((res) => {
      if (res.error) {
        console.error('Failed to record rate limit request:', res.error);
      }
    });
    
    return {
      success: true,
      limit: actualLimit,
      remaining,
      reset: new Date(reset),
      isLimited: !success,
      exceeded: !success
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Default to allowing the request if there's an exception
    return {
      success: false,
      limit: 30, // Default limit (free plan)
      remaining: 1,
      reset: new Date(Date.now() + 60000), // Reset in 1 minute
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
  
  // Check Redis cache first with a short TTL (30 seconds)
  const cachedResult = await getCache<QuotaCheckResult>(cacheKey);
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
    await setCache(cacheKey, quotaResult, 30);
    
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
  const cacheKey = `org:${organizationId}:subscription`;
  
  // Try to get from cache first
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // If not in cache, fetch from database
  try {
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
    
    // Cache for 15 minutes
    await setCache(cacheKey, data.subscription_plans, 15 * 60);
    
    return data.subscription_plans;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw error;
  }
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
    for (const type of quotaTypes) {
      const cacheKey = `quota:${organizationId}:${type}`;
      // Clear from cache to force a refresh on next check
      await deleteCache(cacheKey);
    }
    
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
      p_reason: reason || ''
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
 * Gets documentation entries from the database
 * @param category - The documentation category
 * @param publicOnly - Whether to only include public documentation
 * @returns Array of documentation entries
 */
export async function getDocumentation(
  category: string,
  publicOnly: boolean = true
): Promise<DocumentationItem[]> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('documentation')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (publicOnly) {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching documentation:', error);
      return [];
    }
    
    return data as DocumentationItem[];
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return [];
  }
}

/**
 * Add rate limit headers to an HTTP response
 * @param response - The HTTP response
 * @param rateLimitResult - The rate limit information
 * @returns Updated response with rate limit headers
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  
  // Add standard rate-limit headers
  headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(rateLimitResult.reset.getTime() / 1000).toString());
  
  if (rateLimitResult.isLimited) {
    headers.set('Retry-After', Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString());
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
} 