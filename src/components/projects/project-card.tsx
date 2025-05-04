"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MoreHorizontal,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    status: string
    progress: number
    createdAt: string
    updatedAt: string
    owner: {
      name: string
      email: string
      avatar: string
    }
    tags: string[]
    domains: string[]
    lastAnalysisDate: string | null
    contentGapsFound: number
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "draft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "paused":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
  const lastAnalysis = project.lastAnalysisDate 
    ? formatDistanceToNow(new Date(project.lastAnalysisDate), { addSuffix: true })
    : "No analysis yet"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Link 
              href={`/dashboard/projects/${project.id}`} 
              className="hover:underline font-semibold text-lg block"
            >
              {project.name}
            </Link>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary"
                className={`${getStatusColor(project.status)} capitalize`}
              >
                {project.status}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 
                Updated {lastUpdated}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link 
                  href={`/dashboard/projects/${project.id}`}
                  className="flex w-full"
                >
                  View project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link 
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="flex w-full"
                >
                  Edit project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Run new analysis</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {project.description}
        </p>
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Content gaps found:</span>
            <span className="font-medium">{project.contentGapsFound}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last analysis:</span>
            <span>{lastAnalysis}</span>
          </div>
          {project.domains.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Domains:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {project.domains.slice(0, 2).map((domain) => (
                  <div key={domain} className="flex items-center">
                    <Badge variant="outline" className="h-5 flex items-center gap-1 text-xs">
                      <ExternalLink className="h-3 w-3" />
                      {domain}
                    </Badge>
                  </div>
                ))}
                {project.domains.length > 2 && (
                  <Badge variant="outline" className="h-5 flex items-center text-xs">
                    +{project.domains.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
            <AvatarFallback>{project.owner.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{project.owner.name}</span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/projects/${project.id}/report`} className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Report
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 