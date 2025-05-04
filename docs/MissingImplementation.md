What's Missing for User UI
Based on your project structure, here are the key user interface components you should consider adding:

Dashboard/Overview Page: A homepage for logged-in users showing their recent analyses, usage statistics, and quick actions
Analysis Results Detail View: A dedicated page to view complete analysis results with visualizations of content gaps and themes
Projects Management: Interface to create, view, and manage multiple content analysis projects
Reports Page: Interface to view scheduled reports and historical analyses
Settings Page: Allow users to manage their account, subscription, and preferences
Help/Documentation: User guide and documentation for using the tool effectively

Implementation Suggestions
Here's how you could implement these missing components:
1. User Dashboard
typescript// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { QuotaUsage } from '@/components/QuotaUsage';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { PlusCircle, BarChart2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, currentOrganization } = useAuth();
  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRecentJobs() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        setRecentJobs(data);
      }
      setIsLoading(false);
    }

    fetchRecentJobs();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/new-analysis">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentJobs.length}</div>
            <p className="text-xs text-gray-500">
              Total analyses in the last 30 days
            </p>
          </CardContent>
        </Card>
        
        {/* More summary cards... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your most recent content analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {/* List of recent jobs */}
          </CardContent>
          <CardFooter>
            <Link href="/jobs">
              <Button variant="outline" size="sm">View All Jobs</Button>
            </Link>
          </CardFooter>
        </Card>

        {currentOrganization && (
          <Card>
            <CardHeader>
              <CardTitle>Quota Usage</CardTitle>
              <CardDescription>Your subscription limits and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <QuotaUsage organizationId={currentOrganization.id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* More dashboard content */}
    </div>
  );
}
2. Analysis Results Detail View
typescript// src/app/analysis/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Share2, RefreshCw, AlertTriangle } from 'lucide-react';
import ContentGapsChart from '@/components/ContentGapsChart';
import ThemesWordCloud from '@/components/ThemesWordCloud';

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-report/${id}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertDescription>Analysis not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analysis Results</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Analysis Overview</CardTitle>
          <CardDescription>
            Analysis for {analysis.user_url}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Your Website</h3>
              <p className="mb-4">{analysis.user_url}</p>
              
              <h3 className="text-lg font-medium mb-2">Competitor Websites</h3>
              <ul className="list-disc list-inside space-y-1">
                {analysis.competitor_urls.map((url, i) => (
                  <li key={i}>{url}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Analysis Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Completed:</div>
                <div>{new Date(analysis.completed_at).toLocaleString()}</div>
                
                <div className="text-sm font-medium">Status:</div>
                <div>{analysis.status}</div>
                
                {/* More details */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content-gaps">
        <TabsList>
          <TabsTrigger value="content-gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="popular-themes">Popular Themes</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content-gaps">
          <Card>
            <CardHeader>
              <CardTitle>Content Gaps</CardTitle>
              <CardDescription>
                Content topics found on competitor sites but missing from your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.content_gaps && analysis.content_gaps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[400px]">
                    <ContentGapsChart data={analysis.content_gaps} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Content Gaps</h3>
                    <ul className="space-y-2">
                      {analysis.content_gaps.slice(0, 10).map((gap, i) => (
                        <li key={i} className="flex items-center">
                          <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 mr-3 text-xs">
                            {i + 1}
                          </span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No significant content gaps identified.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="popular-themes">
          <Card>
            <CardHeader>
              <CardTitle>Popular Themes</CardTitle>
              <CardDescription>
                Common themes found across competitor websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.popular_themes && analysis.popular_themes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[400px]">
                    <ThemesWordCloud themes={analysis.popular_themes} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Themes</h3>
                    <ul className="space-y-2">
                      {analysis.popular_themes.slice(0, 10).map((theme, i) => (
                        <li key={i} className="flex items-center">
                          <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-6 h-6 mr-3 text-xs">
                            {i + 1}
                          </span>
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No significant themes identified.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Content Recommendations</CardTitle>
              <CardDescription>
                Suggested content based on identified gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Content recommendations feature coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
3. Projects Management
typescript// src/app/projects/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Folder, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setProjects(data);
    }
    setIsLoading(false);
  }

  async function createProject() {
    if (!newProjectName || !newProjectUrl) return;
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectName,
        user_url: newProjectUrl,
        competitor_urls: []
      })
      .select();
    
    if (data) {
      setProjects([...projects, data[0]]);
      setNewProjectName('');
      setNewProjectUrl('');
      setIsDialogOpen(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new website to analyze against competitors
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input 
                  id="project-name" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Blog Analysis" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website-url">Your Website URL</Label>
                <Input 
                  id="website-url" 
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://yourblog.com" 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={createProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Loading...</CardTitle>
                <CardDescription>Please wait</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="truncate">{project.user_url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {project.competitor_urls.length} competitor{project.competitor_urls.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Folder className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first project to start analyzing your content
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
4. Settings Page
typescript// src/app/settings/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, organizations, currentOrganization, switchOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email is managed through your authentication provider
                </p>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" placeholder="Your Name" />
              </div>
              
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analysis Completion</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when an analysis is complete
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weekly Reports</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summaries of content performance
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Content Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      Get alerts when competitors publish new content
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Manage your organizations and switch between them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {organizations && organizations.length > 0 ? (
                <div className="space-y-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {org.subscription_tier || 'Free Plan'}
                        </p>
                      </div>
                      {currentOrganization?.id === org.id ? (
                        <Button variant="outline" disabled>
                          Current
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => switchOrganization(org.id)}>
                          Switch
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No organizations found</p>
              )}
              
              <Button>Create New Organization</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium">Current Plan</h3>
                <p className="text-xl font-bold mt-1">
                  {currentOrganization?.subscription_tier || 'Free Plan'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {new Date().toLocaleDateString()}
                </p>
              </div>
              
              <Button>Manage Subscription</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">API Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable API access for your account
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex">
                    <Input id="api-key" type="password" value="••••••••••••••••••••••••••" readOnly className="flex-1" />
                    <Button variant="outline" className="ml-2">Show</Button>
                    <Button variant="outline" className="ml-2">Copy</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key grants full access to your account. Keep it secure.
                  </p>
                </div>
              </div>
              
              <Button variant="destructive">Regenerate API Key</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
Implementation Next Steps
Here's how I recommend you proceed with implementing the user interface:

Create the Basic Pages: Start by implementing the dashboard, projects, and analysis detail pages as these are the core user experience.
Design the Layout: Create a consistent layout with navigation for logged-in users, similar to how your admin UI is structured.
Implement Data Visualizations: Add charts and visualizations to make the analysis results more meaningful. You can use Recharts as you've already done in the admin UI.
Add User Settings: Implement the settings page for user preferences and account management.
Responsive Design: Ensure all pages work well on mobile devices using Tailwind's responsive classes.

These components should integrate well with your existing codebase and provide a complete experience for your subscribers. They're different from the admin interface which focuses on system monitoring and management.