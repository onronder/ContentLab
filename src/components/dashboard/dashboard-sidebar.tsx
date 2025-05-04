"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BarChart2, 
  Layers, 
  FileText, 
  Settings, 
  Plus, 
  Search,
  Users,
  HelpCircle,
  BookOpen,
  Filter
} from "lucide-react"

type DashboardSidebarProps = React.HTMLAttributes<HTMLDivElement>

// Create a memoized link component to prevent re-renders
const NavLink = React.memo<{
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}>(({ href, label, icon: Icon, active }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
      active ? "bg-accent text-accent-foreground" : "transparent"
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
))
NavLink.displayName = "NavLink"

// Create a separate user profile component to prevent re-renders
const UserProfile = React.memo(() => (
  <div className="mt-auto border-t p-4">
    <div className="flex items-center gap-2">
      <div className="rounded-full bg-primary/10 p-1">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium">AC</span>
        </div>
      </div>
      <div className="grid gap-0.5">
        <p className="text-sm font-medium">Alex Chen</p>
        <p className="text-xs text-muted-foreground">alex@example.com</p>
      </div>
    </div>
  </div>
))
UserProfile.displayName = "UserProfile"

// Create a memoized nav section to reduce re-renders
const NavSection = React.memo<{
  title?: string
  links: React.ReactNode[]
}>(({ title, links }) => (
  <div className="space-y-2">
    {title && (
      <h4 className="px-4 text-xs font-semibold text-muted-foreground mb-2">{title}</h4>
    )}
    <nav className="grid gap-1 px-2">{links}</nav>
  </div>
))
NavSection.displayName = "NavSection"

export function DashboardSidebar({ className, ...props }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  
  // Only enable scrolling after client-side mount
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Define routes
  const routes = useMemo(() => [
    {
      href: "/dashboard",
      label: "Overview",
      icon: BarChart2,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: Layers,
      active: pathname === "/dashboard/projects",
    },
    {
      href: "/dashboard/analysis",
      label: "Analysis",
      icon: BarChart2,
      active: pathname === "/dashboard/analysis",
    },
    {
      href: "/dashboard/reports",
      label: "Reports",
      icon: FileText,
      active: pathname === "/dashboard/reports",
    },
    {
      href: "/dashboard/charts",
      label: "Charts",
      icon: BarChart2,
      active: pathname === "/dashboard/charts",
    },
    {
      href: "/dashboard/filtering",
      label: "Advanced Filtering",
      icon: Filter,
      active: pathname === "/dashboard/filtering",
    },
    {
      href: "/dashboard/form-controls",
      label: "Form Controls",
      icon: Settings,
      active: pathname === "/dashboard/form-controls",
    },
    {
      href: "/dashboard/competitors",
      label: "Competitors",
      icon: Users,
      active: pathname === "/dashboard/competitors",
    },
    {
      href: "/dashboard/search",
      label: "Content Search",
      icon: Search,
      active: pathname === "/dashboard/search",
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ], [pathname])

  // Memoize the navigation links
  const navRoutes = useMemo(() => 
    routes.map(route => (
      <NavLink 
        key={route.href}
        href={route.href}
        label={route.label}
        icon={route.icon}
        active={route.active}
      />
    )),
    [routes]
  )

  // Define resources
  const resources = useMemo(() => [
    {
      href: "/dashboard/help",
      label: "Help & Support",
      icon: HelpCircle,
      active: pathname === "/dashboard/help",
    },
    {
      href: "/dashboard/documentation",
      label: "Documentation",
      icon: BookOpen,
      active: pathname === "/dashboard/documentation",
    },
  ], [pathname])

  // Memoize the resource links
  const navResources = useMemo(() => 
    resources.map(resource => (
      <NavLink 
        key={resource.href}
        href={resource.href}
        label={resource.label}
        icon={resource.icon}
        active={resource.active}
      />
    )),
    [resources]
  )

  // Memoize the header to prevent re-renders
  const header = useMemo(() => (
    <div className="flex h-14 items-center border-b px-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="font-bold">Dashboard</span>
      </Link>
      <Button variant="outline" size="icon" className="ml-auto h-8 w-8" asChild>
        <Link href="/dashboard/projects/new">
          <Plus className="h-4 w-4" />
          <span className="sr-only">New project</span>
        </Link>
      </Button>
    </div>
  ), [])

  // Memoize the content sections to prevent re-renders
  const mainContent = useMemo(() => (
    <NavSection links={navRoutes} />
  ), [navRoutes])

  const resourcesContent = useMemo(() => (
    <NavSection title="RESOURCES" links={navResources} />
  ), [navResources])

  return (
    <div className={cn("border-r bg-background h-screen", className)} {...props}>
      <div className="flex h-full flex-col">
        {header}
        
        {isMounted ? (
          <ScrollArea className="flex-1 py-2">
            {mainContent}
            <div className="mt-6">
              {resourcesContent}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 py-2 overflow-hidden">
            {mainContent}
            <div className="mt-6">
              {resourcesContent}
            </div>
          </div>
        )}
        
        <UserProfile />
      </div>
    </div>
  )
} 