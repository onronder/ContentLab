"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusCircle, SearchX, Share2 } from "lucide-react"
import { EmptyState } from "@/components/analysis/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TopicClustersAnalysis() {
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Topic Clusters Analysis</CardTitle>
              <CardDescription>
                Discover topic clusters and content organization opportunities
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
              icon={<SearchX className="h-10 w-10 text-muted-foreground" />}
              title="No project selected"
              description="Select a project to view the topic clusters analysis results."
              action={
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Analysis
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Topic Clusters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">No clusters detected</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pillar Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">No pillar pages identified</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Supporting Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">No supporting content</div>
                  </CardContent>
                </Card>
              </div>
              
              <Tabs defaultValue="clusters">
                <TabsList>
                  <TabsTrigger value="clusters">Topic Clusters</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                  <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                </TabsList>
                <TabsContent value="clusters" className="pt-4">
                  <EmptyState
                    icon={<SearchX className="h-10 w-10 text-muted-foreground" />}
                    title="No topic clusters available"
                    description="There are no topic clusters available for this project. Run a new analysis to discover content clusters."
                    action={
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Run New Analysis
                      </Button>
                    }
                  />
                </TabsContent>
                <TabsContent value="relationships" className="pt-4">
                  <EmptyState
                    icon={<Share2 className="h-10 w-10 text-muted-foreground" />}
                    title="No topic relationships available"
                    description="There are no topic relationships available for this project."
                    action={
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Run New Analysis
                      </Button>
                    }
                  />
                </TabsContent>
                <TabsContent value="opportunities" className="pt-4">
                  <EmptyState
                    icon={<PlusCircle className="h-10 w-10 text-muted-foreground" />}
                    title="No opportunities available"
                    description="There are no content organization opportunities identified for this project."
                    action={
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Run New Analysis
                      </Button>
                    }
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 