"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Pen, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface TodoItemProps {
  id: string
  title: string
  description?: string
  completed: boolean
  priority?: "low" | "medium" | "high"
  dueDate?: Date
  tags?: string[]
  onToggleComplete?: (id: string, completed: boolean) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TodoItem({
  id,
  title,
  description,
  completed,
  priority = "medium",
  dueDate,
  tags = [],
  onToggleComplete,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const handleToggleComplete = () => {
    onToggleComplete?.(id, !completed)
  }

  const handleEdit = () => {
    onEdit?.(id)
  }

  const handleDelete = () => {
    onDelete?.(id)
  }

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const formatDueDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="flex items-start gap-2 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
      <Checkbox 
        id={`todo-${id}`} 
        checked={completed} 
        onCheckedChange={handleToggleComplete}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <label
            htmlFor={`todo-${id}`}
            className={cn(
              "text-base font-medium cursor-pointer leading-tight",
              completed && "line-through text-muted-foreground"
            )}
          >
            {title}
          </label>
          <div className="flex items-center gap-2 shrink-0">
            {priority && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityColors[priority])}>
                {priority}
              </span>
            )}
            {dueDate && (
              <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                {formatDueDate(dueDate)}
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className={cn(
            "text-sm text-muted-foreground mt-1",
            completed && "line-through"
          )}>
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleEdit}
        >
          <Pen className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  )
} 