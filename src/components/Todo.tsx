"use client"

import * as React from "react"
import { useState } from "react"
import { TodoItemProps } from "@/components/ui/todo-item"
import { TodoList } from "@/components/ui/todo-list"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { TodoForm } from "@/components/ui/todo-form"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid" // Note: You'll need to install this package

// Sample initial data
const initialTodos: TodoItemProps[] = [
  {
    id: "1",
    title: "Complete design system",
    description: "Implement all core components and tokens",
    completed: false,
    priority: "high",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    tags: ["design", "ui"]
  },
  {
    id: "2",
    title: "Create responsive layout",
    description: "Ensure the app works well on mobile and desktop",
    completed: true,
    priority: "medium",
    tags: ["responsive", "layout"]
  },
  {
    id: "3",
    title: "Add dark mode support",
    description: "Implement toggle for light/dark themes",
    completed: false,
    priority: "low",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    tags: ["theming"]
  },
]

export function Todo() {
  const [todos, setTodos] = useState<TodoItemProps[]>(initialTodos)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTodo, setCurrentTodo] = useState<TodoItemProps | null>(null)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleToggleComplete = (id: string, completed: boolean) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed } : todo
    ))
    
    toast({
      title: completed ? "Todo completed" : "Todo marked incomplete",
      description: `"${todos.find(todo => todo.id === id)?.title}" has been updated`,
      variant: completed ? "default" : "destructive",
    })
  }

  const handleEdit = (id: string) => {
    const todoToEdit = todos.find(todo => todo.id === id)
    if (todoToEdit) {
      setCurrentTodo(todoToEdit)
      setIsDialogOpen(true)
    }
  }

  const handleDeleteConfirm = (id: string) => {
    setTodoToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (todoToDelete) {
      const deletedTodo = todos.find(todo => todo.id === todoToDelete)
      setTodos(todos.filter(todo => todo.id !== todoToDelete))
      setIsDeleteDialogOpen(false)
      setTodoToDelete(null)
      
      toast({
        title: "Todo deleted",
        description: `"${deletedTodo?.title}" has been removed`,
        variant: "destructive",
      })
    }
  }

  const handleAdd = () => {
    setCurrentTodo(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = (values: Omit<TodoItemProps, 'id'> & { id?: string }) => {
    if (values.id) {
      // Update existing todo
      setTodos(todos.map(todo => 
        todo.id === values.id ? { ...todo, ...values } : todo
      ))
      
      toast({
        title: "Todo updated",
        description: `"${values.title}" has been updated`,
      })
    } else {
      // Add new todo
      const newTodo: TodoItemProps = {
        ...values,
        id: uuidv4(),
        completed: false,
      }
      
      setTodos([...todos, newTodo])
      
      toast({
        title: "Todo created",
        description: `"${values.title}" has been added`,
      })
    }
    
    setIsDialogOpen(false)
    setCurrentTodo(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Todo App</h1>
        <Button onClick={handleAdd} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Todo
        </Button>
      </div>
      
      <TodoList
        todos={todos}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDeleteConfirm}
        onAdd={handleAdd}
        showFilters={true}
      />
      
      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentTodo ? "Edit Todo" : "Create Todo"}</DialogTitle>
            <DialogDescription>
              {currentTodo 
                ? "Make changes to your todo item here."
                : "Fill out the form to create a new todo item."
              }
            </DialogDescription>
          </DialogHeader>
          
          <TodoForm
            defaultValues={currentTodo || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this todo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 