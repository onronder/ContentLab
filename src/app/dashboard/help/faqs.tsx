"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FeedbackForm } from "@/components/help/feedback-form"

// List of FAQ categories
const faqCategories = [
  { id: "general", name: "General" },
  { id: "accounts", name: "Accounts & Billing" },
  { id: "projects", name: "Projects" },
  { id: "analysis", name: "Analysis" },
  { id: "reports", name: "Reports" },
  { id: "technical", name: "Technical" },
]

// FAQ data
const faqs: {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: string;
  tags: string[];
}[] = [
  {
    id: "faq-1",
    question: "What is the Content Roadmap Tool?",
    answer: (
      <p>
        The Content Roadmap Tool is a comprehensive platform designed to help content creators,
        marketers, and SEO professionals plan, analyze, and optimize their content strategy.
        It provides tools for content gap analysis, topic clustering, keyword research, and
        competitor analysis to help you create more effective content.
      </p>
    ),
    category: "general",
    tags: ["overview", "basics"]
  },
  {
    id: "faq-2",
    question: "How do I create a new project?",
    answer: (
      <div className="space-y-2">
        <p>To create a new project:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Navigate to the Projects section from the dashboard sidebar</li>
          <li>Click the &quot;New Project&quot; button in the top right corner</li>
          <li>Fill in the project details including name, description, and goals</li>
          <li>Add competitor websites if applicable</li>
          <li>Configure analysis settings based on your needs</li>
          <li>Click &quot;Create Project&quot; to finish setup</li>
        </ol>
        <p>Once created, you&apos;ll be taken to your project dashboard where you can start your first analysis.</p>
      </div>
    ),
    category: "projects",
    tags: ["projects", "setup"]
  },
  {
    id: "faq-3",
    question: "What is content gap analysis?",
    answer: (
      <div className="space-y-2">
        <p>
          Content gap analysis identifies topics your audience is searching for that your website
          doesn&apos;t currently cover. It helps you discover new content opportunities by comparing
          your content coverage against top competitors.
        </p>
        <p>
          Our platform analyzes keyword rankings, content topics, and search intent to identify areas
          where competitors are ranking for valuable keywords that your site isn&apos;t targeting.
          The analysis considers search volume, keyword difficulty, and user intent to prioritize
          the most valuable content opportunities.
        </p>
      </div>
    ),
    category: "analysis",
    tags: ["analysis", "content gaps"]
  },
  {
    id: "faq-4",
    question: "How often is the keyword data updated?",
    answer: (
      <p>
        Our keyword database is updated monthly to ensure you have access to the most current
        search volume and competition metrics. For certain high-volatility industries, we provide
        bi-weekly updates. The last update date is always displayed in your dashboard.
      </p>
    ),
    category: "technical",
    tags: ["keywords", "data"]
  },
  {
    id: "faq-5",
    question: "Can I export reports?",
    answer: (
      <div className="space-y-2">
        <p>
          Yes, you can export any report in multiple formats:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>PDF:</strong> For presentation-ready documents</li>
          <li><strong>CSV/Excel:</strong> For data analysis in spreadsheet applications</li>
          <li><strong>Interactive HTML:</strong> For sharing dynamic reports with team members</li>
        </ul>
        <p>
          To export a report, go to the Reports section, select a report, and click on the
          &quot;Export&quot; button. You can also schedule automated exports to be delivered to your email.
        </p>
      </div>
    ),
    category: "reports",
    tags: ["reports", "export"]
  },
  {
    id: "faq-6",
    question: "How do I add team members to my account?",
    answer: (
      <div className="space-y-2">
        <p>Team members can be added under Settings &gt; Team Management:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click &apos;Invite Team Member&apos;</li>
          <li>Enter their email address</li>
          <li>Select the appropriate role (Admin, Editor, or Viewer)</li>
          <li>Click &apos;Send Invitation&apos;</li>
        </ol>
        <p>
          Each subscription plan has a limit on team members: Starter (2), Professional (5),
          and Enterprise (unlimited). Team members will receive an email invitation to join
          your workspace.
        </p>
      </div>
    ),
    category: "accounts",
    tags: ["team", "collaboration"]
  },
  {
    id: "faq-7",
    question: "How do I interpret the analysis results?",
    answer: (
      <div className="space-y-2">
        <p>
          Analysis results are organized into several sections:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Overview Dashboard:</strong> Shows key metrics and summary of findings</li>
          <li><strong>Content Gaps:</strong> Topics your audience searches for that aren&apos;t covered on your site</li>
          <li><strong>Competitor Analysis:</strong> How your content compares to competitors</li>
          <li><strong>Topic Clusters:</strong> Related topics that could be grouped together</li>
          <li><strong>Recommendations:</strong> Prioritized actions to improve your content strategy</li>
        </ul>
        <p>
          Each section includes visualizations and detailed data tables. Hover over charts for
          additional information, and use the filters to focus on specific aspects of the analysis.
        </p>
      </div>
    ),
    category: "analysis",
    tags: ["analysis", "results", "interpretation"]
  },
  {
    id: "faq-8",
    question: "What subscription plans do you offer?",
    answer: (
      <div className="space-y-2">
        <p>We offer multiple pricing tiers based on your needs:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Starter ($49/month):</strong> Basic analysis capabilities, up to 3 projects, 2 team members</li>
          <li><strong>Professional ($99/month):</strong> Advanced features like competitor analysis and scheduled reports, up to 10 projects, 5 team members</li>
          <li><strong>Enterprise ($299+/month):</strong> Custom features, unlimited projects and team members, dedicated support</li>
        </ul>
        <p>All plans come with a 14-day free trial. Visit our pricing page for a full comparison of features.</p>
      </div>
    ),
    category: "accounts",
    tags: ["pricing", "plans", "subscription"]
  },
  {
    id: "faq-9",
    question: "How many projects can I create?",
    answer: (
      <p>
        The number of projects you can create depends on your subscription plan. Starter plans
        allow up to 3 projects, Professional plans allow up to 10 projects, and Enterprise plans
        have unlimited projects. You can view your current usage and limits in your account dashboard.
      </p>
    ),
    category: "projects",
    tags: ["projects", "limits"]
  },
  {
    id: "faq-10",
    question: "How do I change my password?",
    answer: (
      <div className="space-y-2">
        <p>To change your password:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Go to Settings &gt; Account &gt; Security</li>
          <li>Click on &apos;Change Password&apos;</li>
          <li>Enter your current password for verification</li>
          <li>Enter and confirm your new password</li>
          <li>Click &apos;Update Password&apos;</li>
        </ol>
        <p>
          Password requirements include a minimum of 8 characters with at least one uppercase letter,
          one number, and one special character.
        </p>
      </div>
    ),
    category: "accounts",
    tags: ["security", "password"]
  },
  {
    id: "faq-11",
    question: "Can I cancel my subscription at any time?",
    answer: (
      <p>
        Yes, you can cancel your subscription at any time. When you cancel, you&apos;ll continue
        to have access until the end of your current billing period. We don&apos;t offer prorated
        refunds for partial months. To cancel, go to Settings &gt; Billing &gt; Subscription and
        click the &apos;Cancel Subscription&apos; button.
      </p>
    ),
    category: "accounts",
    tags: ["billing", "subscription", "cancellation"]
  },
  {
    id: "faq-12",
    question: "How can I get help if I have a problem?",
    answer: (
      <div className="space-y-2">
        <p>We offer several ways to get support:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Help Center:</strong> Browse documentation and tutorials</li>
          <li><strong>Email Support:</strong> Contact support@contentcreate.com</li>
          <li><strong>Support Ticket:</strong> Submit a detailed help request</li>
          <li><strong>Live Chat:</strong> Available during business hours</li>
        </ul>
        <p>
          Enterprise customers also have access to priority support with dedicated account managers
          and faster response times.
        </p>
      </div>
    ),
    category: "general",
    tags: ["support", "help"]
  },
]

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  
  // Filter FAQs based on search query and active category
  const filteredFAQs = React.useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = searchQuery === "" || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="container py-10 max-w-5xl">
      <Link 
        href="/dashboard/help" 
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Help Center
      </Link>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about the Content Roadmap Tool
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search for answers..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
          >
            All Categories
          </Button>
          {faqCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        {filteredFAQs.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {activeCategory === "all" 
                  ? "All FAQs" 
                  : faqCategories.find(c => c.id === activeCategory)?.name || "All FAQs"}
              </CardTitle>
              {searchQuery && (
                <CardDescription>
                  Showing results for &quot;{searchQuery}&quot;
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4">
                        <div className="text-muted-foreground mb-4">
                          {faq.answer}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Didn&apos;t find what you&apos;re looking for?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                If you couldn&apos;t find an answer to your question, you can submit a support ticket or contact our team directly.
              </p>
              <Button asChild className="shrink-0">
                <Link href="/dashboard/help/contact">
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-4">
          <FeedbackForm compact={true} />
        </div>
      </div>
    </div>
  )
} 