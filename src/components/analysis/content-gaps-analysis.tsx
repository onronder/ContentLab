"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/analysis/empty-state"

export function ContentGapsAnalysis() {
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
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Gap Analysis</CardTitle>
                <CardDescription>
                  Compare your content coverage against competitors and demand
                </CardDescription>
              </div>
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !projectSelected ? (
              <EmptyState
                icon={<Info className="h-10 w-10 text-muted-foreground" />}
                title="No project selected"
                description="Select a project to view the content gap analysis results."
                action={
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Analysis
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Content Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">0</div>
                        <Badge variant="outline" className="text-muted-foreground">None detected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Coverage Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">N/A</div>
                        <Badge variant="outline" className="text-muted-foreground">No data</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">0</div>
                        <Badge variant="outline" className="text-muted-foreground">None detected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <EmptyState
                  icon={<Info className="h-10 w-10 text-muted-foreground" />}
                  title="No content gap data available"
                  description="There is no content gap data available for this project. Run a new analysis or select a different project."
                  action={
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Run New Analysis
                    </Button>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 