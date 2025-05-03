'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatDistance } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { InfoIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, RefreshCwIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, Search, DownloadIcon } from 'lucide-react';
import { Input } from './ui/input';
import Link from 'next/link';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Job status types
type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Job history record
interface JobHistoryRecord {
  id: string;
  job_id: string;
  status_from: JobStatus | null;
  status_to: JobStatus;
  changed_at: string;
  message: string | null;
}

// Job interface
interface Job {
  id: string;
  user_id: string;
  status: JobStatus;
  user_url: string;
  competitor_urls: string[];
  content_gaps: string[] | null;
  popular_themes: string[] | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  processing_time: string | null;
  priority: number;
  history?: JobHistoryRecord[];
}

// Status badge component
const StatusBadge = ({ status }: { status: JobStatus }) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><ClockIcon className="w-3 h-3 mr-1" /> Pending</Badge>;
    case 'PROCESSING':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1" /> Completed</Badge>;
    case 'FAILED':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircleIcon className="w-3 h-3 mr-1" /> Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircleIcon className="w-3 h-3 mr-1" /> Cancelled</Badge>;
    default:
      return <Badge variant="outline"><InfoIcon className="w-3 h-3 mr-1" /> {status}</Badge>;
  }
};

// Calculate progress percentage for a processing job
const calculateProgress = (job: Job) => {
  if (!job.started_at) return 0;
  
  // Calculate elapsed time since job started
  const startTime = new Date(job.started_at).getTime();
  const currentTime = new Date().getTime();
  const elapsedMs = currentTime - startTime;
  
  // Estimate progress based on average processing time or fallback to 45% if no data
  // This is a simple estimation - in a real-world scenario, the job could report actual progress
  const estimatedTotalMs = 120000; // 2 minutes (adjust based on your average processing time)
  const progress = Math.min(Math.round((elapsedMs / estimatedTotalMs) * 100), 95);
  
  // Return at least 5% but never more than 95% (since we don't know actual completion)
  return Math.max(5, progress);
};

