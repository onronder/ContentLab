"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, FileText, BookOpen, Code, ArrowRight, ChevronRight, Lightbulb } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardDocumentationPage() {
  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">
            Comprehensive guides and references for the Content Roadmap Tool
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search documentation..." 
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="p-4 pt-0">
                  <nav className="space-y-1">
                    {[
                      { icon: <FileText className="h-4 w-4" />, label: "Getting Started", active: true },
                      { icon: <BookOpen className="h-4 w-4" />, label: "User Guide", active: false },
                      { icon: <Code className="h-4 w-4" />, label: "API Reference", active: false },
                      { icon: <Lightbulb className="h-4 w-4" />, label: "Tutorials", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Content Gap Analysis", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Competitive Analysis", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Topic Clusters", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Keyword Research", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Reports & Analytics", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "User Management", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Settings & Preferences", active: false },
                      { icon: <FileText className="h-4 w-4" />, label: "Troubleshooting", active: false },
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href="#"
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          item.active 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Learn the basics of the Content Roadmap Tool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h2>Introduction</h2>
                  <p>
                    Welcome to the Content Roadmap Tool documentation. This guide will help you understand
                    the platform&apos;s capabilities and how to use its features effectively to improve your
                    content strategy.
                  </p>
                  
                  <h3>What is the Content Roadmap Tool?</h3>
                  <p>
                    The Content Roadmap Tool is a comprehensive platform designed to help content creators,
                    marketers, and SEO professionals plan, analyze, and optimize their content strategy.
                    It provides tools for content gap analysis, topic clustering, keyword research, and
                    competitor analysis.
                  </p>
                  
                  <h3>Core Features</h3>
                  <ul>
                    <li><strong>Content Gap Analysis:</strong> Identify topics your audience searches for that your site doesn&apos;t cover</li>
                    <li><strong>Competitor Analysis:</strong> Compare your content against competitors to find opportunities</li>
                    <li><strong>Topic Clusters:</strong> Build authoritative content structures around core topics</li>
                    <li><strong>Keyword Research:</strong> Discover valuable keywords with search volume and difficulty metrics</li>
                    <li><strong>Content Performance:</strong> Track how your content performs across key metrics</li>
                    <li><strong>Strategic Reports:</strong> Generate insights to guide your content efforts</li>
                  </ul>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 mt-6">
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Setting Up Your Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Learn how to configure your account settings and preferences.
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Account Setup Guide <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Your First Project</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Step-by-step guide to creating and configuring your first content project.
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Project Creation Guide <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900 mt-4 flex gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium">Pro Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the keyboard shortcut <kbd className="px-1 py-0.5 text-xs rounded bg-muted border">?</kbd> at 
                      any time to view all available keyboard shortcuts and speed up your workflow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Documentation Updates</CardTitle>
                <CardDescription>Latest changes and additions to our documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {[
                    { 
                      title: "New API Endpoints for Content Analysis", 
                      date: "October 15, 2023",
                      description: "Documentation for the new content analysis API endpoints." 
                    },
                    { 
                      title: "Advanced Filtering Options Guide", 
                      date: "October 10, 2023",
                      description: "Learn how to use the new advanced filtering options for more precise content gap analysis." 
                    },
                    { 
                      title: "Topic Cluster Visualization Guide", 
                      date: "October 5, 2023",
                      description: "Guide for using the new topic cluster visualization tools." 
                    },
                  ].map((item, index) => (
                    <li key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <Button variant="link" className="p-0 h-auto text-sm mt-1">
                        Read more <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 