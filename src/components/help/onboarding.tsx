"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronRight, X } from "lucide-react"
import { GuidedTour, TourStep } from "@/components/help/guided-tour"

interface OnboardingProps {
  userId: string
  userName?: string
}

export function Onboarding({ userId, userName }: OnboardingProps) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  
  // Check if this is the user's first time
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(`onboarding-complete-${userId}`) === "true"
    if (!hasCompletedOnboarding) {
      setShowWelcome(true)
    } else {
      setOnboardingComplete(true)
    }
  }, [userId])
  
  const completeOnboarding = () => {
    localStorage.setItem(`onboarding-complete-${userId}`, "true")
    setOnboardingComplete(true)
    setShowWelcome(false)
  }
  
  const welcomeSteps = [
    {
      title: "Welcome to ContentCreate",
      description: "Let's get you started with our platform. We'll guide you through the main features.",
    },
    {
      title: "Content Analysis",
      description: "Analyze your content against competitors to find gaps and opportunities.",
    },
    {
      title: "Content Strategy",
      description: "Generate content ideas and build a comprehensive content strategy.",
    },
    {
      title: "Reports",
      description: "Track your progress and generate detailed reports for your team.",
    },
  ]
  
  // Example dashboard tour steps - these would need to be adjusted based on your actual UI
  const dashboardTourSteps: TourStep[] = [
    {
      id: "dashboard-overview",
      title: "Dashboard Overview",
      description: "This is your main dashboard where you can see your content performance at a glance.",
      targetSelector: ".dashboard-overview",
      position: "bottom",
    },
    {
      id: "create-project",
      title: "Create a Project",
      description: "Start by creating a new project for your website analysis.",
      targetSelector: ".create-project-button",
      position: "left",
    },
    {
      id: "analysis-section",
      title: "Analysis Section",
      description: "Here you'll find all your content analyses and results.",
      targetSelector: ".analysis-section",
      position: "right",
    },
    {
      id: "help-center",
      title: "Help Center",
      description: "Access documentation, tutorials, and support when you need it.",
      targetSelector: ".help-center-link",
      position: "top",
    },
  ]
  
  // Close welcome and potentially start guided tour
  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    // Optionally auto-start the guided tour here
  }

  return (
    <>
      {/* Welcome modal for first-time users */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="absolute top-4 right-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setShowWelcome(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <div className="my-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold">
                  Welcome{userName ? `, ${userName}` : ""}!
                </h2>
                <p className="text-muted-foreground">
                  Let&apos;s get you started with ContentCreate
                </p>
              </div>
            </div>
            
            <div className="mt-6 mb-4">
              <div className="flex space-x-2 mb-4">
                {welcomeSteps.map((_, index) => (
                  <div 
                    key={index} 
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= onboardingStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              
              <Card className="border-none shadow-none">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-2">
                    {welcomeSteps[onboardingStep].title}
                  </h3>
                  <p className="text-muted-foreground">
                    {welcomeSteps[onboardingStep].description}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={completeOnboarding}
              >
                Skip Tour
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setOnboardingStep(Math.max(0, onboardingStep - 1))}
                  disabled={onboardingStep === 0}
                >
                  Previous
                </Button>
                
                {onboardingStep < welcomeSteps.length - 1 ? (
                  <Button onClick={() => setOnboardingStep(onboardingStep + 1)}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleWelcomeComplete}>
                    Get Started <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Guided tour for the dashboard */}
      {!showWelcome && !onboardingComplete && (
        <GuidedTour
          tourId={`dashboard-tour-${userId}`}
          steps={dashboardTourSteps}
          onComplete={completeOnboarding}
          autoStart={true}
        />
      )}
    </>
  )
} 