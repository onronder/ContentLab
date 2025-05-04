import { Metadata } from "next";
import DashboardClientWrapper from "@/components/dashboard/dashboard-client-wrapper";

export const metadata: Metadata = {
  title: "Dashboard - Content Roadmap Tool",
  description: "View your content roadmap statistics and recent activity",
};

export default function DashboardPage() {
  return <DashboardClientWrapper />;
} 