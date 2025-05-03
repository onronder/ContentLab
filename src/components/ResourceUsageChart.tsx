"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface ResourceMetrics {
  worker_count: number;
  avg_cpu: number | null;
  avg_memory: number | null;
  max_cpu: number | null;
  max_memory: number | null;
}

interface ResourceDataPoint {
  timestamp: string;
  cpu: number | null;
  memory: number | null;
}

export function ResourceUsageChart() {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [historyData, setHistoryData] = useState<ResourceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchResourceMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call the worker-health-check function to get the latest metrics
      const client = createClient();
      const { data, error } = await client.functions.invoke("worker-health-check", {
        method: "POST",
      });
      
      if (error) throw error;
      
      if (data && data.resources) {
        setMetrics(data.resources as ResourceMetrics);
        
        // Generate some mock history data for demonstration
        // In a real implementation, you would fetch this from a database table
        const now = new Date();
        const mockData: ResourceDataPoint[] = [];
        
        for (let i = 0; i < 12; i++) {
          const time = new Date(now);
          time.setHours(time.getHours() - i);
          
          // Generate values that roughly follow the current values with some variation
          const cpuBase = data.resources.avg_cpu || 30;
          const memBase = data.resources.avg_memory || 40;
          
          mockData.unshift({
            timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cpu: Math.max(0, Math.min(100, cpuBase + (Math.random() * 20 - 10))),
            memory: Math.max(0, Math.min(100, memBase + (Math.random() * 20 - 10)))
          });
        }
        
        setHistoryData(mockData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchResourceMetrics();
    
    // Set up polling for resource metrics every 60 seconds
    const intervalId = setInterval(fetchResourceMetrics, 60000);
    
    return () => clearInterval(intervalId);
  }, [fetchResourceMetrics]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>CPU and memory usage across workers</CardDescription>
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
            <AlertTriangle className="mr-2" /> Error Loading Resource Metrics
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
        <CardTitle>Resource Usage</CardTitle>
        <CardDescription>
          {metrics?.worker_count || 0} active worker{metrics?.worker_count !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Timeline</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  name="CPU Usage" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  name="Memory Usage" 
                  stroke="#ef4444" 
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="summary" className="h-[300px]">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-2">CPU Usage</h3>
                <div className="text-4xl font-bold mb-2">
                  {metrics?.avg_cpu !== null ? `${metrics.avg_cpu.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Peak: {metrics?.max_cpu !== null ? `${metrics.max_cpu.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-2">Memory Usage</h3>
                <div className="text-4xl font-bold mb-2">
                  {metrics?.avg_memory !== null ? `${metrics.avg_memory.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Peak: {metrics?.max_memory !== null ? `${metrics.max_memory.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              
              <div className="col-span-2 mt-auto">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={[
                    { name: 'CPU', value: metrics?.avg_cpu || 0, color: '#3b82f6' },
                    { name: 'Memory', value: metrics?.avg_memory || 0, color: '#ef4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
                    <Bar dataKey="value" name="Usage" fill="#8884d8" radius={[4, 4, 0, 0]} 
                      fillOpacity={0.8} barSize={60}>
                      {(metrics?.avg_cpu !== null || metrics?.avg_memory !== null) && [
                        { name: 'CPU', value: metrics?.avg_cpu || 0, fill: '#3b82f6' },
                        { name: 'Memory', value: metrics?.avg_memory || 0, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Bar key={`cell-${index}`} dataKey="value" fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 