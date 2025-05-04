"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn("grid items-start gap-8", className)} {...props}>
      <main className="container mx-auto px-4 py-6 md:py-10">
        {children}
      </main>
    </div>
  )
} 