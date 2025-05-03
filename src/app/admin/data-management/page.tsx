import React from 'react';
import DataManagement from '@/components/DataManagement';

export const metadata = {
  title: 'Data Management - Content Roadmap Tool',
  description: 'Manage data archiving, cleanup, and versioning',
};

export default function DataManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Data Management</h1>
      <p className="text-gray-500 mb-6">
        Manage data archiving, cleanup, and versioning to maintain database performance and organize your analysis reports.
      </p>
      
      <DataManagement />
    </div>
  );
} 