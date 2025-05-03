'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { withCache, CACHE_EXPIRY } from '@/lib/cache';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpDown,
  BarChart3,
  Users,
  AlertTriangle,
  Download
} from 'lucide-react';

// Helper to format date ranges
const formatDateRange = (start: Date, end: Date) => {
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Define the types for usage data
interface UsageData {
  date: string;
  organization_id: string;
  analyses_count: number;
  api_requests_count: number;
  competitor_urls_count: number;
}

// Define the types for organization data
interface OrganizationData {
  id: string;
  name: string;
  subscription_plan_id: string;
  subscription_plans: {
    name: string;
  } | null;
}

// Define the types for quota request data
interface QuotaRequestData {
  id: string;
  organization_id: string;
  request_type: string;
  current_limit: number;
  requested_limit: number;
  status: string;
  created_at: string;
}

// Define the structure for processed analytics data
interface AnalyticsData {
  dailyUsage: Array<{
    date: string;
    analyses: number;
    apiRequests: number;
    competitorUrls: number;
  }>;
  usageByPlan: Record<string, {
    analyses: number;
    apiRequests: number;
    competitorUrls: number;
    organizations: number;
  }>;
  totalUsage: {
    analyses: number;
    apiRequests: number;
    competitorUrls: number;
  };
  quotaRequestsByType: Record<string, number>;
  quotaRequestsByStatus: Record<string, number>;
  usageChartData: ChartData;
  planDistributionData: ChartData;
  quotaRequestsData: ChartData;
  orgsByPlan: Record<string, OrganizationData[]>;
  totalOrganizations: number;
  totalQuotaRequests: number;
}

export function UsageAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisMonth' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  
  // Calculate actual date range based on selection
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case '7days':
        return { start: subDays(today, 7), end: today };
      case '30days':
        return { start: subDays(today, 30), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        return { 
          start: customStartDate || subDays(today, 7), 
          end: customEndDate || today 
        };
    }
  };
  
  // Format the date range for display
  const displayDateRange = () => {
    const { start, end } = getDateRange();
    return formatDateRange(start, end);
  };
  
  // Fetch analytics data based on selected date range
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { start, end } = getDateRange();
      
      // Cache key based on date range
      const cacheKey = `analytics:${format(start, 'yyyy-MM-dd')}:${format(end, 'yyyy-MM-dd')}`;
      
      // Use caching mechanism for analytics data
      const data = await withCache(
        cacheKey,
        async () => {
          // Fetch usage analytics data from database
          const { data: usageData, error: usageError } = await supabase
            .from('usage_tracking')
            .select('*')
            .gte('date', format(start, 'yyyy-MM-dd'))
            .lte('date', format(end, 'yyyy-MM-dd'))
            .order('date', { ascending: true });
          
          if (usageError) throw usageError;
          
          // Fetch organization data for the analysis
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select(`
              id,
              name,
              subscription_plan_id,
              subscription_plans (name)
            `);
          
          if (orgError) throw orgError;
          
          // Fetch quota requests for the period
          const { data: quotaRequests, error: quotaError } = await supabase
            .from('quota_increase_requests')
            .select('*')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());
          
          if (quotaError) throw quotaError;
          
          // Process and aggregate data for charts and stats
          const processedData = processAnalyticsData(
            usageData as UsageData[], 
            orgData as unknown as OrganizationData[], 
            quotaRequests as QuotaRequestData[]
          );
          
          return processedData;
        },
        {
          // Cache for 15 minutes in memory
          memoryExpiryMs: CACHE_EXPIRY.LONG,
          // Cache for 1 hour in persistent store
          persistentExpirySeconds: 3600
        }
      );
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, supabase, toast]);
  
  // Process raw data into analytics format
  const processAnalyticsData = (
    usageData: UsageData[], 
    orgData: OrganizationData[], 
    quotaRequests: QuotaRequestData[]
  ): AnalyticsData => {
    // Group organizations by subscription plan
    const orgsByPlan: Record<string, OrganizationData[]> = {};
    orgData.forEach(org => {
      const planName = org.subscription_plans?.name || 'unknown';
      orgsByPlan[planName] = orgsByPlan[planName] || [];
      orgsByPlan[planName].push(org);
    });
    
    // Get unique dates from usage data
    const dates = [...new Set(usageData.map(item => item.date))].sort();
    
    // Aggregate usage by date
    const dailyUsage = dates.map(date => {
      const dayData = usageData.filter(item => item.date === date);
      return {
        date,
        analyses: dayData.reduce((sum, item) => sum + (item.analyses_count || 0), 0),
        apiRequests: dayData.reduce((sum, item) => sum + (item.api_requests_count || 0), 0),
        competitorUrls: dayData.reduce((sum, item) => sum + (item.competitor_urls_count || 0), 0),
      };
    });
    
    // Aggregate usage by subscription plan
    const usageByPlan: Record<string, {
      analyses: number;
      apiRequests: number;
      competitorUrls: number;
      organizations: number;
    }> = {};
    Object.keys(orgsByPlan).forEach(plan => {
      const planOrgIds = orgsByPlan[plan].map(org => org.id);
      const planUsage = usageData.filter(item => planOrgIds.includes(item.organization_id));
      
      usageByPlan[plan] = {
        analyses: planUsage.reduce((sum, item) => sum + (item.analyses_count || 0), 0),
        apiRequests: planUsage.reduce((sum, item) => sum + (item.api_requests_count || 0), 0),
        competitorUrls: planUsage.reduce((sum, item) => sum + (item.competitor_urls_count || 0), 0),
        organizations: planOrgIds.length,
      };
    });
    
    // Process quota requests
    const quotaRequestsByType: Record<string, number> = {};
    const quotaRequestsByStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    
    quotaRequests.forEach(request => {
      // Count by type
      quotaRequestsByType[request.request_type] = (quotaRequestsByType[request.request_type] || 0) + 1;
      
      // Count by status
      if (request.status === 'pending') quotaRequestsByStatus.pending++;
      else if (request.status === 'approved') quotaRequestsByStatus.approved++;
      else if (request.status === 'rejected') quotaRequestsByStatus.rejected++;
    });
    
    // Calculate total usage
    const totalUsage = {
      analyses: usageData.reduce((sum, item) => sum + (item.analyses_count || 0), 0),
      apiRequests: usageData.reduce((sum, item) => sum + (item.api_requests_count || 0), 0),
      competitorUrls: usageData.reduce((sum, item) => sum + (item.competitor_urls_count || 0), 0),
    };
    
    // Prepare chart data
    const usageChartData: ChartData = {
      labels: dates.map(date => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Analyses',
          data: dailyUsage.map(day => day.analyses),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          fill: false
        },
        {
          label: 'API Requests',
          data: dailyUsage.map(day => day.apiRequests),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          fill: false
        }
      ]
    };
    
    const planDistributionData: ChartData = {
      labels: Object.keys(usageByPlan),
      datasets: [
        {
          label: 'Organizations',
          data: Object.values(usageByPlan).map(plan => plan.organizations),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(139, 92, 246, 0.7)'
          ],
        }
      ]
    };
    
    const quotaRequestsData: ChartData = {
      labels: Object.keys(quotaRequestsByStatus),
      datasets: [
        {
          label: 'Quota Requests',
          data: Object.values(quotaRequestsByStatus),
          backgroundColor: [
            'rgba(245, 158, 11, 0.7)', // pending
            'rgba(16, 185, 129, 0.7)',  // approved
            'rgba(239, 68, 68, 0.7)'    // rejected
          ],
        }
      ]
    };
    
    return {
      dailyUsage,
      usageByPlan,
      totalUsage,
      quotaRequestsByType,
      quotaRequestsByStatus,
      usageChartData,
      planDistributionData,
      quotaRequestsData,
      orgsByPlan,
      totalOrganizations: orgData.length,
      totalQuotaRequests: quotaRequests.length,
    };
  };
  
  // Fetch data when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStartDate, customEndDate, fetchAnalytics]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>
              Analyze usage patterns and quota metrics
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select 
              value={dateRange} 
              onValueChange={(value: "7days" | "30days" | "thisMonth" | "custom") => setDateRange(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {displayDateRange()}
        </div>
      </CardHeader>
      <CardContent>
        {dateRange === 'custom' && (
          <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div>
              <h3 className="text-sm font-medium mb-1">Start Date</h3>
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={setCustomStartDate}
                className="rounded-md border"
                disabled={(date) => date > new Date() || (customEndDate ? date > customEndDate : false)}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">End Date</h3>
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={setCustomEndDate}
                className="rounded-md border"
                disabled={(date) => date > new Date() || (customStartDate ? date < customStartDate : false)}
              />
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Details</TabsTrigger>
            <TabsTrigger value="quota">Quota Requests</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : analyticsData ? (
            <>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Analyses */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                          <h3 className="text-2xl font-bold mt-1">{analyticsData.totalUsage.analyses}</h3>
                        </div>
                        <BarChart3 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Total API Requests */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                          <h3 className="text-2xl font-bold mt-1">{analyticsData.totalUsage.apiRequests}</h3>
                        </div>
                        <ArrowUpDown className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Active Organizations */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                          <h3 className="text-2xl font-bold mt-1">{analyticsData.totalOrganizations}</h3>
                        </div>
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Main Chart - Could be implemented with Chart.js or other libraries */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Daily Usage Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-muted-foreground">
                        [Chart Placeholder - Daily Usage Visualization]
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Plan Distribution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Subscription Plan Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center">
                        <div className="text-muted-foreground">
                          [Chart Placeholder - Plan Distribution]
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quota Requests */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Quota Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center">
                        <div className="text-muted-foreground">
                          [Chart Placeholder - Quota Requests]
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Usage Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Date</th>
                            <th className="text-left py-2 px-4">Analyses</th>
                            <th className="text-left py-2 px-4">API Requests</th>
                            <th className="text-left py-2 px-4">Competitor URLs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.dailyUsage.map((day: {
                            date: string;
                            analyses: number;
                            apiRequests: number;
                            competitorUrls: number;
                          }, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-4">{format(new Date(day.date), 'MMM d, yyyy')}</td>
                              <td className="py-2 px-4">{day.analyses}</td>
                              <td className="py-2 px-4">{day.apiRequests}</td>
                              <td className="py-2 px-4">{day.competitorUrls}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="quota" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quota Requests by Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quota Requests by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Request Type</th>
                              <th className="text-left py-2 px-4">Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analyticsData.quotaRequestsByType).map(([type, count]: [string, number]) => (
                              <tr key={type} className="border-b">
                                <td className="py-2 px-4">{getRequestTypeName(type)}</td>
                                <td className="py-2 px-4">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quota Requests by Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quota Requests by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Status</th>
                              <th className="text-left py-2 px-4">Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analyticsData.quotaRequestsByStatus).map(([status, count]: [string, number]) => (
                              <tr key={status} className="border-b">
                                <td className="py-2 px-4 capitalize">{status}</td>
                                <td className="py-2 px-4">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="plans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage by Subscription Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Plan</th>
                            <th className="text-left py-2 px-4">Organizations</th>
                            <th className="text-left py-2 px-4">Analyses</th>
                            <th className="text-left py-2 px-4">API Requests</th>
                            <th className="text-left py-2 px-4">Competitor URLs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(analyticsData.usageByPlan).map(([plan, data]: [string, {
                            analyses: number;
                            apiRequests: number;
                            competitorUrls: number;
                            organizations: number;
                          }]) => (
                            <tr key={plan} className="border-b">
                              <td className="py-2 px-4 capitalize">{plan}</td>
                              <td className="py-2 px-4">{data.organizations}</td>
                              <td className="py-2 px-4">{data.analyses}</td>
                              <td className="py-2 px-4">{data.apiRequests}</td>
                              <td className="py-2 px-4">{data.competitorUrls}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-muted-foreground">
                Failed to load analytics data. Try refreshing.
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Data refreshed: {isLoading ? 'Loading...' : format(new Date(), 'MMM d, yyyy HH:mm:ss')}
      </CardFooter>
    </Card>
  );
}

// Helper function to get readable names for request types
function getRequestTypeName(type: string) {
  switch(type) {
    case 'analyses': return 'Monthly Analyses';
    case 'competitors': return 'Competitor URLs';
    case 'api_requests': return 'API Requests';
    case 'storage': return 'Storage (MB)';
    default: return type.replace('_', ' ');
  }
} 