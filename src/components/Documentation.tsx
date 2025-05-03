import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getDocumentation } from '@/lib/rate-limiter';
import Markdown from 'react-markdown';

interface DocumentationProps {
  categories?: string[];
  defaultCategory?: string;
}

export function Documentation({ 
  categories = ['rate_limits', 'quotas'], 
  defaultCategory = 'rate_limits' 
}: DocumentationProps) {
  const [activeTab, setActiveTab] = useState(defaultCategory);
  interface DocItem {
    id: string;
    content: string;
    category: string;
    created_at: string;
    updated_at: string;
  }
  
  const [docs, setDocs] = useState<{ [key: string]: DocItem[] }>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const result: { [key: string]: DocItem[] } = {};
        
        for (const category of categories) {
          const data = await getDocumentation(category, true);
          result[category] = data;
        }
        
        setDocs(result);
      } catch (error: unknown) {
        console.error('Error fetching documentation:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocs();
  }, [categories]);
  
  // Map category names to display names
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'rate_limits': return 'Rate Limits';
      case 'quotas': return 'Usage Quotas';
      default: return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Documentation</CardTitle>
        <CardDescription>
          Learn about our rate limiting and quota policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {getCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : docs[category] && docs[category].length > 0 ? (
                <div className="space-y-6">
                  {docs[category].map((doc) => (
                    <div key={doc.id} className="prose prose-sm max-w-none dark:prose-invert">
                      <Markdown>{doc.content}</Markdown>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No documentation available for this category.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 