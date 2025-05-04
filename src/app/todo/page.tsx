import { Metadata } from "next"
import { Todo } from "@/components/Todo"

export const metadata: Metadata = {
  title: "Todo App | Content Roadmap Tool",
  description: "Todo List Application with sorting, filtering and more",
}

export default function TodoPage() {
  return <Todo />
} 