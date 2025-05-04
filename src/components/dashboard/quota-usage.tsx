"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, TrendingUp } from "lucide-react"

export function QuotaUsage() {
  // In a real app, these would come from an API call
  const quotaData = {
    used: 68,
    total: 100,
    trend: "+12% from last month",
    nextTier: "Pro Plan",
    nextTierLimit: 250,
  }

  const usagePercentage = (quotaData.used / quotaData.total) * 100
  const isHighUsage = usagePercentage > 75

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Quota</CardTitle>
        <CardDescription>
          Your current plan usage and limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {quotaData.used} / {quotaData.total} analyses
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              {quotaData.trend}
            </div>
          </div>
          <Progress 
            value={usagePercentage} 
            className={isHighUsage ? "bg-muted [&>div]:bg-destructive" : ""}
          />
        </div>
        
        <div className="rounded-md bg-muted p-3">
          <div className="text-sm font-medium">Next tier</div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {quotaData.nextTier}: {quotaData.nextTierLimit} analyses
            </p>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ArrowRight className="h-3 w-3" />
              <span className="sr-only">View plans</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Upgrade Plan
        </Button>
      </CardFooter>
    </Card>
  )
} 