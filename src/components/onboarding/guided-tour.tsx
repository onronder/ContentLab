"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TourStep {
  target: string
  title: string
  content: string
  placement?: "top" | "right" | "bottom" | "left"
  spotlightPadding?: number
}

interface GuidedTourProps {
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
  isOpen?: boolean
  initialStep?: number
  className?: string
}

export function GuidedTour({
  steps,
  onComplete,
  onSkip,
  isOpen = false,
  initialStep = 0,
  className,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(isOpen)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipStyle, setTooltipStyle] = useState({})
  
  // Reset state when steps change
  useEffect(() => {
    if (isOpen) {
      setIsActive(true)
      setCurrentStep(initialStep)
    }
  }, [isOpen, initialStep])
  
  // Calculate the position of the target element
  useEffect(() => {
    if (!isActive || !steps[currentStep]) return
    
    const targetElement = document.querySelector(steps[currentStep].target)
    if (!targetElement) return
    
    const { top, left, width, height } = targetElement.getBoundingClientRect()
    const padding = steps[currentStep].spotlightPadding || 8
    
    // Calculate tooltip position based on placement
    const placement = steps[currentStep].placement || 'bottom'
    const tooltipWidth = 320
    const tooltipHeight = 150
    const margin = 12
    
    let tooltipTop = 0
    let tooltipLeft = 0
    
    switch (placement) {
      case 'top':
        tooltipTop = top - tooltipHeight - margin + window.scrollY
        tooltipLeft = left + (width / 2) - (tooltipWidth / 2) + window.scrollX
        break
      case 'right':
        tooltipTop = top + (height / 2) - (tooltipHeight / 2) + window.scrollY
        tooltipLeft = left + width + margin + window.scrollX
        break
      case 'bottom':
        tooltipTop = top + height + margin + window.scrollY
        tooltipLeft = left + (width / 2) - (tooltipWidth / 2) + window.scrollX
        break
      case 'left':
        tooltipTop = top + (height / 2) - (tooltipHeight / 2) + window.scrollY
        tooltipLeft = left - tooltipWidth - margin + window.scrollX
        break
    }
    
    setPosition({
      top: top - padding,
      left: left - padding,
      width: width + (padding * 2),
      height: height + (padding * 2),
    })
    
    setTooltipStyle({
      top: tooltipTop,
      left: tooltipLeft,
    })
    
    // Scroll the target element into view if needed
    if (
      tooltipTop < window.scrollY ||
      tooltipTop > window.scrollY + window.innerHeight
    ) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isActive, currentStep, steps])
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSkip = () => {
    setIsActive(false)
    if (onSkip) onSkip()
  }
  
  const handleComplete = () => {
    setIsActive(false)
    if (onComplete) onComplete()
  }
  
  if (!isActive || !steps.length) return null
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        {/* Spotlight */}
        <div
          className="absolute rounded-md z-[51] border-2 border-primary transition-all duration-300 pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
      
      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-[52] w-80 rounded-lg border bg-card text-card-foreground shadow-lg",
          className
        )}
        style={tooltipStyle}
      >
        <div className="flex flex-col p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">
              {steps[currentStep].title}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            {steps[currentStep].content}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-medium">
              {currentStep + 1} of {steps.length}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePrevious}
                >
                  Back
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={handleNext}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Example tour steps
export const dashboardTourSteps: TourStep[] = [
  {
    target: '.dashboard-header',
    title: 'Welcome to Your Dashboard',
    content: 'This is your main dashboard where you can monitor all your content projects and analytics.',
    placement: 'bottom',
  },
  {
    target: '.sidebar-navigation',
    title: 'Navigation Menu',
    content: 'Use this sidebar to navigate between different sections of the platform.',
    placement: 'right',
    spotlightPadding: 12,
  },
  {
    target: '.quota-usage-widget',
    title: 'Usage Quota',
    content: 'Monitor your current usage and remaining credits for the month.',
    placement: 'bottom',
  },
  {
    target: '.create-project-button',
    title: 'Create New Projects',
    content: 'Click here to start a new content project and begin your analysis.',
    placement: 'left',
  },
  {
    target: '.recent-activity',
    title: 'Recent Activity',
    content: 'Keep track of your recent actions and analysis results here.',
    placement: 'top',
  },
] 