"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectRow } from "@/components/projects/project-row"
import { Grid, List, Search, SlidersHorizontal, X, PlusCircle } from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Sample project data - in a real app, this would come from an API
const projects = [
  {
    id: "1",
    name: "SEO Content Gap Analysis",
    description: "Identify content opportunities from competitor analysis and search trends",
    status: "active",
    progress: 75,
    createdAt: "2023-09-15T00:00:00Z",
    updatedAt: "2023-10-05T00:00:00Z",
    owner: {
      name: "Alex Chen",
      email: "alex@example.com",
      avatar: "/avatars/01.png",
    },
    tags: ["SEO", "Content Strategy", "Competitive Analysis"],
    domains: [
      "example.com",
      "competitor1.com",
      "competitor2.com"
    ],
    lastAnalysisDate: "2023-10-01T00:00:00Z",
    contentGapsFound: 36,
  },
  {
    id: "2",
    name: "Product Launch Content Plan",
    description: "Develop comprehensive content strategy for new product launch",
    status: "draft",
    progress: 30,
    createdAt: "2023-10-01T00:00:00Z",
    updatedAt: "2023-10-10T00:00:00Z",
    owner: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "/avatars/02.png",
    },
    tags: ["Product Launch", "Content Calendar", "Marketing"],
    domains: [
      "example.com",
      "productsite.com",
    ],
    lastAnalysisDate: null,
    contentGapsFound: 0,
  },
  {
    id: "3",
    name: "Blog Content Optimization",
    description: "Analyze and optimize existing blog content for better search visibility",
    status: "completed",
    progress: 100,
    createdAt: "2023-08-10T00:00:00Z",
    updatedAt: "2023-09-20T00:00:00Z",
    owner: {
      name: "Mark Wilson",
      email: "mark@example.com",
      avatar: "/avatars/03.png",
    },
    tags: ["Blog", "SEO", "Content Optimization"],
    domains: [
      "example.com/blog",
      "competitor1.com/blog",
    ],
    lastAnalysisDate: "2023-09-15T00:00:00Z",
    contentGapsFound: 24,
  },
  {
    id: "4",
    name: "Competitor Content Benchmark",
    description: "Deep analysis of top 5 competitors' content strategies",
    status: "active",
    progress: 60,
    createdAt: "2023-09-25T00:00:00Z",
    updatedAt: "2023-10-12T00:00:00Z",
    owner: {
      name: "Taylor Kim",
      email: "taylor@example.com",
      avatar: "/avatars/04.png",
    },
    tags: ["Competitive Analysis", "Benchmarking", "Industry Research"],
    domains: [
      "competitor1.com",
      "competitor2.com",
      "competitor3.com",
      "competitor4.com",
      "competitor5.com",
    ],
    lastAnalysisDate: "2023-10-10T00:00:00Z",
    contentGapsFound: 52,
  },
  {
    id: "5",
    name: "Technical Documentation Audit",
    description: "Assess and improve technical documentation for developers",
    status: "paused",
    progress: 45,
    createdAt: "2023-07-01T00:00:00Z",
    updatedAt: "2023-08-15T00:00:00Z",
    owner: {
      name: "Jordan Lee",
      email: "jordan@example.com",
      avatar: "/avatars/05.png",
    },
    tags: ["Technical Documentation", "Developer Content", "Knowledge Base"],
    domains: [
      "docs.example.com",
      "developer.example.com",
    ],
    lastAnalysisDate: "2023-08-10T00:00:00Z",
    contentGapsFound: 18,
  },
]

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
]

const sortOptions = [
  { value: "updated", label: "Last Updated" },
  { value: "created", label: "Date Created" },
  { value: "name", label: "Project Name" },
  { value: "progress", label: "Progress" },
  { value: "gaps", label: "Content Gaps" },
]

// Get all unique tags from projects
const allTags = Array.from(
  new Set(projects.flatMap(project => project.tags))
).map(tag => ({ value: tag, label: tag }))

type ViewMode = "grid" | "list"

export function ProjectsList() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("updated")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  
  // Handle removing a tag filter
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortBy("updated")
    setSelectedTags([])
  }
  
  // Apply filters and sorting to projects
  const filteredProjects = projects.filter(project => {
    // Search query filter
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false
    }
    
    // Tags filter
    if (selectedTags.length > 0 && !selectedTags.some(tag => project.tags.includes(tag))) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "name":
        return a.name.localeCompare(b.name)
      case "progress":
        return b.progress - a.progress
      case "gaps":
        return b.contentGapsFound - a.contentGapsFound
      default:
        return 0
    }
  })
  
  const hasActiveFilters = searchQuery || statusFilter !== "all" || selectedTags.length > 0
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Status</h4>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tags</h4>
                  <Select
                    onValueChange={(value) => {
                      if (!selectedTags.includes(value)) {
                        setSelectedTags([...selectedTags, value])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags.map((tag) => (
                        <SelectItem key={tag.value} value={tag.value}>
                          {tag.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none rounded-l-md"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none rounded-r-md"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>
      
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      {filteredProjects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects found</CardTitle>
            <CardDescription>
              {hasActiveFilters 
                ? "Try adjusting your filters or create a new project."
                : "Get started by creating your first project."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
} 