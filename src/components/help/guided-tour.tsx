"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { FeatureSpotlight } from "@/components/ui/contextual-help"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface TourStep {
  id: string
  title: string
  description: React.ReactNode
  targetSelector: string
  position?: "top" | "right" | "bottom" | "left"
}

interface GuidedTourProps {
  tourId: string
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
}

export function GuidedTour({
  tourId,
  steps,
  onComplete,
  onSkip,
  autoStart = false,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(autoStart)
  const [currentStep, setCurrentStep] = useState(0)
  const [elements, setElements] = useState<(Element | null)[]>([])

  // Store tour completion status in localStorage
  const storageKey = `tour-completed-${tourId}`

  useEffect(() => {
    // Check if tour has been completed before
    const completed = localStorage.getItem(storageKey) === "true"
    if (autoStart && !completed) {
      setIsActive(true)
    }

    // Query DOM for all target elements
    const targetElements = steps.map(step => 
      document.querySelector(step.targetSelector)
    )
    setElements(targetElements)
  }, [steps, autoStart, storageKey])

  const startTour = () => {
    setCurrentStep(0)
    setIsActive(true)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeTour = () => {
    setIsActive(false)
    localStorage.setItem(storageKey, "true")
    if (onComplete) {
      onComplete()
    }
  }

  const skipTour = () => {
    setIsActive(false)
    if (onSkip) {
      onSkip()
    }
  }

  if (!isActive) {
    return (
      <Button variant="outline" size="sm" onClick={startTour}>
        Start Tour
      </Button>
    )
  }

  const step = steps[currentStep]
  const targetElement = elements[currentStep]

  if (!step || !targetElement) {
    return null
  }

  // Use targetElement's position and dimensions to position the spotlight
  const rect = targetElement.getBoundingClientRect()
  
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={skipTour} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Skip tour</span>
        </Button>
      </div>

      <div 
        className="absolute" 
        style={{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
      >
        <FeatureSpotlight
          title={step.title}
          description={step.description}
          position={step.position || "bottom"}
          onNext={nextStep}
          onPrevious={previousStep}
          onDismiss={skipTour}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
          step={currentStep + 1}
          totalSteps={steps.length}
        >
          <div className="w-full h-full border-2 border-primary rounded-md" />
        </FeatureSpotlight>
      </div>
    </div>
  )
} 