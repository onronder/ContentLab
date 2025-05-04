"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Search, LayoutGrid, List } from "lucide-react"

type DashboardStatsProps = React.HTMLAttributes<HTMLDivElement>

export function DashboardStats({ className, ...props }: DashboardStatsProps) {
  // In a real app, these would come from an API call
  const stats = [
    {
      title: "Total Projects",
      value: "12",
      icon: LayoutGrid,
      description: "Active content roadmap projects",
    },
    {
      title: "Completed Analyses",
      value: "36",
      icon: BarChart3,
      description: "Finished content analyses",
    },
    {
      title: "Content Gaps",
      value: "128",
      icon: Search,
      description: "Identified opportunities",
    },
    {
      title: "Recommendations",
      value: "84",
      icon: List,
      description: "Content action items",
    },
  ]

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)} {...props}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 