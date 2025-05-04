"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import { useDashboard } from "./dashboard-context"

interface DraggableWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
  children: React.ReactNode
}

export function DraggableWidget({ 
  id, 
  children, 
  className,
  ...props 
}: DraggableWidgetProps) {
  const { isEditing } = useDashboard()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-70",
        className
      )}
      {...props}
    >
      {isEditing && (
        <div 
          className="absolute top-1 right-1 flex items-center justify-center p-1 rounded-md bg-muted hover:bg-muted/80 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {children}
    </div>
  )
} 