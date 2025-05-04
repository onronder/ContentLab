import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Project - Content Roadmap Tool",
  description: "Create a new content analysis project",
};

export default function NewProjectPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <DashboardHeader 
            heading="Create New Project" 
            subheading="Set up a new content analysis project and start discovering opportunities."
          />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/projects" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <ProjectForm />
      </div>
    </div>
  );
} 