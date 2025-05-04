import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart2, FileText, Plus, Search, Filter, Download } from "lucide-react"
import Link from "next/link"
import { ContentGapsAnalysis } from "@/components/analysis/content-gaps-analysis"
import { TopicClustersAnalysis } from "@/components/analysis/topic-clusters-analysis"
import { RecommendationsSection } from "@/components/analysis/recommendations-section"

export const metadata: Metadata = {
  title: "Analysis Results | Content Roadmap Tool",
  description: "View content analysis results and recommendations",
}

export default function AnalysisPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DashboardHeader 
            heading="Analysis Results" 
            subheading="Visualize content gaps, topics, and get actionable recommendations."
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/analysis/new">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="content-gaps" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content-gaps">
              <BarChart2 className="h-4 w-4 mr-2" />
              Content Gaps
            </TabsTrigger>
            <TabsTrigger value="topic-clusters">
              <Search className="h-4 w-4 mr-2" />
              Topic Clusters
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <FileText className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content-gaps" className="space-y-4">
            <ContentGapsAnalysis />
          </TabsContent>
          
          <TabsContent value="topic-clusters" className="space-y-4">
            <TopicClustersAnalysis />
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <RecommendationsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 