"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  containerClassName?: string
  previewClassName?: string
  showInput?: boolean
  showPreview?: boolean
  previewSize?: "sm" | "md" | "lg"
  onChange?: (value: string) => void
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ 
    className, 
    containerClassName, 
    previewClassName, 
    showInput = true, 
    showPreview = true, 
    previewSize = "md", 
    onChange,
    ...props 
  }, ref) => {
    const [color, setColor] = React.useState<string>(props.defaultValue as string || "#000000")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const mergedRef = useMergedRef(ref, inputRef)
    
    // Handle internal color state change
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value
      setColor(newColor)
      
      // Call external onChange handler if provided
      if (onChange) {
        onChange(newColor)
      }
    }
    
    const previewSizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8"
    }
    
    return (
      <div className={cn("flex items-center gap-2", containerClassName)}>
        {showPreview && (
          <div 
            className={cn(
              "rounded-md border border-input shadow-sm", 
              previewSizeClasses[previewSize],
              previewClassName
            )} 
            style={{ backgroundColor: color }}
            onClick={() => inputRef.current?.click()}
          />
        )}
        
        <input
          type="color"
          ref={mergedRef}
          value={color}
          onChange={handleColorChange}
          className={cn(
            "h-9 rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            showInput ? "w-auto" : "w-0 h-0 p-0 border-0 absolute opacity-0",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

// Custom hook to merge multiple refs
function useMergedRef<T>(
  ...refs: (React.MutableRefObject<T> | React.LegacyRef<T> | null | undefined)[]
): React.RefCallback<T> {
  return React.useCallback((value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }, [refs])
}

export { ColorPicker } 