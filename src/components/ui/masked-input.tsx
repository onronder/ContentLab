"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  mask: string
  maskChar?: string
  formatChars?: Record<string, RegExp>
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  autoUnmask?: boolean
}

// Default format characters for masking
const DEFAULT_FORMAT_CHARS: Record<string, RegExp> = {
  '9': /[0-9]/,
  'a': /[a-zA-Z]/,
  '*': /[a-zA-Z0-9]/
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ 
    className, 
    value, 
    mask,
    formatChars = DEFAULT_FORMAT_CHARS,
    onChange,
    onValueChange,
    autoUnmask = false,
    ...props 
  }, ref) => {
    // Reference to the input element
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combine refs
    const combinedRef = (node: HTMLInputElement) => {
      // Set the input ref
      inputRef.current = node
      
      // Forward the ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }
    
    // Track cursor position for proper placement after changes
    const [cursorPosition, setCursorPosition] = React.useState<number | null>(null)
    
    // Format the value to display with the mask
    const formatValue = (input: string): string => {
      let result = ''
      let inputIndex = 0
      
      // Go through each character in the mask
      for (let i = 0; i < mask.length; i++) {
        // Get the current mask character
        const maskChar = mask[i]
        
        // Check if this mask character has a format constraint
        const formatChar = formatChars[maskChar]
        
        if (formatChar) {
          // This is a position that needs input
          if (inputIndex < input.length) {
            const inputChar = input[inputIndex]
            
            // Check if the input character matches the format constraint
            if (formatChar.test(inputChar)) {
              result += inputChar
              inputIndex++
            } else {
              // Character doesn't match, skip it in the input
              inputIndex++
              i-- // Stay at the current mask position
            }
          } else {
            // No more input characters, use mask character
            result += maskChar
          }
        } else {
          // This is a fixed mask character, directly add it
          result += maskChar
        }
      }
      
      return result
    }
    
    // Extract raw value (removes the mask characters)
    const extractRawValue = (maskedValue: string): string => {
      let result = ''
      let maskIndex = 0
      
      for (let i = 0; i < maskedValue.length; i++) {
        const char = maskedValue[i]
        const maskChar = mask[maskIndex]
        
        if (formatChars[maskChar]) {
          // This is a format character position
          if (char !== maskChar) {
            result += char
          }
        }
        
        maskIndex++
      }
      
      return result
    }
    
    // Format the displayed value
    const displayValue = formatValue(value)
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const cursorPos = e.target.selectionStart
      
      // Extract the raw value without the mask
      const rawValue = extractRawValue(inputValue)
      
      // Store cursor position for later restoration
      setCursorPosition(cursorPos)
      
      // Call the external onChange handlers
      if (autoUnmask) {
        onChange?.(rawValue)
        onValueChange?.(rawValue)
      } else {
        onChange?.(formatValue(rawValue))
        onValueChange?.(formatValue(rawValue))
      }
    }
    
    // Restore cursor position after render
    React.useEffect(() => {
      if (cursorPosition !== null && inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
        setCursorPosition(null)
      }
    }, [displayValue, cursorPosition])
    
    return (
      <input
        type="text"
        ref={combinedRef}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    )
  }
)
MaskedInput.displayName = "MaskedInput"

export { MaskedInput } 