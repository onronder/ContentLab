import React from 'react';
import JobMonitor from '../../components/JobMonitor';

export const metadata = {
  title: 'Job Monitor - Content Roadmap Tool',
  description: 'Monitor and manage your content analysis jobs',
};

export default function JobsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Job Monitor</h1>
      <p className="text-gray-500 mb-6">
        Track the status of your content analysis jobs and view results.
      </p>
      
      <JobMonitor />
    </div>
  );
} 