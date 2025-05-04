"use client"

import * as React from "react"

type WidgetId = string

interface DashboardContextType {
  widgets: WidgetId[]
  isEditing: boolean
  setWidgets: React.Dispatch<React.SetStateAction<WidgetId[]>>
  toggleEditMode: () => void
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: React.ReactNode
  defaultWidgets: WidgetId[]
}

export function DashboardProvider({ 
  children, 
  defaultWidgets 
}: DashboardProviderProps) {
  const [widgets, setWidgets] = React.useState<WidgetId[]>(defaultWidgets)
  const [isEditing, setIsEditing] = React.useState(false)
  
  // Load saved widget order from localStorage on mount (client-side only)
  React.useEffect(() => {
    try {
      const savedWidgets = localStorage.getItem("dashboard-widgets")
      if (savedWidgets) {
        setWidgets(JSON.parse(savedWidgets))
      }
    } catch (error) {
      console.error("Failed to load dashboard layout", error)
    }
  }, [])
  
  // Save widget order to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("dashboard-widgets", JSON.stringify(widgets))
    } catch (error) {
      console.error("Failed to save dashboard layout", error)
    }
  }, [widgets])
  
  const toggleEditMode = React.useCallback(() => {
    setIsEditing(prev => !prev)
  }, [])
  
  const value = React.useMemo(() => ({
    widgets,
    isEditing,
    setWidgets,
    toggleEditMode
  }), [widgets, isEditing, toggleEditMode])
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = React.useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
} 