"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, Home, PieChart, Search, Folders, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Import touch gesture handling
import { useSwipeable } from "react-swipeable"

interface MobileNavProps {
  items: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sheet when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Setup swipe handlers for sidebar
  const handlers = useSwipeable({
    onSwipedRight: () => setOpen(true),
    onSwipedLeft: () => setOpen(false),
    trackMouse: false,
    delta: 10,
  })

  // Filter items for bottom navigation (limit to 5 for mobile)
  const bottomNavItems = items.slice(0, 4)

  return (
    <>
      {/* Hamburger Menu for expanded navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="font-semibold">Content Roadmap</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close Menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 pt-0">
                <nav className="grid gap-2 py-4">
                  {items.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === item.href 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Swipe area for gesture support */}
      <div
        {...handlers}
        className="fixed inset-0 z-0 w-8 md:hidden"
        style={{ touchAction: "pan-y" }}
      />

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {bottomNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 py-2",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind bottom nav */}
      <div className="pb-16 md:pb-0"></div>
    </>
  )
}

// Example navigation items
export const defaultNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: <Folders className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: <PieChart className="h-5 w-5" />,
  },
  {
    title: "Explore",
    href: "/dashboard/explore",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
] 