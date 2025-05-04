import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportsList } from "@/components/reports/reports-list";
import { Button } from "@/components/ui/button";
import { FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reports - Content Roadmap Tool",
  description: "View and manage your content analysis reports",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DashboardHeader 
            heading="Reports" 
            subheading="View, generate, and schedule content analysis reports."
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reports/schedule" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Schedule Reports
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/reports/new" className="flex items-center gap-1">
                <FileText className="h-4 w-4 mr-1" />
                Generate Report
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex justify-between items-start">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="content-gaps">Content Gaps</TabsTrigger>
              <TabsTrigger value="competitor">Competitor Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="space-y-4">
            <ReportsList />
          </TabsContent>
          
          <TabsContent value="content-gaps" className="space-y-4">
            <ReportsList reportType="content-gaps" />
          </TabsContent>
          
          <TabsContent value="competitor" className="space-y-4">
            <ReportsList reportType="competitor" />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <ReportsList reportType="performance" />
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>
                  Manage your automated report generation schedule.
                </CardDescription>
              </CardHeader>
              <ReportsList reportType="scheduled" />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 