"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusCircle, FileText, Lightbulb } from "lucide-react"
import { EmptyState } from "@/components/analysis/empty-state"
import { Input } from "@/components/ui/input"

export function RecommendationsSection() {
  const [loading, setLoading] = React.useState(false)
  const [projectSelected, setProjectSelected] = React.useState(false)
  
  // Handler for when a project is selected from the dropdown
  const handleProjectSelect = (value: string) => {
    if (value) {
      setProjectSelected(true)
      // In a real implementation, this would fetch data
      setLoading(true)
      // Simulate loading state
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } else {
      setProjectSelected(false)
    }
  }
  
  // Reset loading state on unmount
  React.useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Content Recommendations</CardTitle>
              <CardDescription>
                Actionable insights to improve your content strategy
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={handleProjectSelect}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Project 1</SelectItem>
                  <SelectItem value="project2">Project 2</SelectItem>
                  <SelectItem value="project3">Project 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !projectSelected ? (
            <EmptyState
              icon={<FileText className="h-10 w-10 text-muted-foreground" />}
              title="No project selected"
              description="Select a project to view content recommendations."
              action={
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generate Recommendations
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  0 recommendations
                </div>
                <div className="relative w-full max-w-sm">
                  <Input 
                    type="search"
                    placeholder="Search recommendations..." 
                    className="pl-8"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <EmptyState
                icon={<Lightbulb className="h-10 w-10 text-muted-foreground" />}
                title="No recommendations available"
                description="There are no content recommendations available for this project. Run a new analysis to get actionable insights."
                action={
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Generate Recommendations
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Search icon component for the input field
function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
} 