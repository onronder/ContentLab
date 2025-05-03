'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, RefreshCw, Settings } from 'lucide-react';

type ConnectionPoolStats = {
  database_name: string;
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  waiting_clients: number;
  connection_max_age: string;
};

type HistoricalStats = ConnectionPoolStats & {
  recorded_at: string;
};

type ExtensionStatus = {
  pgCron: boolean;
  pgBouncer: boolean;
};

type PoolData = {
  current: ConnectionPoolStats;
  history: HistoricalStats[];
  extensions: ExtensionStatus;
  timestamp: string;
};

type ApiResponse = {
  error?: string;
  success?: boolean;
  message?: string;
};

export default function ConnectionPoolManager() {
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({ 
    pgCron: false, 
    pgBouncer: false 
  });

  // Fetch connection pool data
  const fetchPoolData = async (hours: number = 24) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/db-pool?hours=${hours}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching connection pool data: ${response.statusText}`);
      }
      
      const data = await response.json() as PoolData;
      setPoolData(data);

      // Check for extension availability
      if (data.extensions) {
        setExtensionStatus({
          pgCron: !!data.extensions.pgCron,
          pgBouncer: !!data.extensions.pgBouncer
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching connection pool data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset connection pool
  const resetPool = async () => {
    setIsLoading(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/admin/db-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      const result = await response.json() as ApiResponse;
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset connection pool');
      }
      
      setActionMessage({ 
        type: 'success', 
        text: 'Connection pool reset successfully. Idle connections have been terminated.' 
      });
      
      // Refresh data after reset
      fetchPoolData(parseInt(timeRange.replace('h', '')));
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'An unknown error occurred' 
      });
      console.error('Error resetting connection pool:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Configure connection pool
  const configurePool = async () => {
    setIsLoading(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/admin/db-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'configure' }),
      });
      
      const result = await response.json() as ApiResponse;
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to configure connection pool');
      }
      
      setActionMessage({ 
        type: 'success', 
        text: 'Connection pool configured successfully with optimal settings.' 
      });
      
      // Refresh data after configuration
      fetchPoolData(parseInt(timeRange.replace('h', '')));
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'An unknown error occurred' 
      });
      console.error('Error configuring connection pool:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    fetchPoolData(parseInt(range.replace('h', '')));
  };

  // Format history data for chart
  const formatChartData = () => {
    if (!poolData?.history) return [];
    
    return poolData.history.map(item => ({
      ...item,
      recorded_at: new Date(item.recorded_at).toLocaleTimeString(),
      connection_max_age: typeof item.connection_max_age === 'string' 
        ? parseInt(item.connection_max_age.split(':')[0]) || 0
        : 0
    }));
  };

  // Initial data fetch
  useEffect(() => {
    fetchPoolData(24);
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchPoolData(parseInt(timeRange.replace('h', '')));
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [timeRange, fetchPoolData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Database Connection Pool</h2>
        <Button 
          variant="outline" 
          onClick={() => fetchPoolData(parseInt(timeRange.replace('h', '')))}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!extensionStatus.pgCron && poolData && (
        <Alert>
          <AlertTitle>Extension Missing</AlertTitle>
          <AlertDescription>
            The pg_cron extension is not enabled. Scheduled database maintenance tasks will not run automatically.
            You may need to request this extension from your database administrator.
          </AlertDescription>
        </Alert>
      )}
      
      {actionMessage && (
        <Alert variant={actionMessage.type === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{actionMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{actionMessage.text}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Pool Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pool Status</CardTitle>
            <CardDescription>
              Real-time database connection pool metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !poolData ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : poolData?.current ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Total Connections</span>
                    <span className="text-2xl font-bold">{poolData.current.total_connections}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Active Connections</span>
                    <span className="text-2xl font-bold">{poolData.current.active_connections}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Idle Connections</span>
                    <span className="text-2xl font-bold">{poolData.current.idle_connections}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">Waiting Clients</span>
                    <span className="text-2xl font-bold">{poolData.current.waiting_clients}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Oldest Connection Age</span>
                  <span className="text-xl font-semibold block">
                    {poolData.current.connection_max_age}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Last updated: {new Date(poolData.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetPool}
              disabled={isLoading}
            >
              Reset Pool
            </Button>
            <Button 
              onClick={configurePool}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Pool
            </Button>
          </CardFooter>
        </Card>
        
        {/* Historical Data */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Pool Metrics</CardTitle>
            <CardDescription>
              Connection pool trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="24h" value={timeRange} onValueChange={handleTimeRangeChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="3h">3 Hours</TabsTrigger>
                <TabsTrigger value="12h">12 Hours</TabsTrigger>
                <TabsTrigger value="24h">24 Hours</TabsTrigger>
                <TabsTrigger value="72h">3 Days</TabsTrigger>
              </TabsList>
              
              <TabsContent value={timeRange}>
                {isLoading && !poolData ? (
                  <div className="flex justify-center items-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : poolData?.history && poolData.history.length > 0 ? (
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="recorded_at" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_connections" fill="#8884d8" name="Total" />
                        <Bar dataKey="active_connections" fill="#82ca9d" name="Active" />
                        <Bar dataKey="idle_connections" fill="#ffc658" name="Idle" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center h-60 flex items-center justify-center">
                    No historical data available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 