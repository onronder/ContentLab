"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuotaUsage } from "@/components/dashboard/quota-usage"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardProvider } from "@/components/dashboard/dashboard-context"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { DraggableWidget } from "@/components/dashboard/draggable-widget"

export function DashboardClientWrapper() {
  // In a real app, this would come from an auth provider or API call
  const user = {
    name: "Alex",
    role: "Content Strategist",
    team: "Marketing",
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Define default widget order
  const defaultWidgets = [
    "dashboard-stats",
    "activity-feed",
    "quota-usage",
    "quick-actions",
  ]

  return (
    <DashboardProvider defaultWidgets={defaultWidgets}>
      <DashboardShell>
        <DashboardHeader
          heading={`${greeting()}, ${user.name}`}
          subheading={`Welcome to your content roadmap dashboard. Here's an overview of your projects and activity.`}
        />
        
        <DashboardGrid>
          <DraggableWidget id="dashboard-stats" className="md:col-span-2 lg:col-span-3">
            <DashboardStats />
          </DraggableWidget>
          
          <DraggableWidget id="activity-feed" className="lg:col-span-2">
            <ActivityFeed />
          </DraggableWidget>
          
          <DraggableWidget id="quota-usage">
            <QuotaUsage />
          </DraggableWidget>
          
          <DraggableWidget id="quick-actions">
            <QuickActions />
          </DraggableWidget>
        </DashboardGrid>
      </DashboardShell>
    </DashboardProvider>
  )
}

// Add a default export
export default DashboardClientWrapper; 