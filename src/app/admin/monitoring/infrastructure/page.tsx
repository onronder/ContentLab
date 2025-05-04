import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Globe,
  RefreshCw,
  Server,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'Infrastructure Monitoring - Admin',
  description: 'Monitor infrastructure scaling and performance',
};

// Main dashboard component
export default async function InfrastructureMonitoringPage() {
  const supabase = createServerSupabaseClient();
  
  // Fetch region status
  const { data: regionData, error: _regionError } = await supabase
    .from('region_status')
    .select('*')
    .order('region', { ascending: true });
    
  // Fetch recent scaling events
  const { data: scalingHistoryData, error: _scalingError } = await supabase
    .from('autoscaling_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  // Fetch traffic metrics
  const { data: trafficData, error: _trafficError } = await supabase
    .from('traffic_analytics')
    .select('*')
    .order('hour', { ascending: false })
    .limit(24);
    
  // Format region statuses
  const regions = regionData || [];
  const scalingHistory = scalingHistoryData || [];
  const trafficMetrics = trafficData || [];
  
  // Calculate total active workers
  const totalWorkers = regions.reduce((sum, region) => sum + region.active_workers, 0);
  const totalTraffic = regions.reduce((sum, region) => sum + (region.recent_requests || 0), 0);
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Infrastructure Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor auto-scaling, regional traffic, and infrastructure health
          </p>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Active Regions</span>
                <span className="text-2xl font-bold">{regions.length}</span>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Active Workers</span>
                <span className="text-2xl font-bold">{totalWorkers}</span>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Recent Requests</span>
                <span className="text-2xl font-bold">{totalTraffic}</span>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Scaling Events</span>
                <span className="text-2xl font-bold">{scalingHistory.length}</span>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Regional status */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Status</CardTitle>
          <CardDescription>Current worker distribution and traffic by region</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Active Workers</TableHead>
                <TableHead>Max Workers</TableHead>
                <TableHead>Recent Requests</TableHead>
                <TableHead>Recent Errors</TableHead>
                <TableHead>Last Scaled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => {
                // Calculate health status
                const errorRate = region.recent_errors && region.recent_requests 
                  ? region.recent_errors / region.recent_requests 
                  : 0;
                const isHealthy = errorRate < 0.05; // Less than 5% error rate
                
                return (
                  <TableRow key={region.region}>
                    <TableCell className="font-medium">{region.region}</TableCell>
                    <TableCell>{region.active_workers}</TableCell>
                    <TableCell>{region.max_workers}</TableCell>
                    <TableCell>{region.recent_requests || 0}</TableCell>
                    <TableCell>{region.recent_errors || 0}</TableCell>
                    <TableCell>
                      {region.last_scaled 
                        ? formatDistanceToNow(new Date(region.last_scaled), { addSuffix: true }) 
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {isHealthy ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Healthy</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                          <span>Warning</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Recent scaling events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scaling Events</CardTitle>
          <CardDescription>Auto-scaling activity across all regions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Traffic</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scalingHistory.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{event.region}</TableCell>
                  <TableCell>{event.previous_workers}</TableCell>
                  <TableCell>{event.new_workers}</TableCell>
                  <TableCell>{event.traffic}</TableCell>
                  <TableCell>
                    <span className={event.reason === 'scale_up' ? 'text-green-500' : 'text-blue-500'}>
                      {event.reason === 'scale_up' ? 'Scale Up' : 'Scale Down'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {scalingHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No scaling events recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">View All</Button>
        </CardFooter>
      </Card>
      
      {/* Traffic metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Metrics</CardTitle>
          <CardDescription>Historical traffic patterns by hour</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Avg Response Time</TableHead>
                <TableHead>P95 Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficMetrics.map((metric) => (
                <TableRow key={metric.hour}>
                  <TableCell className="font-medium">
                    {new Date(metric.hour).toLocaleString()}
                  </TableCell>
                  <TableCell>{metric.requests}</TableCell>
                  <TableCell>{metric.errors}</TableCell>
                  <TableCell>{metric.avg_response_time.toFixed(2)}ms</TableCell>
                  <TableCell>{metric.p95_response_time.toFixed(2)}ms</TableCell>
                </TableRow>
              ))}
              {trafficMetrics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No traffic data recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">View All</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 