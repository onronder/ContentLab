"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { useDashboardShortcuts } from "@/hooks/use-dashboard-shortcuts"
import { KeyboardShortcutIndicator } from "@/components/ui/keyboard-shortcut-indicator"
import { MobileBottomNavigation } from "@/components/mobile/bottom-navigation"
import { useSkipNavigation } from "@/lib/accessibility"
import Link from "next/link"

// Mock image preloader to prevent 404 errors
function useImagePreloader() {
  useEffect(() => {
    // Define static image assets
    const images = [
      '/images/dashboard-icon.svg',
      '/images/welcome-illustration.svg', // For onboarding
      '/images/01.svg',
      '/images/02.svg',
      '/images/03.svg',
      '/images/04.svg',
      '/images/05.svg'
    ]
    
    // Preload images
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])
}

// Separate component for keyboard shortcuts to prevent re-renders
const KeyboardShortcutsInitializer = React.memo(() => {
  useDashboardShortcuts()
  return null
})
KeyboardShortcutsInitializer.displayName = "KeyboardShortcutsInitializer"

// Memoized sidebar component
const MemoizedSidebar = React.memo(({ isMounted }: { isMounted: boolean }) => {
  if (!isMounted) {
    return <div className="hidden md:block md:w-64 shrink-0" />
  }
  
  return <DashboardSidebar className="hidden md:block" aria-label="Main navigation" />
})
MemoizedSidebar.displayName = "MemoizedSidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const { skipLinkProps, mainProps } = useSkipNavigation("main-content")
  
  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Preload images to prevent 404 errors
  useImagePreloader()
  
  // Memoize the shortcut indicator to prevent re-renders
  const shortcutIndicator = useMemo(() => {
    if (!isMounted) return null
    return <KeyboardShortcutIndicator />
  }, [isMounted])
  
  // Memoize the main content to prevent re-renders
  const mainContent = useMemo(() => (
    <main {...mainProps} className="flex-1">
      {children}
      {shortcutIndicator}
    </main>
  ), [children, shortcutIndicator, mainProps])
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip navigation link for keyboard users */}
      <Link {...skipLinkProps} />
      
      {isMounted && <KeyboardShortcutsInitializer />}
      
      <div className="flex-1 flex flex-col md:flex-row">
        <MemoizedSidebar isMounted={isMounted} />
        {mainContent}
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileBottomNavigation />
    </div>
  )
} 