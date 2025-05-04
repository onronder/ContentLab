"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { MobileNav, defaultNavItems } from "@/components/navigation/mobile-nav"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileOptimizedLayoutProps {
  children: React.ReactNode
  navItems?: typeof defaultNavItems
  showMobileNav?: boolean
  className?: string
}

export function MobileOptimizedLayout({
  children,
  navItems = defaultNavItems,
  showMobileNav = true,
  className,
}: MobileOptimizedLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  // Prevent hydration errors by delaying mount
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Skip rendering navigation features on the server
  const renderMobileNav = isMounted && showMobileNav

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Header */}
      <header className="h-14 border-b sticky top-0 z-30 bg-background flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          {/* Render mobile nav only on client after mounting */}
          {renderMobileNav ? (
            <MobileNav items={navItems} />
          ) : (
            <div className="w-8 h-8" /> 
          )}
          <h1 className="font-semibold text-lg">Content Roadmap</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Conditionally render user menu too */}
          {isMounted ? <UserMenu /> : <div className="w-9 h-9" />}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>
      
      {/* Add extra padding for mobile nav if needed */}
      {renderMobileNav && <div className="pb-16 md:pb-0" />}
    </div>
  )
}

// Example User Menu Component
function UserMenu() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full h-9 w-9"
      aria-label="User menu"
    >
      <div className="relative w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
        UR
      </div>
    </Button>
  )
} 