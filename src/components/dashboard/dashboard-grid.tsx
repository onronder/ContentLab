"use client"

import * as React from "react"
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDashboard } from "./dashboard-context"
import { Pencil, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface WidgetProps {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Type guard to check if element is a widget component
function isWidgetElement(child: React.ReactNode): child is React.ReactElement<WidgetProps> {
  if (!React.isValidElement(child)) return false;
  return 'props' in child && 
         child.props !== null && 
         typeof child.props === 'object' &&
         'id' in child.props && 
         typeof child.props.id === 'string';
}

export function DashboardGrid({ children, className, ...props }: DashboardGridProps) {
  const { widgets, setWidgets, isEditing, toggleEditMode } = useDashboard()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id.toString())
        const newIndex = items.indexOf(over.id.toString())
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  const handleSaveLayout = () => {
    toggleEditMode()
    toast({
      title: "Dashboard layout saved",
      description: "Your custom dashboard layout has been saved."
    })
  }
  
  // Find the children that match our widget IDs and in the right order
  const orderedChildren = React.Children.toArray(children)
    .filter(isWidgetElement)
    .filter(child => widgets.includes(child.props.id))
    .sort((a, b) => widgets.indexOf(a.props.id) - widgets.indexOf(b.props.id))
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={isEditing ? handleSaveLayout : toggleEditMode}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Layout
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Customize Dashboard
            </>
          )}
        </Button>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div 
            className={cn(
              "grid gap-4 md:grid-cols-2 lg:grid-cols-4", 
              isEditing && "border-2 border-dashed border-muted-foreground/20 p-4 rounded-lg",
              className
            )}
            {...props}
          >
            {orderedChildren}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
} 