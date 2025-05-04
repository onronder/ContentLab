"use client"

import React, { useEffect, useState } from "react"
import { Command } from "lucide-react"
import { useKeyboardShortcuts } from "@/providers/keyboard-shortcuts-provider"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function KeyboardShortcutIndicator() {
  const { openShortcutsModal, isShortcutsEnabled } = useKeyboardShortcuts()
  const [show, setShow] = useState(false)
  
  // Show the indicator after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (!show) return null
  
  return (
    <div className={cn(
      "fixed bottom-4 right-4 transition-opacity duration-500",
      isShortcutsEnabled ? "opacity-100" : "opacity-50"
    )}>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-md"
            aria-label="Keyboard shortcuts help"
          >
            <Command className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[80vw] max-w-md sm:w-auto p-0">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Command className="h-5 w-5" />
              <h2>Keyboard Shortcuts Available</h2>
            </div>
            
            <p className="text-sm text-muted-foreground">
              This application supports keyboard shortcuts to help you work faster.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Press</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">?</kbd>
              </div>
              <p className="text-sm text-muted-foreground">
                at any time to view all available shortcuts.
              </p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={openShortcutsModal}>
                View All Shortcuts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 