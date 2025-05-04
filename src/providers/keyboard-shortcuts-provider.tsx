"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react"
import { toast } from "sonner"
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal"

// Define shortcut categories
export type ShortcutCategory = 
  | "navigation" 
  | "actions" 
  | "editing" 
  | "views" 
  | "accessibility"

// Define shortcut data structure
export interface Shortcut {
  id: string
  key: string // The key combination (e.g., "Ctrl+S")
  action: () => void
  description: string
  category: ShortcutCategory
  global?: boolean // If true, works anywhere in the app
}

interface KeyboardShortcutsContextType {
  shortcuts: Shortcut[]
  registerShortcut: (shortcut: Shortcut) => () => void
  unregisterShortcut: (id: string) => void
  isShortcutsEnabled: boolean
  toggleShortcutsEnabled: () => void
  openShortcutsModal: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

// Normalize key string for consistent comparison
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .split("+")
    .map((k) => k.trim())
    .sort()
    .join("+")
}

// Convert a keyboard event to a key string
function keyboardEventToKeyString(event: KeyboardEvent): string {
  const keys: string[] = []
  
  if (event.ctrlKey || event.metaKey) keys.push("ctrl")
  if (event.altKey) keys.push("alt")
  if (event.shiftKey) keys.push("shift")
  
  // For regular keys, use event.key
  if (event.key && !["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
    keys.push(event.key.toLowerCase())
  }
  
  return normalizeKey(keys.join("+"))
}

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Use a ref to store shortcuts to avoid re-renders
  const shortcutsRef = useRef<Shortcut[]>([])
  // Separate state for UI that should trigger re-renders
  const [shortcutsState, setShortcutsState] = useState<Shortcut[]>([])
  const [isShortcutsEnabled, setIsShortcutsEnabled] = useState<boolean>(true)
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false)

  // Update the UI state when the shortcuts ref changes
  const updateShortcutsState = useCallback(() => {
    setShortcutsState([...shortcutsRef.current])
  }, [])
  
  // Unregister a shortcut by id - use ref for state to avoid re-renders
  const unregisterShortcut = useCallback((id: string) => {
    shortcutsRef.current = shortcutsRef.current.filter((s) => s.id !== id)
    // Only update UI when needed
    updateShortcutsState()
  }, [updateShortcutsState])
  
  // Register a new shortcut - use ref for state to avoid re-renders
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    const exists = shortcutsRef.current.some((s) => s.id === shortcut.id)
    
    if (exists) {
      shortcutsRef.current = shortcutsRef.current.map((s) => 
        s.id === shortcut.id ? shortcut : s
      )
    } else {
      shortcutsRef.current = [...shortcutsRef.current, shortcut]
    }
    
    // Only update UI when needed
    updateShortcutsState()
    
    // Create a stable cleanup function that doesn't depend on the current state
    const shortcutId = shortcut.id
    return () => {
      shortcutsRef.current = shortcutsRef.current.filter((s) => s.id !== shortcutId)
      updateShortcutsState()
    }
  }, [updateShortcutsState])
  
  // Toggle shortcuts enabled
  const toggleShortcutsEnabled = useCallback(() => {
    setIsShortcutsEnabled((current) => {
      const newValue = !current
      toast.info(
        newValue ? "Keyboard shortcuts enabled" : "Keyboard shortcuts disabled"
      )
      return newValue
    })
  }, [])
  
  // Open the shortcuts modal
  const openShortcutsModal = useCallback(() => {
    setShowShortcutsModal(true)
  }, [])
  
  // Handle keyboard events
  useEffect(() => {
    if (!isShortcutsEnabled) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input elements
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }
      
      const keyString = keyboardEventToKeyString(event)
      
      // Find matching shortcut from ref (not state) to avoid circular dependencies
      const shortcut = shortcutsRef.current.find((s) => normalizeKey(s.key) === keyString)
      
      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isShortcutsEnabled])
  
  // Register default global shortcuts - use a more stable approach with refs
  useEffect(() => {
    // Store original functions to avoid dependency problems
    const openModal = openShortcutsModal
    const toggleEnabled = toggleShortcutsEnabled
    
    // Register help shortcut
    const helpShortcut: Shortcut = {
      id: "help",
      key: "?",
      action: openModal,
      description: "Open keyboard shortcuts help",
      category: "accessibility",
      global: true,
    }
    
    // Register toggle shortcut
    const toggleShortcut: Shortcut = {
      id: "toggle-shortcuts",
      key: "ctrl+k",
      action: toggleEnabled,
      description: "Toggle keyboard shortcuts on/off",
      category: "accessibility",
      global: true,
    }
    
    // Use refs directly to avoid circular dependencies
    const existingHelp = shortcutsRef.current.findIndex(s => s.id === "help")
    const existingToggle = shortcutsRef.current.findIndex(s => s.id === "toggle-shortcuts")
    
    if (existingHelp === -1) {
      shortcutsRef.current = [...shortcutsRef.current, helpShortcut]
    } else {
      shortcutsRef.current[existingHelp] = helpShortcut
    }
    
    if (existingToggle === -1) {
      shortcutsRef.current = [...shortcutsRef.current, toggleShortcut]
    } else {
      shortcutsRef.current[existingToggle] = toggleShortcut
    }
    
    // Update UI state
    updateShortcutsState()
    
    // Clean up on unmount
    return () => {
      // Not using unregisterShortcut to avoid dependency issues
      shortcutsRef.current = shortcutsRef.current.filter(
        s => s.id !== "help" && s.id !== "toggle-shortcuts"
      )
      updateShortcutsState()
    }
  }, [openShortcutsModal, toggleShortcutsEnabled, updateShortcutsState])
  
  const value = useMemo(
    () => ({
      shortcuts: shortcutsState,
      registerShortcut,
      unregisterShortcut,
      isShortcutsEnabled,
      toggleShortcutsEnabled,
      openShortcutsModal,
    }),
    [
      shortcutsState, 
      registerShortcut, 
      unregisterShortcut, 
      isShortcutsEnabled, 
      toggleShortcutsEnabled,
      openShortcutsModal,
    ]
  )
  
  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsModal 
        shortcuts={shortcutsState} 
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />
    </KeyboardShortcutsContext.Provider>
  )
}

// Custom hook to use keyboard shortcuts
export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider")
  }
  
  return context
}

// Helper hook to register a shortcut with automatic cleanup
export function useShortcut(shortcut: Omit<Shortcut, "id"> & { id?: string }) {
  const { registerShortcut } = useKeyboardShortcuts()
  
  // Create a stable object once that won't change on re-renders
  const shortcutRef = useRef<Shortcut>({
    id: shortcut.id || `shortcut-${Math.random().toString(36).substring(2, 9)}`,
    key: shortcut.key,
    action: shortcut.action,
    description: shortcut.description,
    category: shortcut.category,
    global: shortcut.global,
  })
  
  // Update the action reference to stay current
  shortcutRef.current.action = shortcut.action
  
  useEffect(() => {
    // Register the shortcut using the ref for stability
    const unregister = registerShortcut(shortcutRef.current)
    return unregister
  }, [registerShortcut])
} 