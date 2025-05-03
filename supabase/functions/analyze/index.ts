// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// TypeScript ignore directive for Deno-specific imports
// @ts-nocheck

// Import statements for Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { cors } from 'https://deno.land/x/cors/mod.ts';

/**
 * Content Roadmap Tool - Analyze Edge Function
 * 
 * This function processes website content for both user and competitor sites
 * to identify content gaps and popular themes.
 */

// ---- Constants & Configuration ----

// Custom User-Agent string to avoid being blocked by websites
const USER_AGENT = 'Mozilla/5.0 (compatible; ContentRoadmapBot/1.0; +https://contentroadmaptool.com/bot)';

// Rate limiting parameters for web scraping
const SCRAPE_DELAY_MS = 1000; // 1 second between requests to same domain
const MAX_RETRIES = 3;        // Number of retry attempts for failed scrapes
const RETRY_DELAY_MS = 2000;  // Delay before retrying a failed request

// Common site-specific selectors for content extraction
const CONTENT_SELECTORS = {
  default: 'article, main, #content, .content, .post, .post-content',
  wordpress: '.entry-content, .post-content, article .content',
  ghost: '.gh-content, .post-content, .kg-content',
  medium: '.section-content, .section-inner',
};

// Enhanced stop words list for better text processing
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
  "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
  "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
  "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves", "http", "https", "www", "com", "html", "css"
]);

// ---- Core Types & Interfaces ----

interface ScrapingResult {
  url: string;
  title: string | null;
  content: string;
  success: boolean;
  error?: string;
}

interface AnalysisResult {
  contentGaps: string[];
  popularThemes: string[];
  themeFrequencies: Record<string, number>;
}

interface WebsiteType {
  type: 'wordpress' | 'ghost' | 'medium' | 'unknown';
  confidence: number;
}

interface RequestPayload {
  user_url: string;
  competitor_urls: string[];
  job_id?: string; // Optional job ID for background processing
}

interface Topic {
  name: string;
  frequency: number;
  score: number;
  inUser: boolean;
  inCompetitors: number;
}

// Type definitions for DOM operations
type DOMElement = any;

// Type for HTTP request
interface EdgeRequest extends Request {
  method: string;
  headers: Headers;
  json(): Promise<any>;
}

// ---- Web Scraping Functions ----

/**
 * Identifies website type based on HTML structure and meta tags
 */
function identifyWebsiteType(html: string, url: string): WebsiteType {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) return { type: 'unknown', confidence: 0 };
  
  // Check for WordPress
  const wpContent = doc.querySelector('.wp-content, .wp-block, #wpadminbar');
  const wpGenerator = doc.querySelector('meta[name="generator"][content*="WordPress"]');
  if (wpContent || wpGenerator) {
    return { type: 'wordpress', confidence: 0.9 };
  }
  
  // Check for Ghost
  const ghostContent = doc.querySelector('.gh-content, .kg-card');
  const ghostGenerator = doc.querySelector('meta[name="generator"][content*="Ghost"]');
  if (ghostContent || ghostGenerator) {
    return { type: 'ghost', confidence: 0.9 };
  }
  
  // Check for Medium
  if (url.includes('medium.com') || doc.querySelector('.section-inner')) {
    return { type: 'medium', confidence: 0.8 };
  }
  
  return { type: 'unknown', confidence: 0 };
}

/**
 * Fetches and extracts content from a URL with retry logic
 */
