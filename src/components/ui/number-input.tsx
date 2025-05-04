"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string
  onChange?: (value: number) => void
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  controls?: boolean
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  decimalPlaces?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    onValueChange,
    min, 
    max, 
    step = 1, 
    controls = true,
    formatOptions,
    locale,
    decimalPlaces,
    disabled,
    ...props 
  }, ref) => {
    // Convert string to number if needed
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    
    // Track value internally as well
    const [localValue, setLocalValue] = React.useState<number>(numericValue)
    
    // Format the value for display
    const formatValue = (value: number): string => {
      if (typeof decimalPlaces === 'number') {
        return value.toFixed(decimalPlaces)
      }
      
      if (formatOptions) {
        return new Intl.NumberFormat(locale, formatOptions).format(value)
      }
      
      return value.toString()
    }
    
    // Update when external value changes
    React.useEffect(() => {
      setLocalValue(numericValue)
    }, [numericValue])
    
    // Handle increment/decrement
    const handleIncrement = () => {
      if (max !== undefined && localValue >= max) return
      
      const newValue = localValue + step
      const constrainedValue = max !== undefined ? Math.min(newValue, max) : newValue
      
      setLocalValue(constrainedValue)
      onChange?.(constrainedValue)
      onValueChange?.(constrainedValue)
    }
    
    const handleDecrement = () => {
      if (min !== undefined && localValue <= min) return
      
      const newValue = localValue - step
      const constrainedValue = min !== undefined ? Math.max(newValue, min) : newValue
      
      setLocalValue(constrainedValue)
      onChange?.(constrainedValue)
      onValueChange?.(constrainedValue)
    }
    
    // Handle direct input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Allow empty input
      if (inputValue === '') {
        setLocalValue(0)
        onChange?.(0)
        onValueChange?.(0)
        return
      }
      
      const parsed = parseFloat(inputValue)
      
      // Only update if it's a valid number
      if (!isNaN(parsed)) {
        let newValue = parsed
        
        // Constrain to min/max if defined
        if (min !== undefined) newValue = Math.max(newValue, min)
        if (max !== undefined) newValue = Math.min(newValue, max)
        
        setLocalValue(newValue)
        onChange?.(newValue)
        onValueChange?.(newValue)
      }
    }
    
    return (
      <div className="flex w-full">
        <div className={cn(
          "relative flex h-9 w-full rounded-md border border-input",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          {controls && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 rounded-l-md border-r border-input px-2"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && localValue <= min)}
            >
              <MinusIcon className="h-3 w-3" />
            </Button>
          )}
          
          <input
            type="text"
            inputMode="decimal"
            ref={ref}
            value={formatValue(localValue)}
            onChange={handleInputChange}
            className={cn(
              "flex w-full bg-transparent px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              controls && "text-center",
              className
            )}
            disabled={disabled}
            {...props}
          />
          
          {controls && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 rounded-r-md border-l border-input px-2"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && localValue >= max)}
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput } 