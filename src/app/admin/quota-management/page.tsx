import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { QuotaRequestList } from '@/components/admin/QuotaRequestList';

export const metadata = {
  title: 'Quota Management - Admin',
  description: 'Manage quota increase requests and organization quotas',
};

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
  const formattedRequests = requests?.map((request: any) => ({
    id: request.id,
    organizationId: request.organization_id,
    organizationName: request.organizations?.name || 'Unknown Organization',
    requestedBy: request.auth?.users_quota_increase_requests_requested_by_fkey?.email || 'Unknown',
    requestType: request.request_type,
    currentLimit: request.current_limit,
    requestedLimit: request.requested_limit,
    reason: request.reason || '',
    status: request.status,
    createdAt: request.created_at,
    reviewedBy: request.auth?.users_quota_increase_requests_reviewed_by_fkey?.email || null,
    reviewedAt: request.reviewed_at || null,
  })) || [];
  
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