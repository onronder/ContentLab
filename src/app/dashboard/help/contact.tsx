"use client"

import * as React from "react"
import { SupportTicketForm } from "@/components/help/support-ticket-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Phone, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container py-10 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contact Support</h1>
          <p className="text-muted-foreground">
            Get in touch with our support team for help with any issues or questions you might have.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Send us an email and we&apos;ll get back to you within 24 hours.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@contentcreate.com">
                  Email Us
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <MessageSquare className="mr-2 h-4 w-4" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with our support team for immediate assistance.
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Phone className="mr-2 h-4 w-4" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                For urgent issues, call our support team directly.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:+18005551234">
                  Call Us
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Support Hours</CardTitle>
            <CardDescription>
              Our team is available during the following hours:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Standard Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM EST
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Weekend: Email support only
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Premium Support</h3>
                  <p className="text-sm text-muted-foreground">
                    24/7 Support for Enterprise customers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Priority response times
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Tabs defaultValue="support-ticket">
            <TabsList className="mb-4">
              <TabsTrigger value="support-ticket">Support Ticket</TabsTrigger>
              <TabsTrigger value="frequently-asked">Frequently Asked Questions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="support-ticket">
              <SupportTicketForm />
            </TabsContent>
            
            <TabsContent value="frequently-asked">
              <FrequentlyAskedSupport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function FrequentlyAskedSupport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Support Questions</CardTitle>
        <CardDescription>
          Quick answers to frequently asked support questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <h3 className="font-medium">What information should I include in my support ticket?</h3>
          <p className="text-sm text-muted-foreground">
            Please include detailed steps to reproduce the issue, any error messages you received, screenshots if possible, and what you were trying to accomplish. This helps us resolve your issue faster.
          </p>
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-medium">How quickly will I get a response?</h3>
          <p className="text-sm text-muted-foreground">
            For standard support, we aim to respond within 24 business hours. For urgent issues, please mark your ticket as high priority or use the phone support option.
          </p>
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-medium">Can I upgrade my support plan?</h3>
          <p className="text-sm text-muted-foreground">
            Yes, you can upgrade to premium support through your account settings under Billing &amp; Subscription. This gives you 24/7 support and priority response times.
          </p>
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-medium">What if I need immediate assistance?</h3>
          <p className="text-sm text-muted-foreground">
            For urgent issues that require immediate attention, please use the phone support option or mark your ticket as &quot;Critical&quot; when submitting.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 