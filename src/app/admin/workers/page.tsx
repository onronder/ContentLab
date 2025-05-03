import React from 'react';
import WorkerHealth from '../../../components/WorkerHealth';

export const metadata = {
  title: 'Worker Health Monitor - Content Roadmap Tool',
  description: 'Monitor worker health and system performance',
};

export default function WorkersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Worker Health Monitor</h1>
      <p className="text-gray-500 mb-6">
        Monitor the health and performance of background processing workers. Track job processing metrics and system status.
      </p>
      
      <WorkerHealth />
    </div>
  );
} 