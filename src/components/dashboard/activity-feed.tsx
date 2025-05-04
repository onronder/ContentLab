"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCheck, Edit, File, Search, Zap } from "lucide-react"

export function ActivityFeed() {
  // In a real app, this would come from an API
  const activities = [
    {
      id: "1",
      title: "Content analysis completed",
      description: "SEO Competition Analysis for Project Alpha",
      timestamp: "2 hours ago",
      icon: CheckCheck,
      iconColor: "text-green-500",
      user: {
        name: "Sarah Johnson",
        avatar: "/avatars/01.png",
        initials: "SJ",
      },
    },
    {
      id: "2",
      title: "New content gap identified",
      description: "8 keyword opportunities in Product Features category",
      timestamp: "Yesterday",
      icon: Search,
      iconColor: "text-blue-500",
      user: {
        name: "Mark Wilson",
        avatar: "/avatars/02.png",
        initials: "MW",
      },
    },
    {
      id: "3",
      title: "Project updated",
      description: "Added 3 new competitor websites to Project Beta",
      timestamp: "2 days ago",
      icon: Edit,
      iconColor: "text-amber-500",
      user: {
        name: "Alex Chen",
        avatar: "/avatars/03.png",
        initials: "AC",
      },
    },
    {
      id: "4",
      title: "Report generated",
      description: "Monthly content performance report for Q2",
      timestamp: "3 days ago",
      icon: File,
      iconColor: "text-purple-500",
      user: {
        name: "Taylor Kim",
        avatar: "/avatars/04.png",
        initials: "TK",
      },
    },
    {
      id: "5",
      title: "Quick analysis started",
      description: "Keyword research for new product launch",
      timestamp: "5 days ago",
      icon: Zap,
      iconColor: "text-yellow-500",
      user: {
        name: "Jordan Lee",
        avatar: "/avatars/05.png",
        initials: "JL",
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your team&apos;s latest actions and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-auto">
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`mt-1 rounded-full p-2 ${activity.iconColor} bg-opacity-10`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 