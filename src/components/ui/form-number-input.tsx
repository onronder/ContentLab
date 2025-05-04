"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { NumberInput } from "@/components/ui/number-input"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface FormNumberInputProps {
  name: string
  label?: string
  description?: string
  min?: number
  max?: number
  step?: number
  controls?: boolean
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  decimalPlaces?: number
  className?: string
}

export function FormNumberInput({
  name,
  label,
  description,
  min,
  max,
  step,
  controls = true,
  formatOptions,
  locale,
  decimalPlaces,
  className,
}: FormNumberInputProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <NumberInput
              min={min}
              max={max}
              step={step}
              controls={controls}
              formatOptions={formatOptions}
              locale={locale}
              decimalPlaces={decimalPlaces}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
} 