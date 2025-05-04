import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string
  subheading?: string
  actions?: React.ReactNode
}

export function DashboardHeader({
  heading,
  subheading,
  actions,
  className,
  ...props
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 pb-6", className)} {...props}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{heading}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {subheading && (
        <p className="text-lg text-muted-foreground">{subheading}</p>
      )}
    </div>
  )
} 