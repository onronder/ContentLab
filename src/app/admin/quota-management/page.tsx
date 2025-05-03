import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { QuotaRequestList } from '@/components/admin/QuotaRequestList';

export const metadata = {
  title: 'Quota Management - Admin',
  description: 'Manage quota increase requests and organization quotas',
};

// Define the expected quota request format for components
interface FormattedQuotaRequest {
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

export default async function QuotaManagementPage() {
  const supabase = createServerSupabaseClient();
  
  // Fetch all quota increase requests
  const { data: requests, error } = await supabase
    .from('quota_increase_requests')
    .select(`
      id, 
      organization_id,
      organizations (name),
      requested_by,
      auth.users!quota_increase_requests_requested_by_fkey (email),
      request_type, 
      current_limit, 
      requested_limit, 
      reason, 
      status, 
      created_at,
      reviewed_by,
      auth.users!quota_increase_requests_reviewed_by_fkey (email),
      reviewed_at
    `)
    .order('created_at', { ascending: false });
  
  // Format the data for easier consumption by components
  const formattedRequests: FormattedQuotaRequest[] = [];
  
  if (requests) {
    for (const request of requests) {
      // Type safety with manual property access
      const item = request as Record<string, any>;
      const organizations = item.organizations as Record<string, any> | null;
      const auth = item.auth as Record<string, any> | null;
      
      formattedRequests.push({
        id: String(item.id || ''),
        organizationId: String(item.organization_id || ''),
        organizationName: organizations?.name ? String(organizations.name) : 'Unknown Organization',
        requestedBy: auth?.users_quota_increase_requests_requested_by_fkey?.email 
          ? String(auth.users_quota_increase_requests_requested_by_fkey.email)
          : 'Unknown',
        requestType: String(item.request_type || ''),
        currentLimit: Number(item.current_limit || 0),
        requestedLimit: Number(item.requested_limit || 0),
        reason: String(item.reason || ''),
        status: String(item.status || ''),
        createdAt: String(item.created_at || ''),
        reviewedBy: auth?.users_quota_increase_requests_reviewed_by_fkey?.email 
          ? String(auth.users_quota_increase_requests_reviewed_by_fkey.email)
          : null,
        reviewedAt: item.reviewed_at ? String(item.reviewed_at) : null,
      });
    }
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quota Management</h1>
          <p className="text-muted-foreground">
            Review and manage quota increase requests from organizations
          </p>
        </div>
      </div>
      
      {error ? (
        <div className="rounded-md bg-destructive/15 p-4">
          <div className="text-sm text-destructive">
            Error loading quota requests: {error.message}
          </div>
        </div>
      ) : (
        <QuotaRequestList requests={formattedRequests} />
      )}
    </div>
  );
} 