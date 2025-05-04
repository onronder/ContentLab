"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, BarChart, AreaChart, PieChart } from "@/components/charts"

// Sample data for charts
const lineChartData = [
  { month: "Jan", visitors: 2200, conversions: 220, engagement: 890 },
  { month: "Feb", visitors: 2800, conversions: 280, engagement: 1200 },
  { month: "Mar", visitors: 3900, conversions: 390, engagement: 1600 },
  { month: "Apr", visitors: 3200, conversions: 320, engagement: 1400 },
  { month: "May", visitors: 3500, conversions: 350, engagement: 1700 },
  { month: "Jun", visitors: 4100, conversions: 410, engagement: 2000 },
  { month: "Jul", visitors: 4500, conversions: 450, engagement: 2200 },
  { month: "Aug", visitors: 4300, conversions: 430, engagement: 2100 },
  { month: "Sep", visitors: 5000, conversions: 500, engagement: 2400 },
  { month: "Oct", visitors: 5200, conversions: 520, engagement: 2600 },
  { month: "Nov", visitors: 4800, conversions: 480, engagement: 2300 },
  { month: "Dec", visitors: 5500, conversions: 550, engagement: 2800 },
]

const barChartData = [
  { category: "SEO", content: 45, competitors: 37 },
  { category: "Email", content: 30, competitors: 32 },
  { category: "Social", content: 60, competitors: 42 },
  { category: "Blog", content: 75, competitors: 60 },
  { category: "Video", content: 50, competitors: 55 },
]

const areaChartData = [
  { date: "2023-01", organic: 5400, paid: 2100, direct: 1200 },
  { date: "2023-02", organic: 5700, paid: 1900, direct: 1300 },
  { date: "2023-03", organic: 6200, paid: 2300, direct: 1400 },
  { date: "2023-04", organic: 6800, paid: 2100, direct: 1500 },
  { date: "2023-05", organic: 7200, paid: 1800, direct: 1600 },
  { date: "2023-06", organic: 8000, paid: 2200, direct: 1700 },
  { date: "2023-07", organic: 8500, paid: 2600, direct: 1900 },
]

const pieChartData = [
  { name: "Blog", value: 35, color: "primary" },
  { name: "Social", value: 25, color: "info" },
  { name: "Email", value: 20, color: "success" },
  { name: "SEO", value: 15, color: "warning" },
  { name: "Other", value: 5, color: "muted" },
]

const contentGapData = [
  { topic: "Product Reviews", yourContent: 12, competitorAvg: 28 },
  { topic: "How-to Guides", yourContent: 45, competitorAvg: 32 },
  { topic: "Industry News", yourContent: 8, competitorAvg: 22 },
  { topic: "Case Studies", yourContent: 15, competitorAvg: 18 },
  { topic: "Comparisons", yourContent: 5, competitorAvg: 16 },
]

export default function ChartsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader
          heading="Chart Components"
          subheading="Interactive and themeable chart components for data visualization"
        />
        
        <Tabs defaultValue="line" className="space-y-4">
          <TabsList>
            <TabsTrigger value="line">Line Charts</TabsTrigger>
            <TabsTrigger value="bar">Bar Charts</TabsTrigger>
            <TabsTrigger value="area">Area Charts</TabsTrigger>
            <TabsTrigger value="pie">Pie Charts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="line" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Metrics (Line Chart)</CardTitle>
                <CardDescription>
                  Visualization of website traffic metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={lineChartData}
                  xAxisDataKey="month"
                  lines={[
                    { dataKey: "visitors", name: "Visitors", color: "primary", strokeWidth: 2 },
                    { dataKey: "conversions", name: "Conversions", color: "success" },
                    { dataKey: "engagement", name: "Engagement", color: "info" },
                  ]}
                  tooltipFormatter={(value) => `${value.toLocaleString()}`}
                  height={400}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bar" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Gap Analysis</CardTitle>
                  <CardDescription>
                    Comparison between your content and competitor average
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={contentGapData}
                    xAxisDataKey="topic"
                    bars={[
                      { dataKey: "yourContent", name: "Your Content", color: "primary" },
                      { dataKey: "competitorAvg", name: "Competitor Avg", color: "danger" },
                    ]}
                    tooltipFormatter={(value) => `${value} pieces`}
                    height={300}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Content by Category</CardTitle>
                  <CardDescription>
                    Your content vs competitor content by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={barChartData}
                    xAxisDataKey="category"
                    bars={[
                      { dataKey: "content", name: "Your Content", color: "primary" },
                      { dataKey: "competitors", name: "Competitor Content", color: "secondary" },
                    ]}
                    tooltipFormatter={(value) => `${value} articles`}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Horizontal Bar Chart</CardTitle>
                <CardDescription>
                  Content performance by category displayed horizontally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  xAxisDataKey="category"
                  bars={[
                    { dataKey: "content", name: "Your Content", color: "info" },
                    { dataKey: "competitors", name: "Competitor Content", color: "warning" },
                  ]}
                  tooltipFormatter={(value) => `${value} articles`}
                  height={300}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="area" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>
                  Breakdown of traffic sources over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={areaChartData}
                  xAxisDataKey="date"
                  areas={[
                    { dataKey: "organic", name: "Organic Traffic", color: "success", fillOpacity: 0.6 },
                    { dataKey: "paid", name: "Paid Traffic", color: "info", fillOpacity: 0.6 },
                    { dataKey: "direct", name: "Direct Traffic", color: "primary", fillOpacity: 0.6 },
                  ]}
                  tooltipFormatter={(value) => `${value.toLocaleString()} visits`}
                  height={400}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stacked Area Chart</CardTitle>
                <CardDescription>
                  Traffic sources with stacking to show total volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={areaChartData}
                  xAxisDataKey="date"
                  areas={[
                    { dataKey: "organic", name: "Organic", color: "success", fillOpacity: 0.6, stackId: "stack" },
                    { dataKey: "paid", name: "Paid", color: "info", fillOpacity: 0.6, stackId: "stack" },
                    { dataKey: "direct", name: "Direct", color: "primary", fillOpacity: 0.6, stackId: "stack" },
                  ]}
                  tooltipFormatter={(value) => `${value.toLocaleString()} visits`}
                  height={400}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pie" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Distribution</CardTitle>
                  <CardDescription>
                    Content breakdown by channel type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={pieChartData}
                    tooltipFormatter={(value) => `${value}%`}
                    height={300}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Donut Chart</CardTitle>
                  <CardDescription>
                    Content distribution with inner radius
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart
                    data={pieChartData}
                    innerRadius="60%"
                    tooltipFormatter={(value) => `${value}%`}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 