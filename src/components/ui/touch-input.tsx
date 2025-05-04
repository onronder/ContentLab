"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface TouchInputProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "onChange"> {
  label?: string
  helperText?: string
  error?: string
  showClearButton?: boolean
  onChange?: (value: string) => void
  onClear?: () => void
  className?: string
  containerClassName?: string
  labelClassName?: string
  inputClassName?: string
  helperClassName?: string
  errorClassName?: string
}

export function TouchInput({
  label,
  helperText,
  error,
  type = "text",
  showClearButton = true,
  value = "",
  onChange,
  onClear,
  className,
  containerClassName,
  labelClassName,
  inputClassName,
  helperClassName,
  errorClassName,
  ...props
}: TouchInputProps) {
  const [localValue, setLocalValue] = useState(value as string)
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value as string)
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }
  
  const handleClear = () => {
    setLocalValue("")
    if (onClear) {
      onClear()
    } else if (onChange) {
      onChange("")
    }
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  
  // Determine actual input type
  const actualType = type === "password" && showPassword ? "text" : type
  
  return (
    <div className={cn("space-y-2", containerClassName, className)}>
      {label && (
        <Label 
          htmlFor={props.id} 
          className={cn(
            "text-sm font-medium",
            error && "text-destructive",
            labelClassName
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          type={actualType}
          value={localValue}
          onChange={handleChange}
          className={cn(
            // Mobile-optimized styling
            "h-11 px-4 py-2 text-base",
            // Adjust padding if we have clear or password toggle buttons
            ((showClearButton && localValue) || type === "password") && "pr-12",
            error && "border-destructive ring-destructive/50 focus-visible:ring-destructive/50",
            inputClassName
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            props.id ? 
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined 
              : undefined
          }
          {...props}
        />
        
        {/* Clear or Password Toggle Button */}
        {((showClearButton && localValue) || type === "password") && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {showClearButton && localValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p 
          className={cn(
            "text-xs",
            error ? 
              cn("text-destructive", errorClassName) : 
              cn("text-muted-foreground", helperClassName)
          )}
          id={props.id ? 
            error ? `${props.id}-error` : `${props.id}-helper` 
            : undefined
          }
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
} 