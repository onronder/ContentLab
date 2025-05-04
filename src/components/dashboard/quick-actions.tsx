"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Globe, Calendar } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      label: "New Analysis",
      icon: PlusCircle,
      description: "Create a new content analysis",
      onClick: () => console.log("New analysis clicked"),
    },
    {
      label: "View Reports",
      icon: FileText,
      description: "See your existing reports",
      onClick: () => console.log("View reports clicked"),
    },
    {
      label: "Add Competitor",
      icon: Globe,
      description: "Track a competitor website",
      onClick: () => console.log("Add competitor clicked"),
    },
    {
      label: "Schedule Report",
      icon: Calendar,
      description: "Set up report automation",
      onClick: () => console.log("Schedule report clicked"),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks to manage your content roadmap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex h-auto items-center justify-start gap-3 px-4 py-3"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4 text-primary" />
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 