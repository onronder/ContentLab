'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, Terminal, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session, User } from '@supabase/supabase-js'

// Define state types
interface AnalysisResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  content_gaps: string[] | null;
  popular_themes: string[] | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  project_id?: string;
  user_id?: string;
  user_url?: string;
  competitor_urls?: string[];
}

interface AnalysisResponse {
  job_id: string;
  message?: string;
}

interface ErrorResponse {
  error: string;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userUrl, setUserUrl] = useState<string>('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Reset state on login/logout
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setUserUrl('');
        setCompetitorUrls(['']);
        setIsLoading(false);
        setError(null);
        setAnalysisResult(null);
        setJobId(null);
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    });

    // Cleanup listener on component unmount
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Cleanup polling on unmount or when job finishes
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const addCompetitorUrl = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };

  const removeCompetitorUrl = (index: number) => {
    if (competitorUrls.length > 1) {
      const newUrls = [...competitorUrls];
      newUrls.splice(index, 1);
      setCompetitorUrls(newUrls);
    }
  };

  const handleCompetitorUrlChange = (index: number, value: string) => {
    const newUrls = [...competitorUrls];
    newUrls[index] = value;
    setCompetitorUrls(newUrls);
  };

  const pollForResult = (currentJobId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!session) {
        clearInterval(pollingIntervalRef.current!);
        setIsPolling(false);
        setIsLoading(false);
        setError("Authentication session expired. Please log in again.");
        return;
      }

      try {
        // Direct fetch to the function endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-report/${currentJobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` })) as ErrorResponse;
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as AnalysisResult;
        setAnalysisResult(result); // Update UI with the latest status

        if (result.status === 'COMPLETED' || result.status === 'FAILED') {
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          setIsPolling(false);
          setIsLoading(false);
          if (result.status === 'FAILED') {
            setError(result.error_message || "Analysis failed with an unknown error.");
          }
        }
      } catch (pollError: any) {
        console.error("Polling error:", pollError);
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null;
        setIsPolling(false);
        setIsLoading(false);
        setError(pollError.message || "Error checking analysis status.");
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleAnalyze = async () => {
    if (!session) {
      setError("Please log in to start an analysis.");
      return;
    }

    setAnalysisResult(null);
    setError(null);
    setJobId(null);
    setIsLoading(true);
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Validate and format URLs
    let formattedUserUrl = userUrl.trim();
    // Add https:// if no protocol specified
    if (!/^https?:\/\//i.test(formattedUserUrl)) {
      formattedUserUrl = `https://${formattedUserUrl}`;
    }
    
    // Validate user URL
    try {
      new URL(formattedUserUrl);
    } catch (e) {
      setError(`Invalid URL: '${userUrl.trim()}'`);
      setIsLoading(false);
      return;
    }

    // Format and validate competitor URLs
    const validCompetitorUrls = competitorUrls
      .filter(url => url.trim())
      .map(url => {
        let formatted = url.trim();
        if (!/^https?:\/\//i.test(formatted)) {
          formatted = `https://${formatted}`;
        }
        return formatted;
      });
    
    // Validate each competitor URL
    for (const url of validCompetitorUrls) {
      try {
        new URL(url);
      } catch (e) {
        setError(`Invalid competitor URL: '${url}'`);
        setIsLoading(false);
        return;
      }
    }
    
    if (!formattedUserUrl || validCompetitorUrls.length === 0) {
      setError("Please provide your URL and at least one valid competitor URL.");
      setIsLoading(false);
      return;
    }

    try {
      // Direct fetch to the function endpoint with proper CORS headers
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          // Add any other headers that might be needed
        },
        body: JSON.stringify({
          user_url: formattedUserUrl,
          competitor_urls: validCompetitorUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` })) as ErrorResponse;
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as AnalysisResponse;
      const newJobId = data.job_id;

      if (!newJobId) {
        throw new Error("Analysis started but did not return a job ID.");
      }

      setJobId(newJobId);
      setIsPolling(true);
      // Set initial pending state for UI
      setAnalysisResult({
        id: newJobId,
        status: 'PENDING',
        content_gaps: null,
        popular_themes: null,
        error_message: null,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        project_id: '', // Project ID is created/linked in the function
        user_id: session.user.id,
        user_url: formattedUserUrl,
        competitor_urls: validCompetitorUrls
      });
      pollForResult(newJobId);

    } catch (apiError: any) {
      console.error("Analysis initiation error:", apiError);
      setError(apiError.message || "Failed to initiate analysis.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Render Auth UI if not logged in
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Access the Content Roadmap Tool</CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']} // Add providers as needed
              redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  // Render main application UI if logged in
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-12 md:p-24">
      <div className="w-full max-w-2xl flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Logged in as: {user?.email}</p>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Content Roadmap Tool</CardTitle>
          <CardDescription>Analyze your content against competitors to find gaps and popular themes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userUrl">Your Blog/Website URL</Label>
            <Input
              id="userUrl"
              type="url"
              placeholder="https://yourblog.com"
              value={userUrl}
              onChange={(e) => setUserUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Competitor URLs (up to 5)</Label>
            {competitorUrls.map((url, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder={`https://competitor${index + 1}.com`}
                  value={url}
                  onChange={(e) => handleCompetitorUrlChange(index, e.target.value)}
                  disabled={isLoading}
                />
                {competitorUrls.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitorUrl(index)}
                    disabled={isLoading}
                    aria-label="Remove competitor URL"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {competitorUrls.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCompetitorUrl}
                disabled={isLoading}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            )}
          </div>

          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPolling ? 'Analyzing (this may take a minute)...' : 'Initiating...'}
              </>
            ) : (
              'Analyze Content'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Analysis Results (Job ID: {analysisResult.id})</CardTitle>
            <CardDescription>
              Status: {analysisResult.status}
              {analysisResult.status === 'FAILED' && analysisResult.error_message ? ` - ${analysisResult.error_message}` : ''}
              {analysisResult.status === 'PROCESSING' && ' - Please wait...'}
            </CardDescription>
          </CardHeader>
          {(analysisResult.status === 'COMPLETED' || analysisResult.status === 'PROCESSING' || analysisResult.status === 'PENDING') && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Potential Content Gaps</h3>
                {analysisResult.content_gaps && analysisResult.content_gaps.length > 0 ? (
                  <ScrollArea className="h-[150px] border rounded-md p-2">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysisResult.content_gaps.map((gap, i) => <li key={`gap-${i}`}>{gap}</li>)}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {analysisResult.status === 'COMPLETED' ? 'No significant gaps identified.' : 'Processing...'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Popular Competitor Themes</h3>
                {analysisResult.popular_themes && analysisResult.popular_themes.length > 0 ? (
                  <ScrollArea className="h-[150px] border rounded-md p-2">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysisResult.popular_themes.map((theme, i) => <li key={`theme-${i}`}>{theme}</li>)}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {analysisResult.status === 'COMPLETED' ? 'No significant themes identified.' : 'Processing...'}
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </main>
  );
}


