import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportForm } from "@/components/reports";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Generate Report - Content Roadmap Tool",
  description: "Create a new content analysis report",
};

export default function NewReportPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <DashboardHeader 
            heading="Generate New Report" 
            subheading="Create a new content analysis report based on your project data."
          />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/reports" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>
        <ReportForm />
      </div>
    </div>
  );
} 