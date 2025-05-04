"use client"

import { useRouter } from "next/navigation"
import { useShortcut } from "@/providers/keyboard-shortcuts-provider"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useCallback } from "react"

export function useDashboardShortcuts() {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  
  // Create stable action callbacks
  const goToDashboard = useCallback(() => router.push("/dashboard"), [router])
  const goToProjects = useCallback(() => router.push("/dashboard/projects"), [router])
  const goToAnalysis = useCallback(() => router.push("/dashboard/analysis"), [router])
  const goToReports = useCallback(() => router.push("/dashboard/reports"), [router])
  const goToSettings = useCallback(() => router.push("/dashboard/settings"), [router])
  
  const createNewProject = useCallback(() => router.push("/dashboard/projects/new"), [router])
  const createNewAnalysis = useCallback(() => router.push("/dashboard/analysis/new"), [router])
  const createNewReport = useCallback(() => router.push("/dashboard/reports/new"), [router])
  
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    toast.info(`Theme changed to ${newTheme} mode`)
  }, [theme, setTheme])
  
  const refreshPage = useCallback(() => {
    router.refresh()
    toast.info("Page refreshed")
  }, [router])
  
  const saveContent = useCallback(() => {
    toast.success("Content saved")
  }, [])
  
  const undoAction = useCallback(() => {
    toast.info("Undo last action")
  }, [])
  
  const redoAction = useCallback(() => {
    toast.info("Redo last action")
  }, [])
  
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.removeAttribute('tabindex')
    }
  }, [])
  
  // Navigation shortcuts
  useShortcut({
    id: "dashboard-nav-home",
    key: "g h",
    action: goToDashboard,
    description: "Go to Dashboard Home",
    category: "navigation",
  })
  
  useShortcut({
    id: "dashboard-nav-projects",
    key: "g p",
    action: goToProjects,
    description: "Go to Projects",
    category: "navigation",
  })
  
  useShortcut({
    id: "dashboard-nav-analysis",
    key: "g a",
    action: goToAnalysis,
    description: "Go to Analysis",
    category: "navigation",
  })
  
  useShortcut({
    id: "dashboard-nav-reports",
    key: "g r",
    action: goToReports,
    description: "Go to Reports",
    category: "navigation",
  })
  
  useShortcut({
    id: "dashboard-nav-settings",
    key: "g s",
    action: goToSettings,
    description: "Go to Settings",
    category: "navigation",
  })
  
  // Actions shortcuts
  useShortcut({
    id: "dashboard-new-project",
    key: "n p",
    action: createNewProject,
    description: "Create New Project",
    category: "actions",
  })
  
  useShortcut({
    id: "dashboard-new-analysis",
    key: "n a",
    action: createNewAnalysis,
    description: "Create New Analysis",
    category: "actions",
  })
  
  useShortcut({
    id: "dashboard-new-report",
    key: "n r",
    action: createNewReport,
    description: "Create New Report",
    category: "actions",
  })
  
  // View shortcuts
  useShortcut({
    id: "dashboard-toggle-theme",
    key: "t",
    action: toggleTheme,
    description: "Toggle Dark/Light Theme",
    category: "views",
  })
  
  useShortcut({
    id: "dashboard-refresh",
    key: "r",
    action: refreshPage,
    description: "Refresh Current Page",
    category: "views",
  })
  
  // Editing shortcuts - example for content editor
  useShortcut({
    id: "dashboard-save",
    key: "ctrl+s",
    action: saveContent,
    description: "Save Current Content",
    category: "editing",
  })
  
  useShortcut({
    id: "dashboard-undo",
    key: "ctrl+z",
    action: undoAction,
    description: "Undo Last Action",
    category: "editing",
  })
  
  useShortcut({
    id: "dashboard-redo",
    key: "ctrl+shift+z",
    action: redoAction,
    description: "Redo Last Action",
    category: "editing",
  })
  
  // Accessibility shortcuts
  useShortcut({
    id: "dashboard-skip-to-content",
    key: "shift+/",
    action: skipToContent,
    description: "Skip to Main Content",
    category: "accessibility",
  })
  
  // These are just registered to show in the help modal
  // The actual implementations are in the KeyboardShortcutsProvider
  useShortcut({
    id: "dashboard-help",
    key: "?",
    action: () => {},
    description: "Show Keyboard Shortcuts Help",
    category: "accessibility",
  })
  
  useShortcut({
    id: "dashboard-toggle-shortcuts",
    key: "ctrl+k",
    action: () => {},
    description: "Toggle Keyboard Shortcuts On/Off",
    category: "accessibility",
  })
} 