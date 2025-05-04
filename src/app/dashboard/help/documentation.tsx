"use client"

import * as React from "react"
import { useState, useEffect, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, FileText, Search } from "lucide-react"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { FeedbackForm } from "@/components/help/feedback-form"
import { KeyboardShortcutsDialog } from "@/components/help/keyboard-shortcuts"
import { SwipeContainer } from "@/components/mobile/swipe-container"
import { announceToScreenReader } from "@/lib/accessibility"
import { ShareButton } from "@/components/help/share-button"
import { OfflineIndicator, useOfflineDetection } from "@/components/ui/offline-indicator"

// Mock documentation structure
const docCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of ContentCreate",
    articles: [
      { id: "welcome", title: "Welcome to ContentCreate", slug: "welcome" },
      { id: "quick-start", title: "Quick Start Guide", slug: "quick-start" },
      { id: "create-project", title: "Creating Your First Project", slug: "create-project" },
      { id: "navigate", title: "Navigating the Platform", slug: "navigate" },
    ],
  },
  {
    id: "content-analysis",
    title: "Content Analysis",
    description: "Learn how to analyze content effectively",
    articles: [
      { id: "gap-analysis", title: "Content Gap Analysis", slug: "gap-analysis" },
      { id: "competitor-analysis", title: "Competitor Analysis", slug: "competitor-analysis" },
      { id: "themes", title: "Content Themes & Clustering", slug: "themes" },
      { id: "interpretation", title: "Interpreting Analysis Results", slug: "interpretation" },
    ],
  },
  {
    id: "strategy",
    title: "Content Strategy",
    description: "Build a winning content strategy",
    articles: [
      { id: "roadmap", title: "Building a Content Roadmap", slug: "roadmap" },
      { id: "personas", title: "Content Personas", slug: "personas" },
      { id: "keywords", title: "Keyword Strategy", slug: "keywords" },
      { id: "calendars", title: "Content Calendars", slug: "calendars" },
    ],
  },
  {
    id: "reporting",
    title: "Reporting",
    description: "Create and share reports",
    articles: [
      { id: "create-reports", title: "Creating Reports", slug: "create-reports" },
      { id: "export", title: "Exporting & Sharing", slug: "export" },
      { id: "scheduled", title: "Scheduled Reports", slug: "scheduled" },
      { id: "customization", title: "Report Customization", slug: "customization" },
    ],
  },
]

// Mock article content (in a real app, this would come from a database or CMS)
const articleContent = {
  "welcome": {
    title: "Welcome to ContentCreate",
    lastUpdated: "2023-11-15",
    content: (
      <div className="space-y-4">
        <p>
          ContentCreate is a comprehensive platform designed to help you plan, analyze, and optimize your content strategy.
          With our suite of tools, you can identify content gaps, analyze competitors, and generate strategic recommendations.
        </p>

        <h3 className="text-lg font-medium mt-6">Key Features</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Content gap analysis to identify missing topics</li>
          <li>Competitor content analysis across multiple websites</li>
          <li>Content theme identification and clustering</li>
          <li>Strategic content recommendations</li>
          <li>Content roadmap planning tools</li>
          <li>Comprehensive reporting and exports</li>
        </ul>

        <h3 className="text-lg font-medium mt-6">Getting Started</h3>
        <p>
          To get started with ContentCreate, we recommend following these steps:
        </p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Create your first project</li>
          <li>Add your website and competitor URLs</li>
          <li>Run your first content analysis</li>
          <li>Explore the results and recommendations</li>
          <li>Build your content roadmap</li>
        </ol>

        <p>
          Check out our <Link href="/dashboard/help/documentation/quick-start" className="text-primary hover:underline">Quick Start Guide</Link> for 
          more detailed instructions.
        </p>
      </div>
    )
  },
  // Additional article content would be defined for other slugs
}