async function fetchAndExtractContent(url: string, retryCount = 0): Promise<ScrapingResult> {
  try {
    console.log(`Fetching content from ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    // Validate and normalize URL first
    let normalizedUrl = url;
    try {
      // Make sure the URL has a protocol
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      
      // Validate URL format
      const urlObj = new URL(normalizedUrl);
      
      // Make sure the URL has a valid hostname
      if (!urlObj.hostname || urlObj.hostname === 'localhost') {
        throw new Error(`Invalid URL hostname: ${urlObj.hostname}`);
      }
      
      // Normalize the URL with the parsed object to ensure it's well-formed
      normalizedUrl = urlObj.toString();
    } catch (urlError) {
      return {
        url,
        title: null,
        content: "",
        success: false,
        error: `Invalid URL: ${urlError.message}`
      };
    }
    
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      const errorMessage = `Failed to fetch ${url}: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      
      // Retry logic for server errors (5xx) or rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchAndExtractContent(url, retryCount + 1);
      }
      
      return {
        url,
        title: null,
        content: "",
        success: false,
        error: errorMessage
      };
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) {
      return {
        url,
        title: null,
        content: "",
        success: false,
        error: "Failed to parse HTML"
      };
    }
    
    // Get page title
    const title = doc.querySelector('title')?.textContent || null;
    
    // Detect website type
    const websiteType = identifyWebsiteType(html, url);
    console.log(`Detected website type: ${websiteType.type} (confidence: ${websiteType.confidence})`);
    
    // Select content extraction strategy based on site type
    let contentSelector = CONTENT_SELECTORS.default;
    if (websiteType.type !== 'unknown' && websiteType.confidence > 0.7) {
      contentSelector = CONTENT_SELECTORS[websiteType.type];
    }
    
    // Try to extract main content
    let mainContent = "";
    const contentElement = doc.querySelector(contentSelector);
    
    if (contentElement) {
      // Remove noise elements
      contentElement.querySelectorAll('script, style, nav, header, footer, .comments, .sidebar, aside, .widget, .advertisement, .ad, .banner').forEach(el => {
        el.remove();
      });
      
      mainContent = contentElement.textContent || "";
    } else {
      // Fallback to body content if main content area not found
      // Remove noise elements
      doc.querySelectorAll('script, style, nav, header, footer, .comments, .sidebar, aside, .widget, .advertisement, .ad, .banner').forEach(el => {
        el.remove();
      });
      
      mainContent = doc.body?.textContent || "";
    }
    
    // Clean the content
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      url,
      title,
      content: mainContent,
      success: true
    };
    
  } catch (error) {
    console.error(`Error fetching or parsing ${url}:`, error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchAndExtractContent(url, retryCount + 1);
    }
    
    return {
      url,
      title: null,
      content: "",
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ---- Text Processing Functions ----

/**
 * Tokenizes and cleans text, removing stop words and applying basic NLP
 */
function tokenizeAndClean(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ') // Replace non-alphanumeric with space
    .split(/\s+/)                   // Split on whitespace
    .filter(word => 
      word.length > 3 &&           // Ignore short words
      !STOP_WORDS.has(word) &&     // Remove stop words
      !/^\d+$/.test(word));        // Remove pure numbers
}

/**
 * Extracts n-grams (phrases) from text for better topic detection
 */
function extractNgrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

/**
 * Calculate term frequencies with TF-IDF inspired weighting
 */
function calculateTermFrequencies(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  
  // Count raw frequencies
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  }
  
  // Remove very common and very rare terms
  for (const [term, count] of frequencies.entries()) {
    if (count < 2 || count > tokens.length * 0.5) {
      frequencies.delete(term);
    }
  }
  
  return frequencies;
}

/**
 * Analyzes content to find gaps and popular themes
 */
function analyzeContent(userContent: ScrapingResult, competitorContents: ScrapingResult[]): AnalysisResult {
  // Process user content
  const userTokens = tokenizeAndClean(userContent.content);
  const userBigrams = extractNgrams(userTokens, 2);
  const userTrigrams = extractNgrams(userTokens, 3);
  
  // Combine tokens and n-grams for user content
  const userTerms = [...userTokens, ...userBigrams, ...userTrigrams];
  const userFreq = calculateTermFrequencies(userTerms);
  
  // Process competitor content
  const allCompetitorTokens: string[] = [];
  const competitorsTokensPerSite: string[][] = [];
  
  for (const competitor of competitorContents) {
    if (!competitor.success) continue;
    
    const tokens = tokenizeAndClean(competitor.content);
    const bigrams = extractNgrams(tokens, 2);
    const trigrams = extractNgrams(tokens, 3);
    
    const terms = [...tokens, ...bigrams, ...trigrams];
    competitorsTokensPerSite.push(terms);
    allCompetitorTokens.push(...terms);
  }
  
  const competitorFreq = calculateTermFrequencies(allCompetitorTokens);
  
  // Calculate topic importance across multiple competitors
  const topics: Topic[] = [];
  const competitorCount = competitorsTokensPerSite.length;
  
  for (const [term, frequency] of competitorFreq.entries()) {
    // Calculate in how many competitor sites this term appears
    let sitesWithTerm = 0;
    for (const siteTokens of competitorsTokensPerSite) {
      if (siteTokens.includes(term)) {
        sitesWithTerm++;
      }
    }
    
    // Determine if term exists in user content
    const inUser = userFreq.has(term);
    const userFrequency = userFreq.get(term) || 0;
    
    // Calculate importance score
    // Higher when:
    // 1. Appears in multiple competitor sites
    // 2. Has high frequency across competitors
    // 3. Low or zero frequency in user content
    const siteRatio = sitesWithTerm / competitorCount;
    const frequencyRatio = userFrequency > 0 ? frequency / userFrequency : frequency * 2;
    const score = siteRatio * frequencyRatio * Math.log(frequency + 1);
    
    topics.push({
      name: term,
      frequency,
      score,
      inUser,
      inCompetitors: sitesWithTerm
    });
  }
  
  // Sort topics by score
  topics.sort((a, b) => b.score - a.score);
  
  // Identify content gaps (topics with high scores not in user content)
  const contentGaps = topics
    .filter(topic => !topic.inUser && topic.score > 1.5 && topic.inCompetitors > 1)
    .slice(0, 30)
    .map(topic => topic.name);
  
  // Identify popular themes (topics with highest scores)
  const popularThemes = topics
    .filter(topic => topic.inCompetitors > 1)
    .slice(0, 30)
    .map(topic => topic.name);
  
  // Build frequency dictionary for the UI
  const themeFrequencies: Record<string, number> = {};
  for (const topic of topics.slice(0, 50)) {
    themeFrequencies[topic.name] = topic.frequency;
  }
  
  return {
    contentGaps,
    popularThemes,
    themeFrequencies
  };
}

/**
 * Main analysis function that can be called directly or by the worker
 */
async function runAnalysis(
  supabaseClient: any,
  payload: RequestPayload,
  userId: string | undefined,
  jobId?: string
): Promise<{ status: number; body: any }> {
  try {
    const { user_url, competitor_urls } = payload;
    let job: any = null;
    
    // If no job ID was provided, create a new job
    if (!jobId) {
      if (!userId) {
        return {
          status: 401,
          body: { error: 'User ID required when no job ID is provided' }
        };
      }
      
      // Create a new job record
      const { data: newJob, error: jobError } = await supabaseClient
        .from('analysis_jobs')
        .insert({
          user_id: userId,
          status: 'PENDING',
          user_url,
          competitor_urls,
        })
        .select()
        .single();
      
      if (jobError) {
        console.error('Error creating job:', jobError);
        return {
          status: 500,
          body: { error: 'Failed to create analysis job' }
        };
      }
      
      job = newJob;
      jobId = job.id;
    } else {
      // Get existing job
      const { data: existingJob, error: jobError } = await supabaseClient
        .from('analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (jobError || !existingJob) {
        console.error('Error fetching job:', jobError);
        return {
          status: 404,
          body: { error: 'Job not found' }
        };
      }
      
      job = existingJob;
    }
    
    // Update job status to PROCESSING
    await supabaseClient
      .from('analysis_jobs')
      .update({
        status: 'PROCESSING',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // 1. Fetch user content
    const userContent = await fetchAndExtractContent(user_url);
    
    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, SCRAPE_DELAY_MS));
    
    // 2. Fetch competitor content
    const competitorContents: ScrapingResult[] = [];
    for (const url of competitor_urls) {
      const content = await fetchAndExtractContent(url);
      competitorContents.push(content);
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, SCRAPE_DELAY_MS));
    }
    
    // 3. Check if we have enough data to perform analysis
    if (!userContent.success || competitorContents.filter(c => c.success).length === 0) {
      const errorMessage = !userContent.success 
        ? `Failed to analyze your website: ${userContent.error}` 
        : 'Failed to analyze any competitor websites. Please check the URLs.';
      
      await supabaseClient
        .from('analysis_jobs')
        .update({
          status: 'FAILED',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      return {
        status: 422,
        body: { 
          error: errorMessage,
          job_id: jobId 
        }
      };
    }
    
    // 4. Perform content analysis
    const analysisResult = analyzeContent(userContent, competitorContents);
    
    // 5. Update job with analysis results
    await supabaseClient
      .from('analysis_jobs')
      .update({
        status: 'COMPLETED',
        content_gaps: analysisResult.contentGaps,
        popular_themes: analysisResult.popularThemes,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // 6. Return job ID
    return {
      status: 200,
      body: { 
        message: 'Analysis completed',
        job_id: jobId
      }
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    
    if (jobId) {
      // Update job status to FAILED
      await supabaseClient
        .from('analysis_jobs')
        .update({
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }
    
    return {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
}

// ---- Main Edge Function Logic ----

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deno serve function
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Check if this is a worker-initiated request
    const jobId = req.headers.get('X-Job-ID');
    const isWorkerRequest = !!jobId;
    
    // Create Supabase client
    let supabaseClient;
    let userId: string | undefined = undefined;
    
    if (isWorkerRequest) {
      // Use service role key for worker requests
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
    } else {
      // Verify authentication for normal user requests
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Create Supabase client with user's JWT
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: { headers: { Authorization: authHeader } },
        }
      );
      
      // Check if user is authenticated
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      userId = user.id;
    }
    
    // Get request payload
    const payload: RequestPayload = await req.json();
    
    // Validate payload
    if (!payload.user_url || !payload.competitor_urls || payload.competitor_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Requires user_url and at least one competitor_url' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Validate URL formats
    try {
      // Validate user URL
      if (!/^https?:\/\//i.test(payload.user_url)) {
        payload.user_url = `https://${payload.user_url}`;
      }
      new URL(payload.user_url);
      
      // Validate competitor URLs
      for (let i = 0; i < payload.competitor_urls.length; i++) {
        let url = payload.competitor_urls[i];
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
          payload.competitor_urls[i] = url;
        }
        new URL(url);
      }
    } catch (urlError) {
      return new Response(
        JSON.stringify({ error: `Invalid URL: ${urlError.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Run analysis
    const result = await runAnalysis(supabaseClient, payload, userId, jobId);
    
    // Return result
    return new Response(
      JSON.stringify(result.body),
      { 
        status: result.status, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
