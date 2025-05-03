import React from 'react';
import SystemMonitoring from '@/components/SystemMonitoring';

export const metadata = {
  title: 'System Monitoring - Content Roadmap Tool',
  description: 'Monitor system health, performance, and alerts',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>
      <p className="text-gray-500 mb-6">
        Monitor system health, performance metrics, and configure alerts for critical events.
      </p>
      
      <SystemMonitoring />
    </div>
  );
} 