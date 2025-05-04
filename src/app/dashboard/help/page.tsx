"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { HelpCircle, FileText, Video, Mail, ExternalLink, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ContextualHelp, WhatsThisLink } from "@/components/ui/contextual-help"
import { FeedbackForm } from "@/components/help/feedback-form"
import { KeyboardShortcutsDialog } from "@/components/help/keyboard-shortcuts"

export default function DashboardHelpPage() {
  return (
    <div className="container py-10 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            <KeyboardShortcutsDialog />
          </div>
          <p className="text-muted-foreground">
            Find answers to your questions and learn how to use our platform effectively.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="support">Contact Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>Get started with the Content Roadmap Tool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Content Roadmap Tool is a comprehensive platform designed to help you plan, analyze, 
                  and optimize your content strategy. With our suite of tools, you can identify content gaps, 
                  analyze competitors, and generate strategic recommendations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card className="flex flex-col items-center text-center p-4">
                    <HelpCircle className="h-12 w-12 text-primary mb-2" />
                    <h3 className="text-lg font-medium mb-1">Getting Started</h3>
                    <p className="text-sm text-muted-foreground mb-3">Learn the basics of the platform</p>
                    <Button variant="outline" size="sm" className="mt-auto">View Guide</Button>
                  </Card>
                  
                  <Card className="flex flex-col items-center text-center p-4">
                    <FileText className="h-12 w-12 text-primary mb-2" />
                    <h3 className="text-lg font-medium mb-1">Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-3">Detailed feature documentation</p>
                    <Button variant="outline" size="sm" className="mt-auto" asChild>
                      <Link href="/dashboard/help/documentation">Browse Docs</Link>
                    </Button>
                  </Card>
                  
                  <Card className="flex flex-col items-center text-center p-4">
                    <Video className="h-12 w-12 text-primary mb-2" />
                    <h3 className="text-lg font-medium mb-1">Video Tutorials</h3>
                    <p className="text-sm text-muted-foreground mb-3">Step-by-step visual guides</p>
                    <Button variant="outline" size="sm" className="mt-auto">Watch Videos</Button>
                  </Card>
                </div>

                <ContextualHelp
                  title="Finding Help"
                  content={
                    <div className="space-y-2">
                      <p>The Help Center provides several ways to get assistance:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Browse documentation organized by feature</li>
                        <li>Search for specific topics or questions</li>
                        <li>Watch video tutorials for visual guidance</li>
                        <li>Contact support for personalized help</li>
                      </ul>
                      <p>Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border">?</kbd> anywhere in the app to view keyboard shortcuts.</p>
                    </div>
                  }
                  interactive={true}
                  expanded={true}
                >
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted mt-6">
                    <h3 className="font-medium mb-2 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      New User Resources
                    </h3>
                    <ul className="space-y-2 pl-7 list-disc text-sm text-muted-foreground">
                      <li>
                        <Link href="/dashboard/documentation" className="text-primary hover:underline">
                          Platform Quick Start Guide
                        </Link>
                      </li>
                      <li>
                        <Link href="/dashboard/documentation" className="text-primary hover:underline">
                          Creating Your First Project
                        </Link>
                      </li>
                      <li>
                        <Link href="/dashboard/documentation" className="text-primary hover:underline">
                          Understanding Analysis Results
                        </Link>
                      </li>
                      <li>
                        <Link href="/dashboard/documentation" className="text-primary hover:underline">
                          Content Strategy Basics
                        </Link>
                      </li>
                    </ul>
                  </div>
                </ContextualHelp>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="faqs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How do I create a new project?</h3>
                    <p className="text-muted-foreground">
                      Navigate to the Projects section from the dashboard sidebar and click the &quot;New Project&quot; 
                      button in the top right corner. Fill in the project details and click &quot;Create Project&quot;.
                    </p>
                    <WhatsThisLink 
                      content="A project helps you organize your content analysis and strategy for a specific website or content initiative."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">What is content gap analysis?</h3>
                    <p className="text-muted-foreground">
                      Content gap analysis identifies topics your audience is searching for that your website 
                      doesn&apos;t currently cover. It helps you discover new content opportunities.
                    </p>
                    <WhatsThisLink 
                      content="Content gaps represent missed opportunities to reach your audience with valuable information they're actively searching for."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How often is the data updated?</h3>
                    <p className="text-muted-foreground">
                      Our keyword data is updated monthly to ensure you have access to the most current 
                      search volume and competition metrics. For high-volatility industries, we provide 
                      bi-weekly updates.
                    </p>
                  </div>
                  
                  <div className="pb-4">
                    <h3 className="font-medium mb-2">Can I export reports?</h3>
                    <p className="text-muted-foreground">
                      Yes, you can export any report in PDF, CSV, or interactive format. Go to the Reports 
                      section, select a report, and click on the &quot;Export&quot; button.
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/help/faqs">
                    View All FAQs <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <FeedbackForm compact={true} />
            </div>
          </TabsContent>
          
          <TabsContent value="tutorials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Learn through step-by-step guides</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-muted-foreground font-medium mb-2">Platform Overview Tutorial</p>
                      <Button size="sm">Watch Video</Button>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-muted-foreground font-medium mb-2">Content Gap Analysis Tutorial</p>
                      <Button size="sm">Watch Video</Button>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-muted-foreground font-medium mb-2">Competitor Analysis Tutorial</p>
                      <Button size="sm">Watch Video</Button>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-muted-foreground font-medium mb-2">Report Generation Tutorial</p>
                      <Button size="sm">Watch Video</Button>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Browse All Tutorials <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help from our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Our support team is available to help you with any questions or issues you might have.
                  We typically respond within 24 hours on business days.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card className="p-4 flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground">support@contentcreate.com</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 flex items-center gap-4">
                    <HelpCircle className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">Help Desk</h3>
                      <p className="text-sm text-muted-foreground">Submit a ticket for complex issues</p>
                    </div>
                  </Card>
                </div>
                
                <Button className="w-full mt-4" asChild>
                  <Link href="/dashboard/help/contact">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Contact Support Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Share Your Feedback</CardTitle>
                <CardDescription>Help us improve the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <FeedbackForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 