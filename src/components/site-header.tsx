"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { 
  BarChart2, 
  Layers, 
  FileText, 
  Settings, 
  Home, 
  Menu,
  X
} from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false)

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/"
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: BarChart2,
      active: pathname === "/dashboard"
    },
    {
      href: "/projects",
      label: "Projects",
      icon: Layers,
      active: pathname === "/projects"
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
      active: pathname.startsWith("/reports")
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/settings"
    }
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl">ContentCreate</span>
          </Link>
        </div>
        
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <nav className="flex items-center space-x-1">
            {routes.map((route) => (
              <Button 
                key={route.href}
                asChild
                variant={route.active ? "default" : "ghost"}
                size="sm"
              >
                <Link href={route.href} className="flex items-center gap-1">
                  <route.icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </div>
        </div>
        
        <div className="flex md:hidden flex-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mr-2"
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      {showMobileMenu && (
        <div className="container md:hidden py-4">
          <nav className="grid grid-flow-row auto-rows-max text-sm">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent",
                  route.active ? "font-medium bg-accent" : "font-normal"
                )}
                onClick={() => setShowMobileMenu(false)}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
            <Button className="mt-2" size="sm">
              Sign in
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
} 