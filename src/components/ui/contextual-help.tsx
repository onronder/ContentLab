"use client"

import * as React from "react"
import { HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ContextualHelpProps {
  content: React.ReactNode
  title?: string
  children: React.ReactNode
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  interactive?: boolean
  expanded?: boolean
  inline?: boolean
  mobileFullScreen?: boolean
}

export function ContextualHelp({
  content,
  title,
  children,
  className,
  iconClassName,
  side = "top",
  align = "center",
  interactive = false,
  expanded = false,
  inline = false,
  mobileFullScreen = false,
}: ContextualHelpProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded)
  const [isMobile, setIsMobile] = React.useState(false)

  // Check for mobile viewport on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // If in interactive mode, we show an expandable help section
  if (interactive) {
    return (
      <div className={cn("relative", !inline && "mb-8", className)}>
        {children}
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute p-1 h-auto w-auto rounded-full",
              inline ? "-right-1 top-0 translate-x-full" : "right-0 top-2",
              iconClassName
            )}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Hide help" : "Show help"}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {isExpanded && (
          <div 
            className={cn(
              "mt-2 p-3 text-sm bg-muted/50 rounded-md border relative",
              inline ? "ml-2" : "mt-2",
              isMobile && mobileFullScreen && "fixed inset-4 z-50 overflow-auto"
            )}
          >
            {title && <h4 className="font-medium mb-1">{title}</h4>}
            <div className="text-muted-foreground">{content}</div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
              onClick={() => setIsExpanded(false)}
              aria-label="Close help"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }
  
  // Mobile fallback for tooltips
  if (isMobile) {
    return (
      <div className={cn("relative", className)}>
        {children}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute p-1 h-auto w-auto rounded-full",
            inline ? "-right-1 top-0 translate-x-full" : "right-0 top-2",
            iconClassName
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide help" : "Show help"}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        
        {isExpanded && (
          <div 
            className={cn(
              "fixed inset-4 z-50 p-3 text-sm bg-background rounded-md border shadow-lg overflow-auto"
            )}
          >
            {title && <h4 className="font-medium mb-1">{title}</h4>}
            <div className="text-muted-foreground">{content}</div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
              onClick={() => setIsExpanded(false)}
              aria-label="Close help"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }
  
  // Otherwise, we use a simple tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <div className={cn("relative inline-block", className)}>
          {children}
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute p-1 h-auto w-auto rounded-full",
                inline ? "-right-1 top-0 translate-x-full" : "right-0 top-2",
                iconClassName
              )}
              aria-label="Show help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
        </div>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {title && <p className="font-medium mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Feature spotlight component for guided tours
interface FeatureSpotlightProps {
  title: string
  description: React.ReactNode
  children: React.ReactNode
  position?: "top" | "right" | "bottom" | "left"
  onDismiss?: () => void
  onNext?: () => void
  onPrevious?: () => void
  isLast?: boolean
  isFirst?: boolean
  step?: number
  totalSteps?: number
  className?: string
}

export function FeatureSpotlight({
  title,
  description,
  children,
  position = "bottom",
  onDismiss,
  onNext,
  onPrevious,
  isLast = false,
  isFirst = false,
  step,
  totalSteps,
  className,
}: FeatureSpotlightProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      
      <div 
        className={cn(
          "absolute z-50 bg-popover text-popover-foreground p-4 rounded-lg shadow-lg border w-64",
          position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
          position === "right" && "left-full top-1/2 -translate-y-1/2 ml-2",
          position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
          position === "left" && "right-full top-1/2 -translate-y-1/2 mr-2"
        )}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-1 top-1 h-6 w-6 p-0 rounded-full"
          onClick={onDismiss}
          aria-label="Close spotlight"
        >
          <X className="h-3 w-3" />
        </Button>
        
        <h4 className="font-medium text-base mb-1">{title}</h4>
        <div className="text-sm text-muted-foreground mb-4">{description}</div>
        
        <div className="flex items-center justify-between">
          {step && totalSteps && (
            <span className="text-xs text-muted-foreground">
              {step} of {totalSteps}
            </span>
          )}
          
          <div className="flex space-x-2 ml-auto">
            {!isFirst && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onPrevious}
              >
                Previous
              </Button>
            )}
            
            {!isLast ? (
              <Button 
                size="sm"
                onClick={onNext}
              >
                Next
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={onDismiss}
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// A simple "What's this?" link component
interface WhatsThisLinkProps {
  content: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function WhatsThisLink({
  content,
  children,
  className,
}: WhatsThisLinkProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="link" 
            className={cn("h-auto p-0 text-xs text-muted-foreground hover:text-foreground underline", className)}
          >
            {children || "What's this?"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 