"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ArchiveStats {
  archived_jobs: number;
  eligible_for_archive: number;
  versioned_jobs: number;
}

interface ArchiveResult {
  archived_count: number;
  success: boolean;
}

interface CleanupResult {
  cleaned_count: number;
  success: boolean;
}

interface VersionResult {
  original_job_id: string;
  new_job_id: string;
  success: boolean;
}

/**
 * Hook for managing data archiving, cleanup, and versioning.
 */
export function useDataManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get archive statistics
  const getArchiveStats = useCallback(async (): Promise<ArchiveStats | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("data-management", {
        method: "GET",
      });
      
      if (error) throw error;
      
      return data as ArchiveStats;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger archiving process
  const archiveOldReports = useCallback(async (): Promise<ArchiveResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("data-management", {
        method: "POST",
        body: { action: "archive" }
      });
      
      if (error) throw error;
      
      return data as ArchiveResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clean up old archives
  const cleanupOldArchives = useCallback(async (): Promise<CleanupResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("data-management", {
        method: "POST",
        body: { action: "cleanup" }
      });
      
      if (error) throw error;
      
      return data as CleanupResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new version of an analysis
  const createNewVersion = useCallback(async (jobId: string): Promise<VersionResult | null> => {
    try {
      if (!jobId) throw new Error("Job ID is required");
      
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("data-management", {
        method: "POST",
        body: { 
          action: "create_version",
          job_id: jobId
        }
      });
      
      if (error) throw error;
      
      return data as VersionResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get versions of a report
  const getReportVersions = useCallback(async (url: string) => {
    try {
      if (!url) throw new Error("URL is required");
      
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_analysis_versions", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_url: url
      });
      
      if (error) throw error;
      
      return data;
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
    getArchiveStats,
    archiveOldReports,
    cleanupOldArchives,
    createNewVersion,
    getReportVersions
  };
} 