// Add export function
const exportJobResults = (job: Job) => {
  if (job.status !== 'COMPLETED') return;

  // Prepare job data for export
  const exportData = {
    job_id: job.id,
    user_url: job.user_url,
    competitor_urls: job.competitor_urls,
    content_gaps: job.content_gaps || [],
    popular_themes: job.popular_themes || [],
    created_at: job.created_at,
    completed_at: job.completed_at,
    processing_time: job.processing_time
  };

  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create a blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `content-analysis-${job.id.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// Job Monitor component
export default function JobMonitor() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const jobsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get the selected job
  const selectedJob = jobs.find(job => job.id === selectedJobId);

  // Load jobs from the database
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total count first
      const { count, error: countError } = await supabase
        .from('analysis_jobs')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalJobs(count || 0);

      // Determine range for pagination
      const from = (currentPage - 1) * jobsPerPage;
      const to = from + jobsPerPage - 1;

      // Fetch jobs with pagination
      const { data: jobsData, error: jobsError } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (jobsError) throw jobsError;

      // Set the jobs
      setJobs(jobsData || []);

      // If we have jobs and no selected job, select the first one
      if (jobsData && jobsData.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, jobsPerPage, selectedJobId, supabase]);

  // Load job history for a specific job
  const loadJobHistory = useCallback(async (jobId: string) => {
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('job_history')
        .select('*')
        .eq('job_id', jobId)
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      // Update the jobs with history data
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, history: historyData || [] } 
          : job
      ));
    } catch (err) {
      console.error(`Error loading history for job ${jobId}:`, err);
    }
  }, [supabase]);

  // Cancel a job
  const cancelJob = async (jobId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'CANCELLED',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Reload jobs
      loadJobs();
    } catch (err) {
      console.error(`Error cancelling job ${jobId}:`, err);
      setError('Failed to cancel job. Please try again.');
    }
  };

  // Retry a failed job
  const retryJob = async (jobId: string) => {
    try {
      const jobToRetry = jobs.find(job => job.id === jobId);
      if (!jobToRetry) return;

      const { error: updateError } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'PENDING',
          started_at: null,
          completed_at: null,
          error_message: null
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Reload jobs
      loadJobs();
    } catch (err) {
      console.error(`Error retrying job ${jobId}:`, err);
      setError('Failed to retry job. Please try again.');
    }
  };

  // Update job priority
  const updateJobPriority = async (jobId: string, priority: number) => {
    try {
      const { error: updateError } = await supabase
        .from('analysis_jobs')
        .update({ priority })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Update job in state to avoid reload
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, priority } 
          : job
      ));
    } catch (err) {
      console.error(`Error updating priority for job ${jobId}:`, err);
      setError('Failed to update job priority. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  // Get filtered jobs based on active tab
  const getFilteredJobs = () => {
    let filteredJobs = jobs;
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.status === activeTab);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.user_url.toLowerCase().includes(query) || 
        job.competitor_urls.some(url => url.toLowerCase().includes(query))
      );
    }
    
    return filteredJobs;
  };

  // Load job history when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      loadJobHistory(selectedJobId);
    }
  }, [selectedJobId, loadJobHistory]);

  // Subscribe to job updates (adjust this based on your actual implementation)
  useEffect(() => {
    loadJobs();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('job_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'analysis_jobs' 
      }, () => {
        loadJobs();
        if (selectedJobId) {
          loadJobHistory(selectedJobId);
        }
      })
      .subscribe();
    
    // Clean up subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentPage, loadJobs, loadJobHistory, selectedJobId, supabase]);

  // Add pagination controls
  const Pagination = () => {
    const totalPages = Math.ceil(totalJobs / jobsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Render loading state
  if (loading && jobs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Job Monitor</CardTitle>
          <CardDescription>Loading jobs...</CardDescription>
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
          <div>Job Monitor</div>
          <Button variant="outline" size="sm" onClick={loadJobs}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage your content analysis jobs
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="FAILED">Failed</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {jobs.length === 0 ? (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>No jobs found</AlertTitle>
                <AlertDescription>
                  You don&apos;t have any analysis jobs yet. Start a new analysis to create one.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by URL..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium mb-2">
                    Jobs ({getFilteredJobs().length} of {totalJobs})
                  </h3>
                  <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                    {getFilteredJobs().map(job => (
                      <div
                        key={job.id}
                        className={`p-3 cursor-pointer hover:bg-slate-50 ${
                          job.id === selectedJobId ? 'bg-slate-100' : ''
                        }`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium truncate flex-1">
                            {new URL(job.user_url).hostname}
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(job.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination />
                </div>

                <div className="md:col-span-2">
                  {selectedJob ? (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Job Details</h3>
                          <p className="text-sm text-gray-500">
                            {selectedJob.status === 'PROCESSING' && (
                              <span className="flex items-center">
                                <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
                                Processing{' '}
                                {selectedJob.started_at && (
                                  <span className="ml-1">
                                    ({formatTimeAgo(selectedJob.started_at)})
                                  </span>
                                )}
                              </span>
                            )}
                            {selectedJob.status === 'COMPLETED' && (
                              <span>
                                Completed {formatTimeAgo(selectedJob.completed_at)}
                              </span>
                            )}
                            {selectedJob.status === 'FAILED' && (
                              <span className="text-red-600">
                                Failed {formatTimeAgo(selectedJob.completed_at)}
                              </span>
                            )}
                            {selectedJob.status === 'PENDING' && (
                              <span>
                                Pending since {formatTimeAgo(selectedJob.created_at)}
                              </span>
                            )}
                            {selectedJob.status === 'CANCELLED' && (
                              <span className="text-gray-600">
                                Cancelled {formatTimeAgo(selectedJob.completed_at)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="space-x-2">
                          {selectedJob.status === 'PROCESSING' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => cancelJob(selectedJob.id)}
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          {selectedJob.status === 'FAILED' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => retryJob(selectedJob.id)}
                            >
                              <RefreshCwIcon className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          )}
                          {selectedJob.status === 'COMPLETED' && (
                            <>
                              <Link href={`/analysis/${selectedJob.id}`} passHref>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                  View All Results
                                </Button>
                              </Link>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => exportJobResults(selectedJob)}
                              >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedJob.status === 'PROCESSING' && (
                        <div className="mb-4">
                          <Progress value={calculateProgress(selectedJob)} className="h-2" />
                          <p className="text-xs text-center mt-1 text-gray-500">
                            Processing... please wait
                          </p>
                        </div>
                      )}

                      {selectedJob.error_message && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircleIcon className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{selectedJob.error_message}</AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">User URL</h4>
                          <p className="text-sm truncate">
                            <a href={selectedJob.user_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedJob.user_url}
                            </a>
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Created</h4>
                          <div>
                            <span className="text-sm">{formatDate(selectedJob.created_at)}</span>
                            {(selectedJob.status === 'PENDING') && (
                              <div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateJobPriority(selectedJob.id, selectedJob.priority + 1)}
                                >
                                  +
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={() => updateJobPriority(selectedJob.id, Math.max(1, selectedJob.priority - 1))}
                                  disabled={selectedJob.priority <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedJob.status === 'COMPLETED' && selectedJob.processing_time && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Processing Time</h4>
                          <p className="text-sm">{selectedJob.processing_time}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-1">Competitor URLs</h4>
                        <ul className="text-sm space-y-1">
                          {selectedJob.competitor_urls.map((url, index) => (
                            <li key={index} className="truncate">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {selectedJob.status === 'COMPLETED' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Content Gaps</h4>
                            {selectedJob.content_gaps && selectedJob.content_gaps.length > 0 ? (
                              <ul className="text-sm list-disc pl-4">
                                {selectedJob.content_gaps.slice(0, 10).map((gap, index) => (
                                  <li key={index}>{gap}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No content gaps found</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Popular Themes</h4>
                            {selectedJob.popular_themes && selectedJob.popular_themes.length > 0 ? (
                              <ul className="text-sm list-disc pl-4">
                                {selectedJob.popular_themes.slice(0, 10).map((theme, index) => (
                                  <li key={index}>{theme}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No popular themes found</p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedJob.history && selectedJob.history.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Job History</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Status Change</TableHead>
                                <TableHead>Message</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedJob.history.map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell className="text-xs">
                                    {formatDate(record.changed_at)}
                                  </TableCell>
                                  <TableCell>
                                    {record.status_from ? (
                                      <span>
                                        <StatusBadge status={record.status_from} /> →{' '}
                                        <StatusBadge status={record.status_to} />
                                      </span>
                                    ) : (
                                      <StatusBadge status={record.status_to} />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {record.message || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Select a job to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Jobs are automatically processed in the background. Refresh to see the latest status.
      </CardFooter>
    </Card>
  );
} 