import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectsList } from "@/components/projects/projects-list";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects - Content Roadmap Tool",
  description: "Manage your content projects and analysis workflows",
};

export default function ProjectsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader 
          heading="Projects" 
          subheading="Manage your content analysis projects and workflows."
          actions={
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          }
        />
        <ProjectsList />
      </div>
    </div>
  );
} 