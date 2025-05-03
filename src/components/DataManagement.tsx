"use client";

import { useState, useEffect } from "react";
import { useDataManagement } from "@/hooks/useDataManagement";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArchiveIcon, 
  ClockIcon, 
  DatabaseIcon, 
  FileIcon, 
  AlertCircleIcon, 
  InfoIcon, 
  RefreshCwIcon,
  Trash2Icon,
  PlusIcon,
  ClipboardCheckIcon
} from 'lucide-react';

export default function DataManagement() {
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const {
    loading,
    error,
    getArchiveStats,
    archiveOldReports,
    cleanupOldArchives
  } = useDataManagement();
  
  const [stats, setStats] = useState<{
    archived_jobs: number;
    eligible_for_archive: number;
    versioned_jobs: number;
  } | null>(null);
  
  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      const archiveStats = await getArchiveStats();
      if (archiveStats) {
        setStats(archiveStats);
      }
    };
    
    loadStats();
  }, [getArchiveStats, statsRefreshTrigger]);
  
  // Handle archive action
  const handleArchive = async () => {
    try {
      toast.promise(archiveOldReports(), {
        loading: "Archiving old reports...",
        success: (data) => {
          setStatsRefreshTrigger(prev => prev + 1);
          return `Successfully archived ${data?.archived_count || 0} reports`;
        },
        error: "Failed to archive reports",
      });
    } catch (err) {
      console.error("Error archiving reports:", err);
    }
  };
  
  // Handle cleanup action
  const handleCleanup = async () => {
    try {
      toast.promise(cleanupOldArchives(), {
        loading: "Cleaning up old archives...",
        success: (data) => {
          setStatsRefreshTrigger(prev => prev + 1);
          return `Successfully cleaned up ${data?.cleaned_count || 0} archived reports`;
        },
        error: "Failed to clean up archives",
      });
    } catch (err) {
      console.error("Error cleaning up archives:", err);
    }
  };
  
  // Render loading state
  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Loading data management information...</CardDescription>
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
          <div className="flex items-center">
            <DatabaseIcon className="h-5 w-5 mr-2" />
            <span>Data Management</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStatsRefreshTrigger(prev => prev + 1)}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Manage data archiving, cleanup, and versioning
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Maintenance Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    Archived Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.archived_jobs || 0}</div>
                  <p className="text-xs text-gray-500">
                    Total number of archived old reports
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Eligible for Archiving
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.eligible_for_archive || 0}</div>
                  <p className="text-xs text-gray-500">
                    Reports ready to be archived
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileIcon className="h-4 w-4 mr-2" />
                    Versioned Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.versioned_jobs || 0}</div>
                  <p className="text-xs text-gray-500">
                    Reports with multiple versions
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Data Management Policies</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0 mt-0.5">
                    <ClockIcon className="h-3 w-3 mr-1" /> Archiving
                  </Badge>
                  <p className="text-sm">
                    Completed reports older than 90 days are marked for archiving. 
                    After 7 more days, they are moved to the archive table.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shrink-0 mt-0.5">
                    <Trash2Icon className="h-3 w-3 mr-1" /> Cleanup
                  </Badge>
                  <p className="text-sm">
                    Archived reports older than 180 days are permanently deleted from the system.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0 mt-0.5">
                    <PlusIcon className="h-3 w-3 mr-1" /> Versioning
                  </Badge>
                  <p className="text-sm">
                    Reports can have multiple versions. Each new version preserves the original URL and competitor list.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="actions">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    Archive Old Reports
                  </CardTitle>
                  <CardDescription>
                    Move completed reports older than 90 days to the archive storage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    This action will scan for reports that are eligible for archiving 
                    and move them to the archive storage. Reports in the archive are still 
                    accessible, but with slightly slower performance.
                  </p>
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center mr-2">
                            <InfoIcon className="h-4 w-4 text-blue-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Currently there are {stats?.eligible_for_archive || 0} reports 
                            eligible for archiving. Running this action now will process them all.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm">
                      {stats?.eligible_for_archive || 0} reports eligible for archiving
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleArchive} 
                    disabled={loading || (stats?.eligible_for_archive || 0) === 0}
                  >
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    Run Archive Process
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Clean Up Old Archives
                  </CardTitle>
                  <CardDescription>
                    Permanently delete archived reports older than 180 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    This action will permanently delete archived reports that are older than 
                    180 days. This helps maintain database performance and reduces storage costs.
                    <span className="font-medium text-amber-600"> This action cannot be undone.</span>
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    onClick={handleCleanup} 
                    disabled={loading || (stats?.archived_jobs || 0) === 0}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Run Cleanup Process
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <ClipboardCheckIcon className="h-4 w-4 mr-2" />
                    Automation Status
                  </CardTitle>
                  <CardDescription>
                    Current status of automated maintenance tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                          Active
                        </Badge>
                        <span className="text-sm">Daily eligibility check</span>
                      </div>
                      <span className="text-xs text-gray-500">Runs at 1:00 AM</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                          Active
                        </Badge>
                        <span className="text-sm">Weekly archiving</span>
                      </div>
                      <span className="text-xs text-gray-500">Runs at 2:00 AM on Sundays</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                          Active
                        </Badge>
                        <span className="text-sm">Monthly cleanup</span>
                      </div>
                      <span className="text-xs text-gray-500">Runs at 3:00 AM on the 1st of each month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Running maintenance tasks manually may affect system performance temporarily. 
        Consider scheduling these tasks during off-peak hours.
      </CardFooter>
    </Card>
  );
} 