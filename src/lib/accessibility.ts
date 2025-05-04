/**
 * Accessibility utilities for improving keyboard navigation and screen reader support
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Hook to detect if the user is navigating with keyboard
 * This helps apply appropriate focus styles only for keyboard users
 */
export function useKeyboardNavigation() {
  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsNavigatingWithKeyboard(true)
      }
    }

    const handleMouseDown = () => {
      setIsNavigatingWithKeyboard(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isNavigatingWithKeyboard
}

/**
 * Hook to trap focus within a component (for modals, dialogs, etc.)
 */
export function useFocusTrap(active = true) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Find all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus the first element when trap is activated
    requestAnimationFrame(() => {
      if (!container.contains(document.activeElement)) {
        firstElement.focus()
      }
    })

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  return containerRef
}

/**
 * Helper function to announce messages to screen readers
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return

  // Create or use existing live region
  let liveRegion = document.getElementById(`sr-live-region-${politeness}`)
  
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = `sr-live-region-${politeness}`
    liveRegion.setAttribute('aria-live', politeness)
    liveRegion.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status')
    liveRegion.style.position = 'absolute'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.padding = '0'
    liveRegion.style.overflow = 'hidden'
    liveRegion.style.clip = 'rect(0, 0, 0, 0)'
    liveRegion.style.whiteSpace = 'nowrap'
    liveRegion.style.border = '0'
    document.body.appendChild(liveRegion)
  }

  // Update the content to trigger announcement
  liveRegion.textContent = message
}

/**
 * Hook to provide skip navigation functionality
 * Creates a hidden link that becomes visible on focus to allow keyboard users
 * to skip to the main content
 */
export function useSkipNavigation(targetId = 'main-content') {
  useEffect(() => {
    // Ensure target element has proper tabindex
    const target = document.getElementById(targetId)
    if (target && !target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1')
    }
  }, [targetId])

  return {
    skipLinkProps: {
      className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border focus:rounded",
      href: `#${targetId}`,
      children: "Skip to main content",
    },
    mainProps: {
      id: targetId,
      tabIndex: -1,
    }
  }
} 