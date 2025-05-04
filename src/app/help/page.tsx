"use client"

import * as React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { HelpCenter } from "@/components/help/help-center"
import { FAQAccordion } from "@/components/help/faq-accordion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col space-y-4 md:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers to common questions and learn how to use our platform effectively
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for help topics..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>Learn the basics of our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Platform Overview
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Creating Your First Project
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Running Your First Analysis
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Common Tasks</CardTitle>
              <CardDescription>Step-by-step guides for everyday needs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Managing Projects
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Working with Reports
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Interpreting Analysis Results
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Need More Help?</CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
              <p className="text-sm text-muted-foreground">
                Can&apos;t find what you&apos;re looking for? Our support team is ready to help.
              </p>
              <Button>Contact Support</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="documentation" className="mt-8">
          <TabsList className="mb-4">
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="tutorials">Video Tutorials</TabsTrigger>
          </TabsList>
          <TabsContent value="documentation">
            <HelpCenter searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="faqs">
            <FAQAccordion searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="tutorials">
            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>
                  Learn through step-by-step video guides
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Tutorial Preview</p>
                </div>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Tutorial Preview</p>
                </div>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Tutorial Preview</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-muted rounded-lg p-6 mt-4 flex items-start gap-4">
          <Lightbulb className="h-6 w-6 text-yellow-500 shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium mb-2">Did you know?</h3>
            <p className="text-muted-foreground">
              You can access contextual help throughout the platform by clicking on the question mark icons 
              next to features or section headers. Try it out!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 