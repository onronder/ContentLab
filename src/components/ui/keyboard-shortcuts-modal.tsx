"use client"

import React from "react"
import { Command } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shortcut, ShortcutCategory } from "@/providers/keyboard-shortcuts-provider"

interface KeyboardShortcutsModalProps {
  shortcuts: Shortcut[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsModal({
  shortcuts,
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  // Group shortcuts by category
  const shortcutsByCategory = React.useMemo(() => {
    return shortcuts.reduce<Record<ShortcutCategory, Shortcut[]>>(
      (acc, shortcut) => {
        if (!acc[shortcut.category]) {
          acc[shortcut.category] = []
        }
        acc[shortcut.category].push(shortcut)
        return acc
      },
      {
        navigation: [],
        actions: [],
        editing: [],
        views: [],
        accessibility: [],
      }
    )
  }, [shortcuts])

  // Get categories that have shortcuts
  const categoriesWithShortcuts = React.useMemo(() => {
    return Object.entries(shortcutsByCategory)
      .filter(([, shortcuts]) => shortcuts.length > 0)
      .map(([category]) => category) as ShortcutCategory[]
  }, [shortcutsByCategory])

  // Get category display name
  const getCategoryDisplayName = (category: ShortcutCategory): string => {
    switch (category) {
      case "navigation":
        return "Navigation"
      case "actions":
        return "Actions"
      case "editing":
        return "Editing"
      case "views":
        return "Views"
      case "accessibility":
        return "Accessibility"
      default:
        return category
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Command className="h-5 w-5 mr-2" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Keyboard shortcuts to help you work faster in ContentCreate.
          </DialogDescription>
        </DialogHeader>
        
        {shortcuts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              No keyboard shortcuts are currently registered.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={categoriesWithShortcuts[0]}>
            <TabsList className="mb-4">
              {categoriesWithShortcuts.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categoriesWithShortcuts.map((category) => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4">
                    {shortcutsByCategory[category].map((shortcut) => (
                      <ShortcutItem key={shortcut.id} shortcut={shortcut} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ShortcutItemProps {
  shortcut: Shortcut
}

function ShortcutItem({ shortcut }: ShortcutItemProps) {
  // Format key combination for display
  const formatKey = (key: string): React.ReactNode[] => {
    return key.split("+").map((k, i, arr) => (
      <React.Fragment key={i}>
        <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
          {k === "ctrl" ? (isMac() ? "⌘" : "Ctrl") : 
           k === "shift" ? (isMac() ? "⇧" : "Shift") : 
           k === "alt" ? (isMac() ? "⌥" : "Alt") : 
           k === "meta" ? "⌘" : 
           k === "left" ? "←" :
           k === "right" ? "→" :
           k === "up" ? "↑" :
           k === "down" ? "↓" :
           k === "esc" ? "Esc" :
           k === "enter" ? "↵" :
           k === "space" ? "Space" :
           k}
        </kbd>
        {i < arr.length - 1 && <span className="mx-1">+</span>}
      </React.Fragment>
    ))
  }

  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <div className="font-medium">{shortcut.description}</div>
      <div className="flex items-center space-x-1">
        {formatKey(shortcut.key)}
      </div>
    </div>
  )
}

// Helper to detect if running on macOS
function isMac(): boolean {
  return typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
} 