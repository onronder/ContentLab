"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  HelpCircle, 
  Settings, 
  Menu 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { announceToScreenReader } from "@/lib/accessibility"

interface BottomNavItem {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
}

export function MobileBottomNavigation() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // Only show after mounting (to avoid hydration mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR
  if (!mounted) return null

  const navItems: BottomNavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: <FileText className="h-5 w-5" />,
      active: pathname.startsWith("/dashboard/projects"),
    },
    {
      href: "/dashboard/search",
      label: "Search",
      icon: <Search className="h-5 w-5" />,
      active: pathname.startsWith("/dashboard/search"),
    },
    {
      href: "/dashboard/help",
      label: "Help",
      icon: <HelpCircle className="h-5 w-5" />,
      active: pathname.startsWith("/dashboard/help"),
    },
    {
      href: "/dashboard/settings",
      label: "More",
      icon: <Menu className="h-5 w-5" />,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ]

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background border-t shadow-sm"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <nav className="flex items-center justify-around h-16">
        {navItems.slice(0, 4).map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
        
        <MoreMenu items={navItems.slice(4)} />
      </nav>
    </div>
  )
}

function NavItem({ item }: { item: BottomNavItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1.5",
        "text-xs text-muted-foreground",
        "transition-colors hover:text-foreground",
        item.active && "text-foreground"
      )}
      aria-label={item.label}
      aria-current={item.active ? "page" : undefined}
      onClick={() => announceToScreenReader(`Navigating to ${item.label}`)}
    >
      <div className="mb-1" aria-hidden="true">{item.icon}</div>
      <span>{item.label}</span>
    </Link>
  )
}

function MoreMenu({ items }: { items: BottomNavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex flex-col items-center justify-center rounded-none flex-1 h-full pt-1 pb-1.5",
            "text-xs text-muted-foreground",
            "transition-colors hover:text-foreground",
            items.some(item => item.active) && "text-foreground"
          )}
          aria-label="More options"
          aria-haspopup="menu"
        >
          <div className="mb-1" aria-hidden="true">
            <Menu className="h-5 w-5" />
          </div>
          <span>More</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-auto pb-8 pt-6 px-0"
        aria-label="Additional navigation options" 
      >
        <nav className="grid grid-cols-4 gap-2 px-6" role="menu">
          {[
            {
              href: "/dashboard/settings",
              label: "Settings",
              icon: <Settings className="h-5 w-5" />
            },
            {
              href: "/dashboard/account",
              label: "Account",
              icon: <FileText className="h-5 w-5" />
            },
            {
              href: "/dashboard/notifications",
              label: "Notifications",
              icon: <FileText className="h-5 w-5" />
            },
            {
              href: "/dashboard/help/contact",
              label: "Support",
              icon: <HelpCircle className="h-5 w-5" />
            }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center p-4 text-center rounded-md hover:bg-muted"
              role="menuitem"
              aria-label={item.label}
              onClick={() => announceToScreenReader(`Navigating to ${item.label}`)}
            >
              <div className="mb-1" aria-hidden="true">{item.icon}</div>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
} 