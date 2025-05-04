"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WelcomeFlow } from "@/components/onboarding/welcome-flow"
import { GuidedTour, dashboardTourSteps } from "@/components/onboarding/guided-tour"
import { SampleProjectGenerator } from "@/components/onboarding/sample-project-generator"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const router = useRouter()
  const [showTour, setShowTour] = useState(false)
  
  const handleWelcomeComplete = () => {
    toast({
      title: "Welcome flow completed",
      description: "Your preferences have been saved.",
    })
  }
  
  const handleProjectGenerated = (projectId: string) => {
    toast({
      title: "Sample project created",
      description: "You can now explore the platform with sample data.",
    })
    router.push(`/dashboard/projects/${projectId}`)
  }
  
  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">
            Explore the onboarding components and get started with the platform.
          </p>
        </div>
        
        <Tabs defaultValue="welcome" className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="welcome">Welcome Flow</TabsTrigger>
            <TabsTrigger value="guided-tour">Guided Tour</TabsTrigger>
            <TabsTrigger value="sample-project">Sample Project</TabsTrigger>
          </TabsList>
          
          <TabsContent value="welcome">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Welcome Flow</CardTitle>
                <CardDescription>
                  A step-by-step welcome process for new users to set up their profile and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WelcomeFlow 
                  onComplete={handleWelcomeComplete} 
                  onSkip={() => toast({
                    title: "Welcome flow skipped",
                    description: "You can complete your profile later in settings.",
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guided-tour">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Guided Platform Tour</CardTitle>
                <CardDescription>
                  Interactive tour to help users discover key features and functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <div className="text-center max-w-md">
                  <p className="text-muted-foreground mb-6">
                    The guided tour highlights important elements of the interface with interactive tooltips.
                    It&apos;s best experienced on the actual dashboard.
                  </p>
                  <Button 
                    onClick={() => setShowTour(true)}
                    className="mx-auto"
                  >
                    Start Demo Tour
                  </Button>
                  
                  {/* Adding some target elements for the demo tour */}
                  <div className="hidden">
                    <div className="dashboard-header">Dashboard header</div>
                    <div className="sidebar-navigation">Sidebar navigation</div>
                    <div className="quota-usage-widget">Quota usage</div>
                    <div className="create-project-button">Create project</div>
                    <div className="recent-activity">Recent activity</div>
                  </div>
                  
                  {showTour && (
                    <GuidedTour
                      steps={dashboardTourSteps}
                      isOpen={true}
                      onComplete={() => {
                        setShowTour(false)
                        toast({
                          title: "Tour completed",
                          description: "You&apos;ve completed the guided tour!",
                        })
                      }}
                      onSkip={() => {
                        setShowTour(false)
                        toast({
                          title: "Tour skipped",
                          description: "You can restart the tour anytime from the help menu.",
                        })
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sample-project">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Sample Project Generator</CardTitle>
                <CardDescription>
                  Create pre-populated demo projects to explore the platform&apos;s features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SampleProjectGenerator 
                  onComplete={handleProjectGenerated}
                  onCancel={() => toast({
                    description: "Sample project creation cancelled.",
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 