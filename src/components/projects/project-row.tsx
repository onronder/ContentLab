"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  MoreHorizontal,
  ArrowRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectRowProps {
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

export function ProjectRow({ project }: ProjectRowProps) {
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
    <div className="rounded-lg border shadow-sm bg-card p-4">
      <div className="grid md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href={`/dashboard/projects/${project.id}`} 
              className="hover:underline font-semibold"
            >
              {project.name}
            </Link>
            <Badge 
              variant="secondary"
              className={`${getStatusColor(project.status)} capitalize`}
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs h-5">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-5">
                +{project.tags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
              <AvatarFallback>{project.owner.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none">{project.owner.name}</p>
              <p className="text-xs text-muted-foreground">{project.owner.email.split('@')[0]}</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>
        
        <div className="md:col-span-2 flex flex-col">
          <span className="text-sm font-medium">{project.contentGapsFound} gaps</span>
          <span className="text-xs text-muted-foreground">Last analysis: {lastAnalysis}</span>
        </div>
        
        <div className="md:col-span-2 flex justify-end items-center gap-2">
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
          
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
          
          <Button size="icon" variant="ghost" asChild>
            <Link href={`/dashboard/projects/${project.id}`}>
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">View project</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 