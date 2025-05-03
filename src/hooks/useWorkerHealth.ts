import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkerStatus = "ACTIVE" | "INACTIVE" | "FAILED";

export interface WorkerStats {
  total: number;
  active: number;
  inactive: number;
  failed: number;
}

export interface WorkerDetail {
  id: string;
  worker_id: string;
  status: WorkerStatus;
  last_heartbeat: string;
  uptime_hours: number;
  jobs_processed: number;
  jobs_failed: number;
  cpu_usage: number | null;
  memory_usage: number | null;
  first_seen: string;
}

export interface WorkerHistoryPoint {
  day: string;
  active_count: number;
  inactive_count: number;
  failed_count: number;
}

export function useWorkerStats() {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_worker_stats");

      if (error) throw error;
      
      setStats(data as WorkerStats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useWorkerDetails() {
  const [workers, setWorkers] = useState<WorkerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_worker_details");

      if (error) throw error;
      
      setWorkers(data as WorkerDetail[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return { workers, loading, error, refetch: fetchWorkers };
}

export function useWorkerHistory(days = 7) {
  const [history, setHistory] = useState<WorkerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_worker_health_history", {
        p_days: days
      });

      if (error) throw error;
      
      setHistory(data as WorkerHistoryPoint[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

export function triggerWorkerHealthCheck() {
  return createClient().functions.invoke("worker-health-check", {
    method: "POST",
  });
} 