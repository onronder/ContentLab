"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface FormColorPickerProps {
  name: string
  label?: string
  description?: string
  showPreview?: boolean
  showInput?: boolean
  previewSize?: "sm" | "md" | "lg"
  containerClassName?: string
  previewClassName?: string
}

export function FormColorPicker({
  name,
  label,
  description,
  showPreview = true,
  showInput = true,
  previewSize = "md",
  containerClassName,
  previewClassName,
}: FormColorPickerProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <ColorPicker
              showPreview={showPreview}
              showInput={showInput}
              previewSize={previewSize}
              containerClassName={containerClassName}
              previewClassName={previewClassName}
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