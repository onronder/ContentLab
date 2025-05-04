"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// Mock FAQ data types
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface FAQCategories {
  [key: string]: FAQ[];
}

// Mock FAQ data - in a real app this would come from an API or CMS
const FAQ_DATA: FAQCategories = {
  general: [
    {
      id: "g1",
      question: "What is the Content Roadmap Tool?",
      answer: "The Content Roadmap Tool is a comprehensive platform designed to help content creators, marketers, and SEO professionals plan, analyze, and optimize their content strategy. It provides tools for content gap analysis, topic clustering, keyword research, and competitor analysis.",
      category: "general",
      tags: ["basics", "overview"]
    },
    {
      id: "g2",
      question: "How much does it cost?",
      answer: "We offer multiple pricing tiers based on your needs. Our Starter plan begins at $49/month and includes basic analysis capabilities. The Professional plan at $99/month adds advanced features like competitor analysis and scheduled reports. Enterprise plans with custom features start at $299/month. All plans come with a 14-day free trial.",
      category: "general",
      tags: ["pricing", "plans", "subscription"]
    },
    {
      id: "g3",
      question: "Can I cancel my subscription at any time?",
      answer: "Yes, you can cancel your subscription at any time. When you cancel, you'll continue to have access until the end of your current billing period. We don't offer prorated refunds for partial months.",
      category: "general",
      tags: ["billing", "subscription"]
    }
  ],
  technical: [
    {
      id: "t1",
      question: "How often is the keyword data updated?",
      answer: "Our keyword database is updated on a monthly basis to ensure you have access to the most current search volume and competition metrics. For certain high-volatility industries, we provide bi-weekly updates. The last update date is always displayed in your dashboard.",
      category: "technical",
      tags: ["keywords", "data"]
    },
    {
      id: "t2",
      question: "How many projects can I create?",
      answer: "The number of projects you can create depends on your subscription plan. Starter plans allow up to 3 projects, Professional plans allow up to 10 projects, and Enterprise plans have unlimited projects. You can view your current usage and limits in your account dashboard.",
      category: "technical",
      tags: ["projects", "limits"]
    },
    {
      id: "t3",
      question: "How is the content gap analysis performed?",
      answer: "Our content gap analysis compares your website's content coverage against top-ranking competitors in your niche. We analyze keyword rankings, content topics, and search intent to identify areas where competitors are ranking for valuable keywords that your site isn't targeting. The analysis considers search volume, keyword difficulty, and user intent to prioritize the most valuable content opportunities.",
      category: "technical",
      tags: ["analysis", "content gaps", "methodology"]
    }
  ],
  account: [
    {
      id: "a1",
      question: "How do I change my password?",
      answer: "To change your password, go to Settings > Account > Security, then click on 'Change Password'. You'll need to enter your current password for verification before setting a new one. Password requirements include a minimum of 8 characters with at least one uppercase letter, one number, and one special character.",
      category: "account",
      tags: ["security", "password"]
    },
    {
      id: "a2",
      question: "How do I add team members to my account?",
      answer: "Team members can be added under Settings > Team Management. Click 'Invite Team Member' and enter their email address along with the appropriate role (Admin, Editor, or Viewer). Each subscription plan has a limit on team members: Starter (2), Professional (5), and Enterprise (unlimited). Team members will receive an email invitation to join your workspace.",
      category: "account",
      tags: ["team", "collaboration"]
    }
  ]
}

interface FAQAccordionProps {
  searchQuery?: string;
}

export function FAQAccordion({ searchQuery = "" }: FAQAccordionProps) {
  const [activeCategory, setActiveCategory] = useState("general")
  const [loading, setLoading] = useState(true)
  const [filteredFAQs, setFilteredFAQs] = useState<FAQCategories>(FAQ_DATA)
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Filter FAQs by search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredFAQs(FAQ_DATA)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = Object.entries(FAQ_DATA).reduce((acc: FAQCategories, [category, faqs]) => {
      const matchingFAQs = faqs.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query) ||
          faq.tags.some(tag => tag.toLowerCase().includes(query))
      )
      
      if (matchingFAQs.length > 0) {
        acc[category] = matchingFAQs
      }
      
      return acc
    }, {})
    
    setFilteredFAQs(filtered)
  }, [searchQuery])
  
  // Get category names for display
  const getCategoryName = (category: string) => {
    switch (category) {
      case "general": return "General Questions"
      case "technical": return "Technical Questions"
      case "account": return "Account & Billing"
      default: return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }
  
  // Gets all available categories after filtering
  const availableCategories = Object.keys(filteredFAQs)
  
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (Object.keys(filteredFAQs).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
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
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>
          {searchQuery 
            ? `Showing results for &quot;${searchQuery}&quot;`
            : "Find answers to common questions"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-6">
            {Object.keys(filteredFAQs).map(category => (
              <TabsTrigger key={category} value={category}>
                {getCategoryName(category)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(filteredFAQs).map(([category, faqs]) => (
            <TabsContent key={category} value={category}>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map(faq => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-3">
                        <p className="text-muted-foreground mb-4">{faq.answer}</p>
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
} 