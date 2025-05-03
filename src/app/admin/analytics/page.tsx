import React from 'react';
import { UsageAnalytics } from '@/components/admin/UsageAnalytics';

export const metadata = {
  title: 'Usage Analytics - Admin',
  description: 'View detailed usage analytics and metrics',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
        <p className="text-muted-foreground">
          Monitor usage patterns and analyze business metrics
        </p>
      </div>
      
      <UsageAnalytics />
    </div>
  );
} 