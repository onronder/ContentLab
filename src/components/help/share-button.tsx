"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share, Copy, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { shareContent, isShareSupported } from "@/lib/device-features"
import { announceToScreenReader } from "@/lib/accessibility"

interface ShareButtonProps {
  url?: string
  title?: string
  text?: string
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"
}

export function ShareButton({
  url,
  title = "ContentCreate",
  text = "Check out this content from ContentCreate",
  className,
  size = "default",
  variant = "outline",
}: ShareButtonProps) {
  const [hasCopied, setHasCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const shareApiSupported = isShareSupported()
  
  // Use current URL if none provided
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : "")
  
  const handleShare = async () => {
    setIsSharing(true)
    try {
      const success = await shareContent({
        title,
        text,
        url: shareUrl,
        onSuccess: () => {
          announceToScreenReader("Content shared successfully")
        },
        onError: () => {
          announceToScreenReader("Failed to share content")
        }
      })
      
      if (!success && typeof navigator.clipboard !== 'undefined') {
        // If sharing failed but clipboard is available, copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        setHasCopied(true)
        announceToScreenReader("URL copied to clipboard")
        setTimeout(() => setHasCopied(false), 2000)
      }
    } catch (error) {
      console.error('Error sharing or copying:', error)
    } finally {
      setIsSharing(false)
    }
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleShare}
            disabled={isSharing}
            aria-label={shareApiSupported ? "Share this content" : "Copy link to clipboard"}
          >
            {hasCopied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              shareApiSupported ? (
                <Share className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )
            )}
            <span>{hasCopied ? "Copied!" : (shareApiSupported ? "Share" : "Copy Link")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{shareApiSupported ? "Share this content" : "Copy link to clipboard"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 