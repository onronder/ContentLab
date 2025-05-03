"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface SystemMetrics {
  cpu_usage: number[];
  memory_usage: number[];
  pending_jobs: number;
  active_jobs: number;
  completed_jobs_24h: number;
  failed_jobs_24h: number;
  avg_completion_time: number;
  worker_count: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  timestamps: string[];
}

interface AlertConfig {
  email_alerts_enabled: boolean;
  webhook_alerts_enabled: boolean;
  admin_email: string;
  webhook_url: string;
  alert_frequency: number;
  cpu_threshold: number;
  memory_threshold: number;
  job_pending_threshold: number;
}

interface AlertCheckResult {
  timestamp: string;
  action: string;
  status?: string;
  detected?: boolean;
  count?: number;
  message?: string;
  email_sent?: boolean;
  webhook_sent?: boolean;
  unhealthy_workers?: number;
  stuck_jobs?: number;
  high_resource_workers?: number;
}

/**
 * Hook for system monitoring and alerts
 */
export function useSystemMonitoring() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // Helper function to get the start time based on time range
  const getTimeRangeStart = (timeRange: string): string => {
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000); // Default to 1 hour
    }
    
    return startTime.toISOString();
  };

  // Helper function to determine appropriate bucket size for the time range
  const getBucketSize = (timeRange: string): number => {
    switch (timeRange) {
      case '1h': return 5 * 60 * 1000; // 5 minutes
      case '6h': return 15 * 60 * 1000; // 15 minutes
      case '24h': return 60 * 60 * 1000; // 1 hour
      case '7d': return 6 * 60 * 60 * 1000; // 6 hours
      default: return 5 * 60 * 1000; // Default to 5 minutes
    }
  };

  // Helper function to get bucket key for a timestamp
  const getBucketKey = (timestamp: Date, bucketSize: number): string => {
    const bucketTimestamp = Math.floor(timestamp.getTime() / bucketSize) * bucketSize;
    return new Date(bucketTimestamp).toISOString();
  };

  // Process the raw data into a format suitable for the UI
  const processMetricsData = useCallback((workerHealthData: Record<string, any>[], jobStats: Record<string, any>, timeRange: string): SystemMetrics => {
    // Group data by timestamp buckets appropriate for the time range
    const bucketSize = getBucketSize(timeRange);
    const buckets: Record<string, { cpu: number[], memory: number[] }> = {};
    const workerStatus: Record<string, string> = {};
    
    // Process worker health data
    workerHealthData.forEach(record => {
      const timestamp = new Date(record.recorded_at);
      const bucketKey = getBucketKey(timestamp, bucketSize);
      
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { cpu: [], memory: [] };
      }
      
      buckets[bucketKey].cpu.push(record.cpu_usage);
      buckets[bucketKey].memory.push(record.memory_usage);
      
      // Keep track of latest worker status
      workerStatus[record.worker_id] = record.status;
    });
    
    // Convert buckets to arrays for charting
    const timestamps = Object.keys(buckets).sort();
    const cpuData = timestamps.map(t => {
      const values = buckets[t].cpu;
      return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    const memoryData = timestamps.map(t => {
      const values = buckets[t].memory;
      return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    // Count worker health status
    const healthyCounts = Object.values(workerStatus).filter(status => status === 'HEALTHY').length;
    
    return {
      cpu_usage: cpuData,
      memory_usage: memoryData,
      pending_jobs: jobStats?.pending_jobs || 0,
      active_jobs: jobStats?.active_jobs || 0,
      completed_jobs_24h: jobStats?.completed_jobs_24h || 0,
      failed_jobs_24h: jobStats?.failed_jobs_24h || 0,
      avg_completion_time: jobStats?.avg_completion_time || 0,
      worker_count: {
        total: Object.keys(workerStatus).length,
        healthy: healthyCounts,
        unhealthy: Object.keys(workerStatus).length - healthyCounts
      },
      timestamps
    };
  }, [getBucketSize, getBucketKey]);

  // Get system performance metrics
  const getSystemMetrics = useCallback(async (timeRange: string = '1h'): Promise<SystemMetrics | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Get worker health data for the specified time range
      const { data: workerHealthData, error: healthError } = await supabase
        .from('worker_status_history')
        .select('worker_id, status, cpu_usage, memory_usage, recorded_at')
        .order('recorded_at', { ascending: true })
        .gte('recorded_at', getTimeRangeStart(timeRange));
      
      if (healthError) throw healthError;
      
      // Get job statistics
      const { data: jobStats, error: jobError } = await supabase.rpc('get_job_statistics');
      
      if (jobError) throw jobError;
      
      // Process the data
      const metrics = processMetricsData(workerHealthData, jobStats, timeRange);
      setSystemMetrics(metrics);
      
      return metrics;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [processMetricsData, getTimeRangeStart]);

  // Get alert configuration
  const getAlertConfig = useCallback(async (): Promise<AlertConfig | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("job-alerts", {
        method: "GET"
      });
      
      if (error) throw error;
      
      setAlertConfig(data as AlertConfig);
      return data as AlertConfig;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update alert configuration
  const updateAlertConfig = useCallback(async (config: Partial<AlertConfig>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, you would have an endpoint to update configuration
      // For now, we'll just update the local state to simulate this
      setAlertConfig(prev => prev ? { ...prev, ...config } : null);
      
      // Mock successful update
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for failed jobs and send alerts if needed
  const checkFailedJobs = useCallback(async (): Promise<AlertCheckResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("job-alerts", {
        method: "POST",
        body: { action: "check_jobs" }
      });
      
      if (error) throw error;
      
      return data as AlertCheckResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check system performance metrics and send alerts if needed
  const checkSystemPerformance = useCallback(async (): Promise<AlertCheckResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("job-alerts", {
        method: "POST",
        body: { action: "check_performance" }
      });
      
      if (error) throw error;
      
      return data as AlertCheckResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    systemMetrics,
    alertConfig,
    getSystemMetrics,
    getAlertConfig,
    updateAlertConfig,
    checkFailedJobs,
    checkSystemPerformance
  };
} 