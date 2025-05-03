"use client";

import { useState, useEffect } from "react";
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ActivityIcon, 
  AlertTriangleIcon, 
  BarChart4Icon, 
  BellIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CpuIcon, 
  DatabaseIcon, 
  HardDriveIcon, 
  HeartPulseIcon, 
  LineChartIcon, 
  MailIcon, 
  RefreshCwIcon, 
  ServerIcon, 
  SettingsIcon,
  WebhookIcon,
  XCircleIcon
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function SystemMonitoring() {
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [alertsRefreshTrigger, setAlertsRefreshTrigger] = useState(0);
  const {
    loading,
    error,
    systemMetrics,
    alertConfig,
    getSystemMetrics,
    getAlertConfig,
    updateAlertConfig,
    checkFailedJobs,
    checkSystemPerformance
  } = useSystemMonitoring();
  
  // Load system metrics
  useEffect(() => {
    const loadMetrics = async () => {
      await getSystemMetrics(timeRange);
    };
    
    loadMetrics();
    const intervalId = setInterval(loadMetrics, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [getSystemMetrics, timeRange]);
  
  // Load alert configuration
  useEffect(() => {
    const loadAlertConfig = async () => {
      await getAlertConfig();
    };
    
    loadAlertConfig();
  }, [getAlertConfig, alertsRefreshTrigger]);
  
  // Format date for display in charts
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (timeRange) {
      case '1h':
      case '6h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return `${date.getHours()}:00`;
      case '7d':
        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
      default:
        return date.toLocaleTimeString();
    }
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (!systemMetrics) return [];
    
    return systemMetrics.timestamps.map((timestamp, index) => ({
      time: formatDate(timestamp),
      cpu: Math.round(systemMetrics.cpu_usage[index] * 100) / 100,
      memory: Math.round(systemMetrics.memory_usage[index] * 100) / 100
    }));
  };
  
  // Handle time range selection
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  // Handle checking for alerts
  const handleCheckAlerts = async () => {
    try {
      toast.promise(Promise.all([checkFailedJobs(), checkSystemPerformance()]), {
        loading: "Checking for system issues...",
        success: (results) => {
          const [jobResult, perfResult] = results;
          
          if ((jobResult?.detected && jobResult.count! > 0) || 
              (perfResult?.status === 'issues_detected')) {
            return "Alerts have been sent for detected issues";
          }
          
          return "No issues detected";
        },
        error: "Failed to check for issues",
      });
      
      setAlertsRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error checking alerts:", err);
    }
  };

  // Handle alert config changes
  const handleConfigChange = async (changes: Record<string, unknown>) => {
    try {
      const success = await updateAlertConfig(changes);
      
      if (success) {
        toast.success("Alert configuration updated");
      } else {
        toast.error("Failed to update configuration");
      }
    } catch (err) {
      console.error("Error updating alert config:", err);
      toast.error("Failed to update configuration");
    }
  };
  
  // Render loading state
  if (loading && !systemMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Monitoring</CardTitle>
          <CardDescription>Loading system metrics...</CardDescription>
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
            <HeartPulseIcon className="h-5 w-5 mr-2" />
            <span>System Monitoring & Alerting</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => getSystemMetrics(timeRange)}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor system health, performance metrics, and job status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ServerIcon className="h-4 w-4 mr-2" />
                    Worker Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-baseline">
                    <span>{systemMetrics?.worker_count.healthy || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">/ {systemMetrics?.worker_count.total || 0}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    {(systemMetrics?.worker_count.healthy || 0) === (systemMetrics?.worker_count.total || 0) ? (
                      <div className="flex items-center text-green-500 text-xs">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        All workers healthy
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-500 text-xs">
                        <AlertTriangleIcon className="h-3 w-3 mr-1" />
                        {systemMetrics?.worker_count.unhealthy || 0} unhealthy workers
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ActivityIcon className="h-4 w-4 mr-2" />
                    Current Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xl font-bold">{systemMetrics?.active_jobs || 0}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{systemMetrics?.pending_jobs || 0}</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Avg. Processing Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics?.avg_completion_time 
                      ? Math.round(systemMetrics.avg_completion_time * 10) / 10
                      : 0}
                    <span className="text-sm ml-1">min</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Based on jobs from the last 7 days
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart4Icon className="h-4 w-4 mr-2" />
                    Job Completion (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-green-500">
                        {systemMetrics?.completed_jobs_24h || 0}
                      </div>
                      <div className="text-xs">Completed</div>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-red-500">
                        {systemMetrics?.failed_jobs_24h || 0}
                      </div>
                      <div className="text-xs">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CpuIcon className="h-4 w-4 mr-2" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">CPU</span>
                        <span className="text-xs font-medium">
                          {systemMetrics?.cpu_usage.length 
                            ? Math.round(systemMetrics.cpu_usage[systemMetrics.cpu_usage.length - 1] * 10) / 10
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ 
                            width: `${systemMetrics?.cpu_usage.length 
                              ? Math.min(100, systemMetrics.cpu_usage[systemMetrics.cpu_usage.length - 1]) 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">Memory</span>
                        <span className="text-xs font-medium">
                          {systemMetrics?.memory_usage.length 
                            ? Math.round(systemMetrics.memory_usage[systemMetrics.memory_usage.length - 1] * 10) / 10
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-purple-600 h-1.5 rounded-full" 
                          style={{ 
                            width: `${systemMetrics?.memory_usage.length 
                              ? Math.min(100, systemMetrics.memory_usage[systemMetrics.memory_usage.length - 1]) 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end mb-2">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTimeRangeChange('1h')}
                  className={timeRange === '1h' ? 'bg-muted' : ''}
                >
                  1h
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTimeRangeChange('6h')}
                  className={timeRange === '6h' ? 'bg-muted' : ''}
                >
                  6h
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTimeRangeChange('24h')}
                  className={timeRange === '24h' ? 'bg-muted' : ''}
                >
                  24h
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTimeRangeChange('7d')}
                  className={timeRange === '7d' ? 'bg-muted' : ''}
                >
                  7d
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Resource Usage Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                        label={{ 
                          value: '%', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <RechartsTooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        name="CPU Usage" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memory" 
                        name="Memory Usage" 
                        stroke="#9333ea" 
                        strokeWidth={2} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">System Health Metrics</h3>
              <p className="text-sm text-gray-500 mb-4">
                Overview of system performance and processing efficiency
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <HardDriveIcon className="h-4 w-4 mr-2" />
                      Worker Load
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-3xl font-bold">
                      {systemMetrics && systemMetrics.worker_count.total
                        ? (systemMetrics.active_jobs / systemMetrics.worker_count.total).toFixed(1)
                        : '0.0'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Jobs per worker (active)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Queue Depth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-3xl font-bold">
                      {systemMetrics?.pending_jobs || 0}
                    </div>
                    <p className="text-xs text-gray-500">
                      Jobs waiting in queue
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-3xl font-bold">
                      {systemMetrics && 
                       (systemMetrics.completed_jobs_24h + systemMetrics.failed_jobs_24h) > 0
                        ? (systemMetrics.completed_jobs_24h / 
                           (systemMetrics.completed_jobs_24h + systemMetrics.failed_jobs_24h) * 100).toFixed(1)
                        : '100.0'}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Last 24 hours
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Error Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-3xl font-bold">
                      {systemMetrics && 
                       (systemMetrics.completed_jobs_24h + systemMetrics.failed_jobs_24h) > 0
                        ? (systemMetrics.failed_jobs_24h / 
                           (systemMetrics.completed_jobs_24h + systemMetrics.failed_jobs_24h) * 100).toFixed(1)
                        : '0.0'}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Last 24 hours
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">System Health Check</CardTitle>
                <CardDescription>
                  Verify system performance and check for potential issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCheckAlerts}>
                  <ActivityIcon className="h-4 w-4 mr-2" />
                  Run Health Check
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Alert Configuration</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure alert preferences for system issues and job failures
              </p>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Alert Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MailIcon className="h-4 w-4" />
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                      </div>
                      <Switch 
                        id="email-alerts" 
                        checked={alertConfig?.email_alerts_enabled || false}
                        onCheckedChange={(checked) => 
                          handleConfigChange({ email_alerts_enabled: checked })
                        }
                      />
                    </div>
                    
                    {alertConfig?.email_alerts_enabled && (
                      <div className="pl-6">
                        <Label htmlFor="admin-email" className="text-xs mb-1 block">
                          Admin Email
                        </Label>
                        <Input 
                          id="admin-email" 
                          value={alertConfig?.admin_email || ''} 
                          onChange={(e) => 
                            handleConfigChange({ admin_email: e.target.value })
                          }
                          placeholder="admin@example.com"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <WebhookIcon className="h-4 w-4" />
                        <Label htmlFor="webhook-alerts">Webhook Alerts</Label>
                      </div>
                      <Switch 
                        id="webhook-alerts" 
                        checked={alertConfig?.webhook_alerts_enabled || false}
                        onCheckedChange={(checked) => 
                          handleConfigChange({ webhook_alerts_enabled: checked })
                        }
                      />
                    </div>
                    
                    {alertConfig?.webhook_alerts_enabled && (
                      <div className="pl-6">
                        <Label htmlFor="webhook-url" className="text-xs mb-1 block">
                          Webhook URL
                        </Label>
                        <Input 
                          id="webhook-url" 
                          value={alertConfig?.webhook_url || ''} 
                          onChange={(e) => 
                            handleConfigChange({ webhook_url: e.target.value })
                          }
                          placeholder="https://example.com/webhook"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="alert-frequency" className="mb-1 block">
                        Alert Frequency (minutes)
                      </Label>
                      <Input 
                        id="alert-frequency" 
                        type="number"
                        min={5}
                        max={1440}
                        value={alertConfig?.alert_frequency || 60} 
                        onChange={(e) => 
                          handleConfigChange({ 
                            alert_frequency: parseInt(e.target.value) || 60 
                          })
                        }
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cpu-threshold" className="text-xs mb-1 block">
                          CPU Threshold (%)
                        </Label>
                        <Input 
                          id="cpu-threshold" 
                          type="number"
                          min={50}
                          max={95}
                          value={alertConfig?.cpu_threshold || 80} 
                          onChange={(e) => 
                            handleConfigChange({ 
                              cpu_threshold: parseInt(e.target.value) || 80 
                            })
                          }
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="memory-threshold" className="text-xs mb-1 block">
                          Memory Threshold (%)
                        </Label>
                        <Input 
                          id="memory-threshold" 
                          type="number"
                          min={50}
                          max={95}
                          value={alertConfig?.memory_threshold || 80} 
                          onChange={(e) => 
                            handleConfigChange({ 
                              memory_threshold: parseInt(e.target.value) || 80 
                            })
                          }
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="job-threshold" className="text-xs mb-1 block">
                          Job Pending Threshold (min)
                        </Label>
                        <Input 
                          id="job-threshold" 
                          type="number"
                          min={5}
                          max={120}
                          value={alertConfig?.job_pending_threshold || 15} 
                          onChange={(e) => 
                            handleConfigChange({ 
                              job_pending_threshold: parseInt(e.target.value) || 15 
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCheckAlerts}>
                    <BellIcon className="h-4 w-4 mr-2" />
                    Test Alerts
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        System metrics are refreshed automatically every minute. 
        Last update: {new Date().toLocaleString()}
      </CardFooter>
    </Card>
  );
} 