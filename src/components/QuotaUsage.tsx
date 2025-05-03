import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuotaManagement } from '@/hooks/useQuotaManagement';
import { ChevronUp, ChevronDown, AlertTriangle, Check, Clock, X } from 'lucide-react';

interface QuotaUsageProps {
  organizationId: string;
}

export function QuotaUsage({ organizationId }: QuotaUsageProps) {
  const [activeTab, setActiveTab] = useState('limits');
  const [isQuotaRequestDialogOpen, setIsQuotaRequestDialogOpen] = useState(false);
  const [quotaRequestType, setQuotaRequestType] = useState<'analyses' | 'competitors' | 'api_requests' | 'storage'>('analyses');
  const [requestedLimit, setRequestedLimit] = useState<number>(0);
  const [requestReason, setRequestReason] = useState<string>('');
  const [quotaRequests, setQuotaRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  
  const {
    quotaInfo,
    usageInfo,
    loading,
    error,
    canRunAnalysis,
    quotaPercentages,
    refreshQuota,
    requestQuotaIncrease,
    getQuotaIncreaseRequests
  } = useQuotaManagement(organizationId);
  
  const handleQuotaIncrease = async () => {
    const success = await requestQuotaIncrease(quotaRequestType, requestedLimit, requestReason);
    if (success) {
      setIsQuotaRequestDialogOpen(false);
      // Clear form
      setRequestedLimit(0);
      setRequestReason('');
      // Reload requests
      fetchQuotaRequests();
    }
  };
  
  const fetchQuotaRequests = async () => {
    setIsLoadingRequests(true);
    const requests = await getQuotaIncreaseRequests();
    setQuotaRequests(requests);
    setIsLoadingRequests(false);
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'requests' && quotaRequests.length === 0) {
      fetchQuotaRequests();
    }
  };
  
  const getQuotaStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  
  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><X className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const getQuotaTypeLabel = (type: string) => {
    switch (type) {
      case 'analyses': return 'Monthly Analyses';
      case 'competitors': return 'Competitor URLs';
      case 'api_requests': return 'Daily API Requests';
      case 'storage': return 'Storage (MB)';
      default: return type;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          Quota & Usage
          {loading ? (
            <span className="ml-2 text-sm text-muted-foreground">(Loading...)</span>
          ) : quotaInfo ? (
            <Badge className="ml-2">{quotaInfo.displayName}</Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Monitor your usage limits and request quota increases
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center p-4 text-sm border rounded border-red-200 bg-red-50 text-red-600">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Failed to load quota information. Please try again later.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="limits">Usage Limits</TabsTrigger>
              <TabsTrigger value="requests">Quota Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="limits">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading quota information...
                </div>
              ) : quotaInfo && usageInfo ? (
                <div className="space-y-4">
                  {/* Daily Analysis Quota */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Daily Analyses</span>
                      <span className="text-sm text-muted-foreground">
                        {usageInfo.dailyAnalyses} / {quotaInfo.dailyAnalysesLimit}
                      </span>
                    </div>
                    <Progress 
                      value={quotaPercentages.dailyAnalyses} 
                      className={getQuotaStatusColor(quotaPercentages.dailyAnalyses)}
                    />
                  </div>
                  
                  {/* Monthly Analysis Quota */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Monthly Analyses</span>
                      <span className="text-sm text-muted-foreground">
                        {usageInfo.monthlyAnalyses} / {quotaInfo.monthlyAnalysesLimit}
                      </span>
                    </div>
                    <Progress 
                      value={quotaPercentages.monthlyAnalyses} 
                      className={getQuotaStatusColor(quotaPercentages.monthlyAnalyses)}
                    />
                  </div>
                  
                  {/* Competitor URLs Quota */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Competitor URLs</span>
                      <span className="text-sm text-muted-foreground">
                        {usageInfo.competitorUrls} / {quotaInfo.competitorUrlsLimit}
                      </span>
                    </div>
                    <Progress 
                      value={quotaPercentages.competitorUrls} 
                      className={getQuotaStatusColor(quotaPercentages.competitorUrls)}
                    />
                  </div>
                  
                  {/* API Requests Quota */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">API Requests (Today)</span>
                      <span className="text-sm text-muted-foreground">
                        {usageInfo.dailyApiRequests} / {quotaInfo.apiRequestsLimit}
                      </span>
                    </div>
                    <Progress 
                      value={quotaPercentages.apiRequests} 
                      className={getQuotaStatusColor(quotaPercentages.apiRequests)}
                    />
                  </div>
                  
                  {/* Storage Limit */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Storage Limit</span>
                      <span className="text-sm text-muted-foreground">
                        {(quotaInfo.storageLimit / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  </div>
                  
                  {/* Warning if quota is near limit */}
                  {(quotaPercentages.dailyAnalyses >= 90 || quotaPercentages.monthlyAnalyses >= 90) && (
                    <div className="flex items-center p-3 text-sm border rounded border-amber-200 bg-amber-50 text-amber-700 mt-4">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div>
                        You're approaching your analysis quota limit. 
                        Consider requesting a quota increase or upgrading your plan.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No quota information available
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="requests">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Quota Increase Requests</h3>
                  <Dialog open={isQuotaRequestDialogOpen} onOpenChange={setIsQuotaRequestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Request Quota Increase</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Quota Increase</DialogTitle>
                        <DialogDescription>
                          Submit a request to increase your usage limits. 
                          Our team will review your request as soon as possible.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="quota-type">Quota Type</Label>
                          <Select 
                            value={quotaRequestType} 
                            onValueChange={(val) => setQuotaRequestType(val as any)}
                          >
                            <SelectTrigger id="quota-type">
                              <SelectValue placeholder="Select quota type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="analyses">Monthly Analyses</SelectItem>
                              <SelectItem value="competitors">Competitor URLs</SelectItem>
                              <SelectItem value="api_requests">API Requests</SelectItem>
                              <SelectItem value="storage">Storage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="current-limit">
                            Current Limit: {quotaInfo && (
                              quotaRequestType === 'analyses' ? quotaInfo.monthlyAnalysesLimit :
                              quotaRequestType === 'competitors' ? quotaInfo.competitorUrlsLimit :
                              quotaRequestType === 'api_requests' ? quotaInfo.apiRequestsLimit :
                              quotaInfo.storageLimit
                            )}
                          </Label>
                          <Input
                            id="requested-limit"
                            type="number"
                            placeholder="Requested limit"
                            value={requestedLimit || ''}
                            onChange={(e) => setRequestedLimit(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reason">Business Justification</Label>
                          <Textarea
                            id="reason"
                            placeholder="Please explain why you need this increase"
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuotaRequestDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleQuotaIncrease}
                          disabled={!requestedLimit || requestedLimit <= (quotaInfo ? (
                            quotaRequestType === 'analyses' ? quotaInfo.monthlyAnalysesLimit :
                            quotaRequestType === 'competitors' ? quotaInfo.competitorUrlsLimit :
                            quotaRequestType === 'api_requests' ? quotaInfo.apiRequestsLimit :
                            quotaInfo.storageLimit
                          ) : 0)}
                        >
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isLoadingRequests ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading requests...
                  </div>
                ) : quotaRequests.length > 0 ? (
                  <div className="border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotaRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getQuotaTypeLabel(request.request_type)}</TableCell>
                            <TableCell>
                              {request.requested_limit}
                              <span className="text-xs text-muted-foreground ml-1">
                                (from {request.current_limit})
                              </span>
                            </TableCell>
                            <TableCell>{getRequestStatusBadge(request.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground border rounded">
                    No quota increase requests found
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={refreshQuota}>
          Refresh
        </Button>
        
        {quotaInfo && (
          <div className="text-xs text-muted-foreground">
            To upgrade your plan, please contact support.
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 