// Memoized article content component
const MemoizedArticleContent = memo(function ArticleContent({
  article
}: {
  article: {
    title: string;
    lastUpdated: string;
    content: React.ReactNode;
  }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <CardDescription>
          Last updated: {article.lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        {article.content}
      </CardContent>
    </Card>
  )
})

// Memoized category card component
const MemoizedCategoryCard = memo(function CategoryCard({
  category,
}: {
  category: typeof docCategories[number];
}) {
  return (
    <Card key={category.id}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          {category.title}
        </CardTitle>
        <CardDescription>
          {category.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {category.articles.map(article => (
            <li key={article.id}>
              <Link 
                href={`/dashboard/help/documentation/${article.slug}`}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-muted rounded-md"
              >
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  {article.title}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
})

export default function DocumentationPage({ params }: { params?: { slug?: string[] } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeArticle, setActiveArticle] = useState<string | null>(null)
  const isOffline = useOfflineDetection()
  
  // Extract the article slug from params or path
  const slug = params?.slug?.[0] || null
  
  useEffect(() => {
    if (slug) {
      setActiveArticle(slug)
    } else {
      setActiveArticle(null)
    }
  }, [slug])
  
  // Find all articles for search functionality
  const allArticles = docCategories.flatMap(category => 
    category.articles.map(article => ({
      ...article,
      category: category.title,
    }))
  )
  
  // Filter articles based on search query
  const filteredArticles = searchQuery.length > 2
    ? allArticles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []
  
  // Find current article index and related articles for navigation
  const findArticleNavigation = () => {
    if (!activeArticle) return { prev: null, next: null }
    
    // Find all articles as a flat array
    const allArticles = docCategories.flatMap(category => category.articles)
    const currentIndex = allArticles.findIndex(article => article.slug === activeArticle)
    
    if (currentIndex === -1) return { prev: null, next: null }
    
    return {
      prev: currentIndex > 0 ? allArticles[currentIndex - 1] : null,
      next: currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null
    }
  }
  
  const { prev, next } = findArticleNavigation()
  
  const handleSwipeLeft = () => {
    if (next) {
      // Navigate to next article
      window.location.href = `/dashboard/help/documentation/${next.slug}`
      announceToScreenReader(`Navigating to ${next.title}`, "polite")
    }
  }
  
  const handleSwipeRight = () => {
    if (prev) {
      // Navigate to previous article
      window.location.href = `/dashboard/help/documentation/${prev.slug}`
      announceToScreenReader(`Navigating to ${prev.title}`, "polite")
    }
  }
  
  // If viewing an article
  if (activeArticle && articleContent[activeArticle]) {
    const article = articleContent[activeArticle]
    
    return (
      <div className="container py-10 max-w-5xl">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <Link 
              href="/dashboard/help/documentation" 
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Documentation
            </Link>
            
            <div className="flex items-center gap-2">
              <ShareButton 
                title={`ContentCreate Documentation: ${article.title}`}
                text={`Check out this documentation article: ${article.title}`}
                size="sm"
              />
              <KeyboardShortcutsDialog />
            </div>
          </div>
          
          <OfflineIndicator />
          
          {isOffline && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
              <p>You&apos;re currently offline. Some content may be limited.</p>
            </div>
          )}
          
          <SwipeContainer 
            onSwipeLeft={handleSwipeLeft} 
            onSwipeRight={handleSwipeRight}
          >
            <MemoizedArticleContent article={article} />
          </SwipeContainer>
          
          <div className="flex justify-between items-center border-t pt-6">
            {prev ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                asChild
              >
                <Link 
                  href={`/dashboard/help/documentation/${prev.slug}`}
                  aria-label={`Previous article: ${prev.title}`}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  {prev.title}
                </Link>
              </Button>
            ) : (
              <div aria-hidden="true" />
            )}
            
            {next ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                asChild
              >
                <Link 
                  href={`/dashboard/help/documentation/${next.slug}`}
                  aria-label={`Next article: ${next.title}`}
                >
                  {next.title}
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>
          
          {/* Mobile swipe indicator - only visible on small screens */}
          <div className="sm:hidden text-center text-xs text-muted-foreground pt-2">
            <p>Swipe left or right to navigate between articles</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Was this article helpful?</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackForm compact={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  // Documentation home view
  return (
    <div className="container py-10 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground">
              Comprehensive guides to help you use ContentCreate effectively
            </p>
          </div>
          
          <KeyboardShortcutsDialog />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input 
            placeholder="Search documentation..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documentation"
            role="searchbox"
          />
        </div>
        
        {searchQuery.length > 2 && (
          <Card className="mt-2">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">
                Search Results
              </CardTitle>
              {filteredArticles.length > 0 ? (
                <CardDescription>
                  Found {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {filteredArticles.length > 0 ? (
                <ul className="space-y-2" role="listbox" aria-label="Search results">
                  {filteredArticles.map(article => (
                    <li key={article.id} role="option" aria-selected={activeArticle === article.slug}>
                      <Link 
                        href={`/dashboard/help/documentation/${article.slug}`}
                        className="flex items-center py-2 px-2 hover:bg-muted rounded-md"
                        aria-label={`${article.title} in ${article.category}`}
                      >
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <div>{article.title}</div>
                          <div className="text-xs text-muted-foreground">{article.category}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground py-2" role="status">No results found for &quot;{searchQuery}&quot;</p>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docCategories.map(category => (
            <MemoizedCategoryCard key={category.id} category={category} />
          ))}
        </div>
        
        <ContextualHelp
          title="Using the Documentation"
          content={
            <div className="space-y-2">
              <p>Our documentation is organized by topic and provides detailed guides for using all ContentCreate features.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the search box to quickly find specific topics</li>
                <li>Browse categories to explore available guides</li>
                <li>Provide feedback on articles to help us improve our documentation</li>
              </ul>
              <p>Can&apos;t find what you&apos;re looking for? <Link href="/dashboard/help/contact" className="text-primary hover:underline">Contact our support team</Link>.</p>
            </div>
          }
          interactive={true}
          expanded={true}
        >
          <Card className="bg-muted/50 mt-6">
            <CardHeader>
              <CardTitle>Need more help?</CardTitle>
              <CardDescription>
                If you can&apos;t find the information you need in our documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button variant="outline" className="sm:flex-1" asChild>
                <Link href="/dashboard/help/faqs">
                  View FAQs
                </Link>
              </Button>
              <Button className="sm:flex-1" asChild>
                <Link href="/dashboard/help/contact">
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </ContextualHelp>
      </div>
    </div>
  )
} 