"use client"

import * as React from "react"
import { TodoItem, TodoItemProps } from "@/components/ui/todo-item"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface TodoListProps {
  todos: TodoItemProps[]
  onToggleComplete?: (id: string, completed: boolean) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onAdd?: () => void
  className?: string
  showCompletedTodos?: boolean
  showFilters?: boolean
}

export function TodoList({
  todos,
  onToggleComplete,
  onEdit,
  onDelete,
  onAdd,
  className,
  showCompletedTodos = true,
  showFilters = true,
}: TodoListProps) {
  const [filterText, setFilterText] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [showCompleted, setShowCompleted] = React.useState(showCompletedTodos)

  const filteredTodos = React.useMemo(() => {
    return todos.filter((todo) => {
      // Filter by completion status
      if (!showCompleted && todo.completed) {
        return false
      }
      
      // Filter by search text
      if (filterText && !todo.title.toLowerCase().includes(filterText.toLowerCase())) {
        return false
      }
      
      // Filter by priority
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
        return false
      }
      
      return true
    })
  }, [todos, filterText, priorityFilter, showCompleted])

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search todos..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1"
          />
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={showCompleted ? "show" : "hide"}
            onValueChange={(value) => setShowCompleted(value === "show")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Show Completed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show Completed</SelectItem>
              <SelectItem value="hide">Hide Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No todos found</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              {...todo}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
      
      {onAdd && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          Add Todo
        </Button>
      )}
    </div>
  )
} 