import { Metadata } from 'next';
import ConnectionPoolManager from './ConnectionPoolManager';

export const metadata: Metadata = {
  title: 'Database Management',
  description: 'Monitor and manage database connection pooling'
};

export default async function DatabaseManagementPage() {
  return (
    <div className="p-6">
      <ConnectionPoolManager />
    </div>
  );
} 