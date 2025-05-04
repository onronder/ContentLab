"use client"

import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { announceToScreenReader } from "@/lib/accessibility"

type SwipeDirection = "left" | "right" | "up" | "down" | null

interface SwipeContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // minimum swipe distance in pixels
  children: React.ReactNode
  className?: string
  swipeDisabled?: boolean
  preventScroll?: boolean
  ariaRoleDescription?: string
  ariaLabel?: string
  swipeLeftLabel?: string
  swipeRightLabel?: string
}

export function SwipeContainer({
  onSwipe,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50, // Default threshold 50px
  children,
  className,
  swipeDisabled = false,
  preventScroll = false,
  ariaRoleDescription = "swipeable container",
  ariaLabel = "Swipe left or right to navigate",
  swipeLeftLabel = "Swipe left for next",
  swipeRightLabel = "Swipe right for previous",
  ...props
}: SwipeContainerProps) {
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on a mobile device
  useEffect(() => {
    // Check for mobile by screen size and touch capability
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 && "ontouchstart" in window)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Announce swipe capabilities to screen readers
  useEffect(() => {
    if (isMobile && !swipeDisabled) {
      const message = `${ariaLabel}. ${swipeLeftLabel}. ${swipeRightLabel}.`
      announceToScreenReader(message, "polite")
    }
  }, [isMobile, swipeDisabled, ariaLabel, swipeLeftLabel, swipeRightLabel])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeDisabled || !isMobile) return
    
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeDisabled || !isSwiping || !isMobile) return
    
    if (preventScroll) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeDisabled || !isMobile || !isSwiping || startXRef.current === null || startYRef.current === null) {
      setIsSwiping(false)
      return
    }

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    
    const diffX = endX - startXRef.current
    const diffY = endY - startYRef.current
    
    let direction: SwipeDirection = null
    
    // Determine if the swipe was primarily horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) < threshold) {
        // Swipe distance too small, not a swipe
        setIsSwiping(false)
        return
      }
      
      if (diffX > 0) {
        direction = "right"
        onSwipeRight?.()
        announceToScreenReader("Swiped right", "polite")
      } else {
        direction = "left"
        onSwipeLeft?.()
        announceToScreenReader("Swiped left", "polite")
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) < threshold) {
        // Swipe distance too small, not a swipe
        setIsSwiping(false)
        return
      }
      
      if (diffY > 0) {
        direction = "down"
        onSwipeDown?.()
        announceToScreenReader("Swiped down", "polite")
      } else {
        direction = "up"
        onSwipeUp?.()
        announceToScreenReader("Swiped up", "polite")
      }
    }
    
    // Call the general onSwipe callback
    onSwipe?.(direction)
    
    // Reset state
    setIsSwiping(false)
    startXRef.current = null
    startYRef.current = null
  }

  // Add keyboard navigation as an alternative to swiping
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (swipeDisabled) return
    
    if (e.key === 'ArrowLeft') {
      onSwipeRight?.()
      e.preventDefault()
    } else if (e.key === 'ArrowRight') {
      onSwipeLeft?.()
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      onSwipeDown?.()
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      onSwipeUp?.()
      e.preventDefault()
    }
  }

  return (
    <div
      className={cn("touch-manipulation", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={swipeDisabled ? undefined : 0}
      role="region"
      aria-roledescription={ariaRoleDescription}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  )
} 