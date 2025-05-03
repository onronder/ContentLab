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

// Define types for nested response structures
interface RequestUser {
  email: string | null;
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
    // Handle each request safely with appropriate type checks
    requests.forEach((request) => {
      try {
        // Safely extract properties with type checking
        const id = typeof request.id === 'string' ? request.id : '';
        const organization_id = typeof request.organization_id === 'string' ? request.organization_id : '';
        const request_type = typeof request.request_type === 'string' ? request.request_type : '';
        const current_limit = typeof request.current_limit === 'number' ? request.current_limit : 0;
        const requested_limit = typeof request.requested_limit === 'number' ? request.requested_limit : 0;
        const reason = typeof request.reason === 'string' ? request.reason : '';
        const status = typeof request.status === 'string' ? request.status : '';
        const created_at = typeof request.created_at === 'string' ? request.created_at : '';
        const reviewed_at = typeof request.reviewed_at === 'string' ? request.reviewed_at : null;
        
        // Extract nested properties safely
        let organizationName = 'Unknown Organization';
        if (request.organizations && typeof request.organizations === 'object' && request.organizations !== null) {
          const org = request.organizations;
          if ('name' in org && typeof org.name === 'string') {
            organizationName = org.name;
          }
        }
        
        // Extract requested_by email
        let requestedBy = 'Unknown';
        if (request.auth && typeof request.auth === 'object' && request.auth !== null) {
          const auth = request.auth;
          if ('users_quota_increase_requests_requested_by_fkey' in auth && 
              auth.users_quota_increase_requests_requested_by_fkey && 
              typeof auth.users_quota_increase_requests_requested_by_fkey === 'object' && 
              auth.users_quota_increase_requests_requested_by_fkey !== null) {
            const user = auth.users_quota_increase_requests_requested_by_fkey;
            if ('email' in user && typeof user.email === 'string') {
              requestedBy = user.email;
            }
          }
        }
        
        // Extract reviewed_by email
        let reviewedBy = null;
        if (request.auth && typeof request.auth === 'object' && request.auth !== null) {
          const auth = request.auth;
          if ('users_quota_increase_requests_reviewed_by_fkey' in auth && 
              auth.users_quota_increase_requests_reviewed_by_fkey && 
              typeof auth.users_quota_increase_requests_reviewed_by_fkey === 'object' && 
              auth.users_quota_increase_requests_reviewed_by_fkey !== null) {
            const reviewer = auth.users_quota_increase_requests_reviewed_by_fkey;
            if ('email' in reviewer && typeof reviewer.email === 'string') {
              reviewedBy = reviewer.email;
            }
          }
        }
        
        // Add formatted request to the array
        formattedRequests.push({
          id,
          organizationId: organization_id,
          organizationName,
          requestedBy,
          requestType: request_type,
          currentLimit: current_limit,
          requestedLimit: requested_limit,
          reason: reason || '',
          status,
          createdAt: created_at,
          reviewedBy,
          reviewedAt: reviewed_at,
        });
      } catch (err) {
        console.error('Error processing quota request:', err);
        // Continue to next request if there's an error
      }
    });
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