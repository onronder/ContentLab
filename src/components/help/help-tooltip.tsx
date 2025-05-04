"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface HelpTooltipProps {
  content: string | React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  iconClassName?: string
  helpLink?: string
  wide?: boolean
  delay?: number
}

export function HelpTooltip({
  content,
  side = "top",
  align = "center",
  className,
  iconClassName,
  helpLink,
  wide = false,
  delay = 0,
}: HelpTooltipProps) {
  const tooltipTrigger = (
    <TooltipTrigger asChild>
      <div className={cn("inline-flex cursor-help", className)}>
        <HelpCircle className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </div>
    </TooltipTrigger>
  )

  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        {helpLink ? (
          <Link href={helpLink} className="inline-flex">
            {tooltipTrigger}
          </Link>
        ) : (
          tooltipTrigger
        )}
        <TooltipContent
          side={side}
          align={align}
          className={cn("max-w-xs text-xs", wide && "max-w-sm")}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Example of creating more specific help tooltips
export function FeatureHelpTooltip({
  featureId,
  ...props
}: Omit<HelpTooltipProps, "content" | "helpLink"> & { featureId: string }) {
  // This would typically come from a central help content store or API
  const helpContent = {
    'content-gap-analysis': {
      content: "Content gap analysis helps you identify topics your audience is searching for that your website doesn't currently cover.",
      link: "/help?topic=content-gap-analysis"
    },
    'topic-clusters': {
      content: "Topic clusters help you organize your content into related groups for better SEO performance and user experience.",
      link: "/help?topic=topic-clusters"
    },
    'quota-usage': {
      content: "Your quota determines how many analyses you can run per month based on your subscription plan.",
      link: "/help?topic=quotas"
    },
    'competitor-analysis': {
      content: "Compare your content strategy against top competitors to identify opportunities and threats.",
      link: "/help?topic=competitor-analysis"
    },
    'reports': {
      content: "Generate customized reports with your analysis findings to share with stakeholders.",
      link: "/help?topic=reporting"
    },
    // Add more feature help items as needed
  }
  
  const help = helpContent[featureId as keyof typeof helpContent] || {
    content: "Learn more about this feature",
    link: "/help"
  }
  
  return (
    <HelpTooltip
      content={help.content}
      helpLink={help.link}
      {...props}
    />
  )
} 