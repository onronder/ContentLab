"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { MaskedInput } from "@/components/ui/masked-input"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface FormMaskedInputProps {
  name: string
  label?: string
  description?: string
  mask: string
  maskChar?: string
  formatChars?: Record<string, RegExp>
  autoUnmask?: boolean
  placeholder?: string
  className?: string
}

export function FormMaskedInput({
  name,
  label,
  description,
  mask,
  maskChar,
  formatChars,
  autoUnmask,
  placeholder,
  className,
}: FormMaskedInputProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MaskedInput
              mask={mask}
              maskChar={maskChar}
              formatChars={formatChars}
              autoUnmask={autoUnmask}
              placeholder={placeholder}
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