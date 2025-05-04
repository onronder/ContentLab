"use client"

// We can't use metadata in client components
// export const metadata: Metadata = {
//   title: "Todo Components | Content Roadmap Tool",
//   description: "Showcase of individual Todo components",
// }

import { TodoItem, TodoItemProps } from "@/components/ui/todo-item"
import { TodoList } from "@/components/ui/todo-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"

// Sample data for demos
const sampleTodos: TodoItemProps[] = [
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

export default function TodoComponentsPage() {
  return (
    <div className="container max-w-6xl py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Todo Components</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/todo">View Full Todo App</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <p className="text-muted-foreground mb-8">
        Display and documentation of the individual Todo components.
      </p>

      <Tabs defaultValue="todo-item">
        <TabsList className="mb-4">
          <TabsTrigger value="todo-item">TodoItem</TabsTrigger>
          <TabsTrigger value="todo-list">TodoList</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todo-item">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>TodoItem Component</CardTitle>
              <CardDescription>
                A standalone Todo item with various states and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Basic Todo (Incomplete)</h3>
                <TodoItem
                  id="demo-1"
                  title="Build responsive dashboard"
                  description="Create a responsive dashboard with charts and statistics"
                  completed={false}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Completed Todo</h3>
                <TodoItem
                  id="demo-2"
                  title="Design new logo"
                  description="Create a new logo for the brand"
                  completed={true}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Todo with Priority</h3>
                <div className="space-y-2">
                  <TodoItem
                    id="demo-3"
                    title="High priority task"
                    description="This is a high priority task"
                    completed={false}
                    priority="high"
                  />
                  <TodoItem
                    id="demo-4"
                    title="Medium priority task"
                    description="This is a medium priority task"
                    completed={false}
                    priority="medium"
                  />
                  <TodoItem
                    id="demo-5"
                    title="Low priority task"
                    description="This is a low priority task"
                    completed={false}
                    priority="low"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Todo with Due Date</h3>
                <TodoItem
                  id="demo-6"
                  title="Submit project proposal"
                  description="Finalize and submit the project proposal"
                  completed={false}
                  priority="high"
                  dueDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)} // 2 days from now
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Todo with Tags</h3>
                <TodoItem
                  id="demo-7"
                  title="Research competitor products"
                  description="Analyze features and pricing of competitor products"
                  completed={false}
                  priority="medium"
                  tags={["research", "competitive-analysis", "strategy"]}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Full-featured Todo</h3>
                <TodoItem
                  id="demo-8"
                  title="Prepare presentation for client meeting"
                  description="Create slides and talking points for the upcoming client presentation"
                  completed={false}
                  priority="high"
                  dueDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)} // 5 days from now
                  tags={["presentation", "client", "meeting"]}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Props Reference</CardTitle>
              <CardDescription>Available props for the TodoItem component</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Prop</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Default</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 font-mono">id</td>
                    <td className="py-2">string</td>
                    <td className="py-2">Required</td>
                    <td className="py-2">Unique identifier for the todo item</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">title</td>
                    <td className="py-2">string</td>
                    <td className="py-2">Required</td>
                    <td className="py-2">Title of the todo item</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">description</td>
                    <td className="py-2">string</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Optional description for the todo item</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">completed</td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">Required</td>
                    <td className="py-2">Whether the todo is completed or not</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">priority</td>
                    <td className="py-2">&quot;low&quot; | &quot;medium&quot; | &quot;high&quot;</td>
                    <td className="py-2">&quot;medium&quot;</td>
                    <td className="py-2">Priority level of the todo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">dueDate</td>
                    <td className="py-2">Date</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Optional due date for the todo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">tags</td>
                    <td className="py-2">string[]</td>
                    <td className="py-2">[]</td>
                    <td className="py-2">Array of tags for the todo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onToggleComplete</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when completion status is toggled</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onEdit</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when edit button is clicked</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">onDelete</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when delete button is clicked</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="todo-list">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>TodoList Component</CardTitle>
              <CardDescription>
                A list of todo items with filtering and sorting functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Basic Todo List</h3>
                <TodoList 
                  todos={sampleTodos}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Todo List with No Filters</h3>
                <TodoList 
                  todos={sampleTodos}
                  showFilters={false}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Empty Todo List</h3>
                <TodoList 
                  todos={[]}
                  onAdd={() => {}}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Props Reference</CardTitle>
              <CardDescription>Available props for the TodoList component</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Prop</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Default</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 font-mono">todos</td>
                    <td className="py-2">TodoItemProps[]</td>
                    <td className="py-2">Required</td>
                    <td className="py-2">Array of todo items to display</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onToggleComplete</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when completion status is toggled</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onEdit</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when edit button is clicked</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onDelete</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when delete button is clicked</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onAdd</td>
                    <td className="py-2">function</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Callback when add button is clicked</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">className</td>
                    <td className="py-2">string</td>
                    <td className="py-2">undefined</td>
                    <td className="py-2">Additional CSS class names</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">showCompletedTodos</td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">true</td>
                    <td className="py-2">Whether to show completed todos by default</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">showFilters</td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">true</td>
                    <td className="py-2">Whether to show filtering options</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 