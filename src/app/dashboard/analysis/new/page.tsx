import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { AnalysisForm } from "@/components/analysis/analysis-form"

export const metadata: Metadata = {
  title: "New Analysis | Content Roadmap Tool",
  description: "Configure and run a new content analysis",
}

export default function NewAnalysisPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <DashboardHeader 
            heading="Run New Analysis" 
            subheading="Configure and run a new content analysis for your project."
          />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analysis" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Analysis
            </Link>
          </Button>
        </div>
        <AnalysisForm />
      </div>
    </div>
  )
} 