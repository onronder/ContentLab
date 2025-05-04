"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/lib/device-features"
import { cn } from "@/lib/utils"
import { announceToScreenReader } from "@/lib/accessibility"

interface OfflineIndicatorProps {
  className?: string
  showOnline?: boolean
}

export function OfflineIndicator({ className, showOnline = false }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus()
  const [showIndicator, setShowIndicator] = useState(false)
  
  // Show the indicator immediately when offline,
  // but delay hiding it when back online for better UX
  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
      announceToScreenReader("You are currently offline. Some features may be limited.", "assertive")
    } else {
      // When back online, show the online indicator briefly, then hide
      if (showIndicator) {
        announceToScreenReader("You are back online.", "assertive")
        if (!showOnline) {
          // Set a timer to hide the indicator after 3 seconds
          const timer = setTimeout(() => {
            setShowIndicator(false)
          }, 3000)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [isOnline, showIndicator, showOnline])
  
  // Don't render anything if online and showOnline is false
  if (isOnline && !showOnline && !showIndicator) return null
  
  return (
    <div 
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-md flex items-center gap-2",
        isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>You&apos;re online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline</span>
        </>
      )}
    </div>
  )
}

export function useOfflineDetection() {
  const isOnline = useOnlineStatus()
  
  // Return true if the user is currently offline
  return !isOnline
} 