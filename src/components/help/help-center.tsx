"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"

// Types for our documentation data
interface DocItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface DocCategories {
  [key: string]: DocItem[];
}

// Mock documentation data - in a real app this would come from an API or CMS
const DOCUMENTATION_DATA: DocCategories = {
  gettingStarted: [
    {
      id: "gs1",
      title: "Platform Overview",
      content: `
        <h3>Welcome to the Content Roadmap Tool</h3>
        <p>Our platform is designed to help content creators and marketers plan, analyze, and optimize their content strategy. With our suite of tools, you can:</p>
        <ul>
          <li>Analyze content gaps in your current strategy</li>
          <li>Identify high-performing topic clusters</li>
          <li>Compare your content against competitors</li>
          <li>Generate detailed reports and recommendations</li>
        </ul>
        <p>This guide will walk you through the key features and how to make the most of our platform.</p>
      `,
      category: "gettingStarted",
      tags: ["overview", "introduction", "basics"]
    },
    {
      id: "gs2", 
      title: "Creating Your First Project",
      content: `
        <h3>Getting Started with Projects</h3>
        <p>Projects are the foundation of your work in the platform. Follow these steps to create your first project:</p>
        <ol>
          <li>Navigate to the Projects section from the dashboard sidebar</li>
          <li>Click the &quot;New Project&quot; button in the top right corner</li>
          <li>Fill in the project details including name, description, and goals</li>
          <li>Add competitor websites (optional but recommended)</li>
          <li>Configure analysis settings based on your needs</li>
          <li>Click &quot;Create Project&quot; to finish setup</li>
        </ol>
        <p>Once created, you'll be taken to your project dashboard where you can start your first analysis.</p>
      `,
      category: "gettingStarted",
      tags: ["projects", "setup", "configuration"]
    },
  ],
  features: [
    {
      id: "f1",
      title: "Content Gap Analysis",
      content: `
        <h3>Understanding Content Gap Analysis</h3>
        <p>Content gap analysis helps you identify topics your audience is searching for that your website doesn&apos;t currently cover. Here&apos;s how to use this feature:</p>
        <ol>
          <li>Select a project from your dashboard</li>
          <li>Click on &quot;Run Analysis&quot; and select &quot;Content Gaps&quot;</li>
          <li>Configure the analysis parameters (keyword volume, difficulty, etc.)</li>
          <li>Start the analysis and wait for completion (typically 5-10 minutes)</li>
          <li>Review the results on the analysis dashboard</li>
        </ol>
        <p>The results will show you topics organized by potential impact, with recommendations on which gaps to prioritize.</p>
      `,
      category: "features",
      tags: ["analysis", "content gaps", "keywords"]
    },
    {
      id: "f2",
      title: "Generating Reports",
      content: `
        <h3>Creating and Sharing Reports</h3>
        <p>Reports allow you to compile your analysis findings into shareable documents. To generate a report:</p>
        <ol>
          <li>Navigate to the Reports section in your dashboard</li>
          <li>Click &quot;New Report&quot; and select a report type</li>
          <li>Choose which analyses to include in the report</li>
          <li>Select the format (PDF, interactive, presentation)</li>
          <li>Customize the report appearance and sections</li>
          <li>Generate the report</li>
        </ol>
        <p>Once generated, you can download the report, share it via link, or schedule regular report generation.</p>
      `,
      category: "features",
      tags: ["reports", "export", "sharing"]
    },
  ],
  troubleshooting: [
    {
      id: "t1",
      title: "Common Analysis Errors",
      content: `
        <h3>Resolving Analysis Issues</h3>
        <p>If you encounter problems during analysis, try these troubleshooting steps:</p>
        <ul>
          <li><strong>Analysis fails to start:</strong> Check your quota limits and ensure you have sufficient credits</li>
          <li><strong>Analysis takes too long:</strong> Large websites may require extended processing time (up to 1 hour)</li>
          <li><strong>Empty results:</strong> Verify your URL configuration and keyword settings</li>
          <li><strong>Error messages:</strong> Note the specific error code and contact support if persistent</li>
        </ul>
        <p>Most analysis issues can be resolved by adjusting parameters or waiting for server load to decrease.</p>
      `,
      category: "troubleshooting",
      tags: ["errors", "analysis", "troubleshooting"]
    },
    {
      id: "t2",
      title: "Account and Billing Issues",
      content: `
        <h3>Managing Account and Billing</h3>
        <p>For account-related concerns:</p>
        <ul>
          <li><strong>Billing updates:</strong> Manage payment methods in the Settings → Billing section</li>
          <li><strong>Subscription changes:</strong> Upgrade or downgrade your plan from the same section</li>
          <li><strong>Access issues:</strong> Ensure your account email is verified and your subscription is active</li>
          <li><strong>Team permissions:</strong> Adjust user roles in the Team Management section</li>
        </ul>
        <p>For immediate assistance with billing issues, contact our support team via the help widget.</p>
      `,
      category: "troubleshooting",
      tags: ["account", "billing", "subscription"]
    },
  ]
}

interface HelpCenterProps {
  searchQuery?: string;
}

export function HelpCenter({ searchQuery = "" }: HelpCenterProps) {
  const [activeCategory, setActiveCategory] = useState("gettingStarted")
  const [loading, setLoading] = useState(true)
  const [filteredDocs, setFilteredDocs] = useState<DocCategories>(DOCUMENTATION_DATA)
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Filter documentation by search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredDocs(DOCUMENTATION_DATA)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = Object.entries(DOCUMENTATION_DATA).reduce((acc: DocCategories, [category, docs]) => {
      const matchingDocs = docs.filter(
        doc => 
          doc.title.toLowerCase().includes(query) || 
          doc.content.toLowerCase().includes(query) ||
          doc.tags.some(tag => tag.toLowerCase().includes(query))
      )
      
      if (matchingDocs.length > 0) {
        acc[category] = matchingDocs
      }
      
      return acc
    }, {})
    
    setFilteredDocs(filtered)
  }, [searchQuery])
  
  // Get category names for display
  const getCategoryName = (category: string) => {
    switch (category) {
      case "gettingStarted": return "Getting Started"
      case "features": return "Features & Capabilities"
      case "troubleshooting": return "Troubleshooting"
      default: return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }
  
  // Make HTML content safe (in a real app you'd use a proper sanitizer)
  const createMarkup = (html: string) => {
    return { __html: html }
  }
  
  // Gets all available categories after filtering
  const availableCategories = Object.keys(filteredDocs)
  
  // Ensure we have a valid active category after filtering
  React.useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(activeCategory)) {
      setActiveCategory(availableCategories[0])
    }
  }, [availableCategories, activeCategory])
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (Object.keys(filteredDocs).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>
            No results found for &quot;{searchQuery}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>Try a different search term or browse categories.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation</CardTitle>
        <CardDescription>
          {searchQuery 
            ? `Showing results for &quot;${searchQuery}&quot;`
            : "Browse documentation by category"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-6">
            {Object.keys(filteredDocs).map(category => (
              <TabsTrigger key={category} value={category}>
                {getCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(filteredDocs).map(([category, docs]) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-8">
                {docs.map(doc => (
                  <div key={doc.id} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium">{doc.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {doc.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={createMarkup(doc.content)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
} 