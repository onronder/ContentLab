'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

// Type definition for quota requests
interface QuotaRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  requestType: string;
  currentLimit: number;
  requestedLimit: number;
  reason: string;
  status: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

interface QuotaRequestListProps {
  requests: QuotaRequest[];
}

export function QuotaRequestList({ requests }: QuotaRequestListProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<QuotaRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLimit, setCustomLimit] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  
  // Filter requests based on active tab and search query
  const filteredRequests = requests.filter(request => {
    const matchesTab = 
      (activeTab === 'pending' && request.status === 'pending') ||
      (activeTab === 'approved' && request.status === 'approved') ||
      (activeTab === 'rejected' && request.status === 'rejected') ||
      (activeTab === 'all');
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      request.organizationName.toLowerCase().includes(searchLower) ||
      request.requestedBy.toLowerCase().includes(searchLower) ||
      request.requestType.toLowerCase().includes(searchLower);
    
    return matchesTab && matchesSearch;
  });
  
  // Map request types to display names
  const getRequestTypeName = (type: string) => {
    switch(type) {
      case 'analyses': return 'Monthly Analyses';
      case 'competitors': return 'Competitor URLs';
      case 'api_requests': return 'API Requests';
      case 'storage': return 'Storage (MB)';
      default: return type.replace('_', ' ');
    }
  };
  
  // Get badge for request status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };
  
  // Handle opening the detail dialog
  const handleViewDetails = (request: QuotaRequest) => {
    setSelectedRequest(request);
    setCustomLimit(request.requestedLimit);
    setAdminNotes('');
    setIsDialogOpen(true);
  };
  
  // Handle approving or rejecting a request
  const handleProcessRequest = async (approved: boolean) => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    
    try {
      // Call the RPC function to process the request
      const { error } = await supabase.rpc('process_quota_increase_request', {
        p_request_id: selectedRequest.id,
        p_approved: approved,
        p_custom_limit: customLimit
      });
      
      if (error) throw error;
      
      toast({
        title: `Request ${approved ? 'Approved' : 'Rejected'}`,
        description: `The quota increase request has been ${approved ? 'approved' : 'rejected'}.`,
        variant: approved ? 'default' : 'destructive',
      });
      
      // Close the dialog
      setIsDialogOpen(false);
      
      // Update the request in the local state
      // This is a bit hacky since we're not actually updating the props
      window.location.reload();
      
    } catch (err) {
      console.error('Error processing request:', err);
      toast({
        title: 'Error',
        description: 'Failed to process the request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Quota Increase Requests</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search requests..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <CardDescription>
            Review and manage quota increase requests from organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                <Badge variant="outline" className="ml-2">
                  {requests.filter(r => r.status === 'pending').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>
            
            {filteredRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.organizationName}
                        <div className="text-xs text-muted-foreground">
                          by {request.requestedBy}
                        </div>
                      </TableCell>
                      <TableCell>{getRequestTypeName(request.requestType)}</TableCell>
                      <TableCell>
                        {request.requestedLimit}
                        <div className="text-xs text-muted-foreground">
                          from {request.currentLimit}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-muted-foreground">
                  No {activeTab !== 'all' ? activeTab : ''} requests found
                  {searchQuery && ' matching your search criteria'}
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Request details dialog */}
      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quota Increase Request Details</DialogTitle>
              <DialogDescription>
                Review the request details and approve or reject the quota increase
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Organization</h3>
                <p className="text-lg font-semibold">{selectedRequest.organizationName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Requested By</h3>
                <p>{selectedRequest.requestedBy}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Request Type</h3>
                <p>{getRequestTypeName(selectedRequest.requestType)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date Requested</h3>
                <p>{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Limit</h3>
                <p>{selectedRequest.currentLimit}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Requested Limit</h3>
                <p>{selectedRequest.requestedLimit}</p>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Reason for Request</h3>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedRequest.reason || 'No reason provided'}
                </div>
              </div>
              
              {selectedRequest.status !== 'pending' && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reviewed By</h3>
                    <p>{selectedRequest.reviewedBy || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Review Date</h3>
                    <p>{selectedRequest.reviewedAt ? formatDate(selectedRequest.reviewedAt) : 'Unknown'}</p>
                  </div>
                </>
              )}
              
              {selectedRequest.status === 'pending' && (
                <>
                  <div className="col-span-2">
                    <Label htmlFor="custom-limit">Custom Limit</Label>
                    <Input
                      id="custom-limit"
                      type="number"
                      value={customLimit || ''}
                      onChange={(e) => setCustomLimit(parseInt(e.target.value) || null)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can set a custom limit different from what was requested
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="admin-notes">Admin Notes</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Optional notes about this decision"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              {selectedRequest.status === 'pending' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleProcessRequest(false)}
                    disabled={isProcessing}
                  >
                    Reject Request
                  </Button>
                  <Button 
                    onClick={() => handleProcessRequest(true)}
                    disabled={isProcessing}
                  >
                    Approve Request
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 