"use client";

import { Suspense } from "react";
import { useWorkerStats, useWorkerDetails, useWorkerHistory, triggerWorkerHealthCheck } from "@/hooks/useWorkerHealth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ResourceUsageChart } from "@/components/ResourceUsageChart";

function formatUptime(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  
  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${remainingHours}h`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500";
    case "INACTIVE":
      return "bg-yellow-500";
    case "FAILED":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  
  return (
    <Badge className={color}>
      {status}
    </Badge>
  );
}

function WorkerStatsCards() {
  const { stats, loading, error, refetch } = useWorkerStats();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="mb-8 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center">
            <AlertTriangle className="mr-2" /> Error Loading Worker Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700">
          {error.message}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-600">Active Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Inactive Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-600">Failed Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkerDetailsTable() {
  const { workers, loading, error, refetch } = useWorkerDetails();
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
          <CardDescription>List of all registered workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mb-8 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center">
            <AlertTriangle className="mr-2" /> Error Loading Worker Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700">
          {error.message}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Worker Details</CardTitle>
            <CardDescription>List of all registered workers</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Last Heartbeat</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Uptime</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jobs Processed</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jobs Failed</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CPU</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Memory</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-12 px-4 text-center text-muted-foreground">
                      No workers registered
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="border-b">
                      <td className="p-4 align-middle font-mono text-xs">{worker.worker_id}</td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="p-4 align-middle">
                        {formatDistanceToNow(new Date(worker.last_heartbeat), { addSuffix: true })}
                      </td>
                      <td className="p-4 align-middle">{formatUptime(worker.uptime_hours)}</td>
                      <td className="p-4 align-middle">{worker.jobs_processed}</td>
                      <td className="p-4 align-middle">{worker.jobs_failed}</td>
                      <td className="p-4 align-middle">
                        {worker.cpu_usage !== null ? `${worker.cpu_usage.toFixed(1)}%` : "N/A"}
                      </td>
                      <td className="p-4 align-middle">
                        {worker.memory_usage !== null ? `${worker.memory_usage.toFixed(1)}%` : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkerTimelineChart() {
  const { history, loading, error } = useWorkerHistory();
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worker Health Timeline</CardTitle>
          <CardDescription>7-day history of worker status</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mb-8 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center">
            <AlertTriangle className="mr-2" /> Error Loading Worker History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700">
          {error.message}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Health Timeline</CardTitle>
        <CardDescription>7-day history of worker status</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="active_count" stackId="1" stroke="#10b981" fill="#10b981" name="Active" />
            <Area type="monotone" dataKey="inactive_count" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Inactive" />
            <Area type="monotone" dataKey="failed_count" stackId="1" stroke="#ef4444" fill="#ef4444" name="Failed" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function WorkerHealthDashboard() {
  const runHealthCheck = async () => {
    const healthCheckPromise = triggerWorkerHealthCheck();
    
    toast.promise(healthCheckPromise, {
      loading: "Running worker health check...",
      success: "Health check completed successfully",
      error: "Failed to run health check",
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Worker Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage worker instances</p>
        </div>
        <Button onClick={runHealthCheck}>
          <RefreshCw className="mr-2 h-4 w-4" /> Run Health Check
        </Button>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <WorkerStatsCards />
      </Suspense>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<div>Loading...</div>}>
          <WorkerTimelineChart />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <ResourceUsageChart />
        </Suspense>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Suspense fallback={<div>Loading...</div>}>
          <WorkerDetailsTable />
        </Suspense>
      </div>
    </div>
  );
} 