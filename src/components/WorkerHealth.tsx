"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatDistance } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import {
  InfoIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ServerIcon,
} from 'lucide-react';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Worker status type
type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'FAILED';

// Worker interface
interface Worker {
  id: string;
  worker_id: string;
  last_heartbeat: string;
  jobs_processed: number;
  jobs_failed: number;
  status: WorkerStatus;
  metadata?: {
    cpu_usage?: number;
    memory_usage?: number;
    version?: string;
    [key: string]: unknown;
  };
}

// System stats interface
interface SystemStats {
  active_workers: number;
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_processing_time: string | null;
}

// Status badge component
const StatusBadge = ({ status }: { status: WorkerStatus }) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1" /> Active</Badge>;
    case 'INACTIVE':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><InfoIcon className="w-3 h-3 mr-1" /> Inactive</Badge>;
    case 'FAILED':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircleIcon className="w-3 h-3 mr-1" /> Failed</Badge>;
    default:
      return <Badge variant="outline"><InfoIcon className="w-3 h-3 mr-1" /> {status}</Badge>;
  }
};

// Worker Health Dashboard component
export default function WorkerHealth() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Removed unused formatDate function

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  // Load workers from the database
  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all workers
      const { data: workersData, error: workersError } = await supabase
        .from('worker_health')
        .select('*')
        .order('last_heartbeat', { ascending: false });

      if (workersError) throw workersError;

      setWorkers(workersData || []);
    } catch (err: unknown) {
      console.error('Error loading workers:', err);
      setError('Failed to load worker data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load system stats when workers change
  useEffect(() => {
    if (workers.length > 0) {
      const loadSystemStats = async () => {
        try {
          // Get job counts by status
          const { data: jobStats, error: jobStatsError } = await supabase
            .rpc('get_job_stats');
    
          if (jobStatsError) throw jobStatsError;
    
          // Get average processing time
          const { data: avgTimeData, error: avgTimeError } = await supabase
            .rpc('get_avg_processing_time');
    
          if (avgTimeError) throw avgTimeError;
    
          // Count active workers
          const activeWorkers = workers.filter(w => w.status === 'ACTIVE').length;
    
          // Set system stats
          setSystemStats({
            active_workers: activeWorkers,
            total_jobs: jobStats?.total || 0,
            pending_jobs: jobStats?.pending || 0,
            processing_jobs: jobStats?.processing || 0,
            completed_jobs: jobStats?.completed || 0,
            failed_jobs: jobStats?.failed || 0,
            avg_processing_time: avgTimeData?.avg_time || null,
          });
        } catch (err: unknown) {
          console.error('Error loading system stats:', err);
          // Don't set error state here to allow partial UI rendering
        }
      };
      
      loadSystemStats();
    }
  }, [workers]);

  // Check for stale workers and trigger a worker health check
  const checkWorkerHealth = async () => {
    try {
      const { error: healthCheckError } = await supabase.functions.invoke('worker-health-check');
      
      if (healthCheckError) throw healthCheckError;
      
      // Reload workers after health check
      setTimeout(() => {
        loadWorkers();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error checking worker health:', err);
      setError('Failed to check worker health. Please try again.');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadWorkers();

    // Set up real-time subscription for worker health updates
    const subscription = supabase
      .channel('worker_health_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'worker_health' 
      }, () => {
        loadWorkers();
      })
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadWorkers]);

  // Render loading state
  if (loading && workers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Worker Health Monitor</CardTitle>
          <CardDescription>Loading worker data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>Worker Health Monitor</div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={checkWorkerHealth}>
              <ServerIcon className="h-4 w-4 mr-2" />
              Check Health
            </Button>
            <Button variant="outline" size="sm" onClick={loadWorkers}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor the health and performance of background processing workers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* System Stats */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.active_workers} active</div>
                <p className="text-xs text-gray-500">Out of {workers.length} total workers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.total_jobs} total</div>
                <p className="text-xs text-gray-500">
                  {systemStats.pending_jobs} pending, {systemStats.processing_jobs} processing, 
                  {systemStats.completed_jobs} completed, {systemStats.failed_jobs} failed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.avg_processing_time || 'N/A'}</div>
                <p className="text-xs text-gray-500">Average time to process a job</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workers List */}
        <h3 className="text-lg font-medium mb-4">Worker Instances</h3>
        
        {workers.length === 0 ? (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No workers found</AlertTitle>
            <AlertDescription>
              There are no worker instances registered in the system.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map(worker => (
              <Card key={worker.id} className={worker.status === 'ACTIVE' ? 'border-green-200' : worker.status === 'FAILED' ? 'border-red-200' : 'border-yellow-200'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span className="truncate">{worker.worker_id}</span>
                    <StatusBadge status={worker.status} />
                  </CardTitle>
                  <CardDescription>
                    Last seen {formatTimeAgo(worker.last_heartbeat)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Jobs Processed:</div>
                      <div className="font-medium">{worker.jobs_processed}</div>
                      
                      <div>Jobs Failed:</div>
                      <div className="font-medium">{worker.jobs_failed}</div>
                      
                      {worker.metadata?.cpu_usage && (
                        <>
                          <div>CPU Usage:</div>
                          <div className="font-medium">{worker.metadata.cpu_usage}%</div>
                        </>
                      )}
                      
                      {worker.metadata?.memory_usage && (
                        <>
                          <div>Memory Usage:</div>
                          <div className="font-medium">{worker.metadata.memory_usage}MB</div>
                        </>
                      )}
                      
                      {worker.metadata?.version && (
                        <>
                          <div>Version:</div>
                          <div className="font-medium">{worker.metadata.version}</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                  ID: {worker.id.substr(0, 8)}...
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Worker health information is updated in real-time. Last refreshed at {new Date().toLocaleTimeString()}.
      </CardFooter>
    </Card>
  );
} 