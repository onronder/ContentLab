"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Keyboard, Command } from "lucide-react"

interface ShortcutGroup {
  name: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["?"], description: "Open keyboard shortcuts" },
      { keys: ["Ctrl", "K"], description: "Open command palette" },
      { keys: ["Ctrl", "/"], description: "Toggle help menu" },
      { keys: ["Esc"], description: "Close dialog or modal" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "Go to dashboard" },
      { keys: ["G", "P"], description: "Go to projects" },
      { keys: ["G", "R"], description: "Go to reports" },
      { keys: ["G", "S"], description: "Go to settings" },
      { keys: ["G", "H"], description: "Go to help center" },
    ],
  },
  {
    name: "Content",
    shortcuts: [
      { keys: ["N", "P"], description: "New project" },
      { keys: ["N", "A"], description: "New analysis" },
      { keys: ["N", "R"], description: "New report" },
      { keys: ["E"], description: "Export current view" },
      { keys: ["S"], description: "Save changes" },
    ],
  },
  {
    name: "Analysis",
    shortcuts: [
      { keys: ["1"], description: "Content gaps tab" },
      { keys: ["2"], description: "Themes tab" },
      { keys: ["3"], description: "Recommendations tab" },
      { keys: ["R"], description: "Refresh data" },
      { keys: ["F"], description: "Toggle filters" },
    ],
  },
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)
  
  // Listen for '?' key press to open shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setOpen(true)}
        >
          <Keyboard className="h-4 w-4" />
          <span>Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to work more efficiently
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="mb-4">
            {shortcutGroups.map((group) => (
              <TabsTrigger value={group.name.toLowerCase()} key={group.name}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {shortcutGroups.map((group) => (
            <TabsContent 
              value={group.name.toLowerCase()} 
              key={group.name}
              className="space-y-4"
            >
              <div className="grid gap-3">
                {group.shortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs rounded bg-muted border">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border">?</kbd> anytime to view this dialog
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsTrigger() {
  return (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <Command className="h-4 w-4" />
      <span className="sr-only md:not-sr-only md:inline-block">Shortcuts</span>
    </Button>
  )
} 