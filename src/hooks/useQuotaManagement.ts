import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface QuotaInfo {
  plan: string;
  displayName: string;
  dailyAnalysesLimit: number;
  monthlyAnalysesLimit: number;
  competitorUrlsLimit: number;
  apiRequestsLimit: number;
  storageLimit: number;
}

interface UsageInfo {
  dailyAnalyses: number;
  monthlyAnalyses: number;
  competitorUrls: number;
  dailyApiRequests: number;
}

type QuotaRequestType = 'analyses' | 'competitors' | 'api_requests' | 'storage';

interface QuotaManagementReturn {
  quotaInfo: QuotaInfo | null;
  usageInfo: UsageInfo | null;
  loading: boolean;
  error: Error | null;
  canRunAnalysis: boolean;
  quotaPercentages: {
    dailyAnalyses: number;
    monthlyAnalyses: number;
    competitorUrls: number;
    apiRequests: number;
  };
  refreshQuota: () => Promise<void>;
  requestQuotaIncrease: (type: QuotaRequestType, requestedLimit: number, reason?: string) => Promise<boolean>;
  getQuotaIncreaseRequests: () => Promise<any[]>;
}

export function useQuotaManagement(organizationId?: string): QuotaManagementReturn {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Calculated quota percentages
  const quotaPercentages = {
    dailyAnalyses: usageInfo && quotaInfo ? 
      Math.min(100, Math.round((usageInfo.dailyAnalyses / quotaInfo.dailyAnalysesLimit) * 100)) : 0,
    monthlyAnalyses: usageInfo && quotaInfo ? 
      Math.min(100, Math.round((usageInfo.monthlyAnalyses / quotaInfo.monthlyAnalysesLimit) * 100)) : 0,
    competitorUrls: usageInfo && quotaInfo ? 
      Math.min(100, Math.round((usageInfo.competitorUrls / quotaInfo.competitorUrlsLimit) * 100)) : 0,
    apiRequests: usageInfo && quotaInfo ? 
      Math.min(100, Math.round((usageInfo.dailyApiRequests / quotaInfo.apiRequestsLimit) * 100)) : 0,
  };

  // Can the user run more analyses today?
  const canRunAnalysis = usageInfo && quotaInfo ? 
    usageInfo.dailyAnalyses < quotaInfo.dailyAnalysesLimit && 
    usageInfo.monthlyAnalyses < quotaInfo.monthlyAnalysesLimit : 
    false;

  // Fetch quota and usage information
  const fetchQuotaInfo = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_organization_details', {
        p_organization_id: organizationId
      });
      
      if (error) throw error;
      
      if (data && data.subscription && data.usage) {
        setQuotaInfo({
          plan: data.subscription.plan,
          displayName: data.subscription.display_name,
          dailyAnalysesLimit: data.subscription.daily_analyses_limit,
          monthlyAnalysesLimit: data.subscription.monthly_analyses_limit,
          competitorUrlsLimit: data.subscription.competitor_urls_limit,
          apiRequestsLimit: data.subscription.api_requests_limit,
          storageLimit: data.subscription.storage_limit_mb,
        });
        
        setUsageInfo({
          dailyAnalyses: data.usage.daily_analyses,
          monthlyAnalyses: data.usage.monthly_analyses,
          competitorUrls: data.usage.competitor_urls,
          dailyApiRequests: data.usage.daily_api_requests,
        });
      }
    } catch (err) {
      console.error('Error fetching quota information:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch quota information'));
      toast({
        title: 'Error',
        description: 'Could not load quota information. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, supabase, toast]);

  // Refresh quota information
  const refreshQuota = useCallback(async () => {
    await fetchQuotaInfo();
  }, [fetchQuotaInfo]);

  // Request a quota increase
  const requestQuotaIncrease = useCallback(async (
    type: QuotaRequestType,
    requestedLimit: number,
    reason?: string
  ): Promise<boolean> => {
    if (!organizationId) return false;
    
    try {
      const { data, error } = await supabase.rpc('request_quota_increase', {
        p_organization_id: organizationId,
        p_request_type: type,
        p_requested_limit: requestedLimit,
        p_reason: reason
      });
      
      if (error) throw error;
      
      toast({
        title: 'Request Submitted',
        description: 'Your quota increase request has been submitted for review.',
      });
      
      return true;
    } catch (err) {
      console.error('Error requesting quota increase:', err);
      toast({
        title: 'Error',
        description: 'Could not submit quota increase request. Please try again later.',
        variant: 'destructive',
      });
      return false;
    }
  }, [organizationId, supabase, toast]);

  // Get all quota increase requests for this organization
  const getQuotaIncreaseRequests = useCallback(async () => {
    if (!organizationId) return [];
    
    try {
      const { data, error } = await supabase
        .from('quota_increase_requests')
        .select(`
          id, 
          request_type, 
          current_limit, 
          requested_limit, 
          reason, 
          status, 
          created_at,
          requested_by(email),
          reviewed_by(email),
          reviewed_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching quota increase requests:', err);
      return [];
    }
  }, [organizationId, supabase]);

  // Load quota info on mount and when organizationId changes
  useEffect(() => {
    fetchQuotaInfo();
  }, [fetchQuotaInfo]);

  return {
    quotaInfo,
    usageInfo,
    loading,
    error,
    canRunAnalysis,
    quotaPercentages,
    refreshQuota,
    requestQuotaIncrease,
    getQuotaIncreaseRequests,
  };
} 