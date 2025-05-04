"use client"

import * as React from "react"
import { useState } from "react"
import { MobileOptimizedLayout } from "@/components/layout/mobile-optimized-layout"
import { ResponsiveCard } from "@/components/ui/responsive-card"
import { TouchInput } from "@/components/ui/touch-input"
import { MobileDataTable } from "@/components/ui/mobile-data-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChevronRight, 
  Filter, 
  Trash, 
  Edit,
  Check,
  FileText,
  AlertCircle,
  PlusCircle,
  Download,
  Smartphone,
  MousePointer,
  Laptop
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function MobileOptimizedPage() {
  return (
    <MobileOptimizedLayout>
      <div className="container max-w-5xl py-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Mobile Optimization Demo</h1>
          <p className="text-muted-foreground">
            Examples of mobile-optimized components with responsive designs and touch interactions
          </p>
        </div>

        <Tabs defaultValue="components">
          <TabsList className="mb-4">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="datatable">Data Table</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components" className="space-y-6">
            <ComponentsDemo />
          </TabsContent>
          
          <TabsContent value="datatable">
            <DataTableDemo />
          </TabsContent>
          
          <TabsContent value="about">
            <AboutSection />
          </TabsContent>
        </Tabs>
      </div>
    </MobileOptimizedLayout>
  )
}

function ComponentsDemo() {
  const [expandedState, setExpandedState] = useState({
    card1: false,
    card2: false,
  })

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Touch-Friendly Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TouchInput 
            id="search-demo"
            label="Search" 
            placeholder="Search for content..."
            showClearButton
          />
          
          <TouchInput 
            id="password-demo"
            label="Password" 
            type="password"
            placeholder="Enter password"
            helperText="Must be at least 8 characters"
          />
          
          <TouchInput 
            id="error-demo"
            label="Email Address" 
            placeholder="your@email.com"
            error="Please enter a valid email address"
          />
          
          <TouchInput 
            id="optional-demo"
            label="Company (Optional)" 
            placeholder="Your company name"
            helperText="This information will be visible on your profile"
          />
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Responsive Cards</h2>
        <div className="space-y-6">
          <ResponsiveCard
            title="Expandable Card on Mobile"
            description="Swipe up or tap the header to expand this card on mobile devices"
            isExpandable
            initiallyExpanded={expandedState.card1}
            onExpand={(expanded) => setExpandedState({...expandedState, card1: expanded})}
            footer={
              <div className="flex justify-end">
                <Button size="sm">Learn More</Button>
              </div>
            }
          >
            <div className="space-y-4">
              <p>
                This card is designed to be touch-friendly on mobile devices. You can swipe up/down
                or tap the header to expand or collapse the content.
              </p>
              
              <p>
                On desktop, the card displays all content normally without the expandable functionality.
                This approach saves space on smaller screens while providing all content on larger ones.
              </p>
              
              <p className="text-muted-foreground text-sm">
                The card also features responsive typography and spacing that adjusts based on the
                screen size. Notice how UI elements adapt to provide better touch targets on mobile.
              </p>
              
              <div className="flex items-center justify-center p-6 border rounded-lg">
                <div className="text-center space-y-2">
                  <Smartphone className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-medium">Mobile-Optimized Design</p>
                </div>
              </div>
            </div>
          </ResponsiveCard>
          
          <ResponsiveCard
            title="Full-Width Mobile Card"
            description="This card stretches edge-to-edge on mobile devices"
            mobileFullWidth={true}
            isExpandable
            initiallyExpanded={expandedState.card2}
            onExpand={(expanded) => setExpandedState({...expandedState, card2: expanded})}
          >
            <div className="space-y-4">
              <p>
                On mobile devices, this card spans the full width of the screen edge-to-edge,
                creating a native app-like experience. The border radius and horizontal padding
                are removed on mobile.
              </p>
              
              <div className="flex gap-4 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Full-width mobile</span>
                </Badge>
                
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MousePointer className="h-3.5 w-3.5" />
                  <span>Swipe gestures</span>
                </Badge>
                
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Responsive layout</span>
                </Badge>
              </div>
            </div>
          </ResponsiveCard>
        </div>
      </section>
    </div>
  )
}

function DataTableDemo() {
  // Mock data for the table
  const data = [
    { id: "1", title: "Content Strategy Overview", status: "Published", views: 1254, lastUpdated: "2023-10-15" },
    { id: "2", title: "SEO Best Practices Guide", status: "Draft", views: 0, lastUpdated: "2023-10-22" },
    { id: "3", title: "Content Gap Analysis Report", status: "Published", views: 867, lastUpdated: "2023-09-30" },
    { id: "4", title: "Competitor Content Comparison", status: "In Review", views: 124, lastUpdated: "2023-10-18" },
    { id: "5", title: "Monthly Performance Report", status: "Published", views: 2341, lastUpdated: "2023-10-05" },
  ]
  
  // Table columns definition
  const columns = [
    {
      header: "Document",
      accessorKey: "title" as const,
      visibleOnMobile: true,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      visibleOnMobile: true,
      cell: (item: typeof data[0]) => (
        <Badge variant={
          item.status === "Published" ? "success" 
          : item.status === "Draft" ? "outline"
          : "secondary"
        }>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Views",
      accessorKey: "views" as const,
      visibleOnMobile: true,
      cell: (item: typeof data[0]) => (
        <span>{item.views.toLocaleString()}</span>
      )
    },
    {
      header: "Last Updated",
      accessorKey: "lastUpdated" as const,
      visibleOnMobile: false,
      cell: (item: typeof data[0]) => (
        <span>{new Date(item.lastUpdated).toLocaleDateString()}</span>
      )
    },
  ]
  
  // Row actions
  const actions = [
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: (item: typeof data[0]) => alert(`Editing: ${item.title}`),
    },
    {
      label: "Download",
      icon: <Download className="h-4 w-4 mr-2" />,
      onClick: (item: typeof data[0]) => alert(`Downloading: ${item.title}`),
    },
    {
      label: "Delete",
      icon: <Trash className="h-4 w-4 mr-2" />,
      onClick: (item: typeof data[0]) => alert(`Deleting: ${item.title}`),
      destructive: true,
    },
  ]
  
  // Swipe actions
  const swipeActions = [
    {
      label: "Edit",
      icon: <Edit className="h-5 w-5" />,
      color: "#0284c7", // blue
      onClick: (item: typeof data[0]) => alert(`Editing: ${item.title}`),
      side: "left" as const,
    },
    {
      label: "Delete",
      icon: <Trash className="h-5 w-5" />,
      color: "#e11d48", // red
      onClick: (item: typeof data[0]) => alert(`Deleting: ${item.title}`),
      side: "right" as const,
    },
  ]
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mobile-Optimized Data Table</h2>
        <p className="text-muted-foreground">
          A responsive data table with swipe actions on mobile and traditional layout on desktop.
          Try swiping rows left and right on mobile to reveal actions.
        </p>
        
        <div className="flex items-center gap-2 mb-4">
          <TouchInput 
            placeholder="Search documents..." 
            className="flex-1"
            showClearButton
          />
          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
          <Button size="icon">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <MobileDataTable
          data={data}
          columns={columns}
          keyAccessor="id"
          actions={actions}
          swipeActions={swipeActions}
          onRowClick={(item) => alert(`Viewing details for: ${item.title}`)}
        />
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/50 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <p className="font-medium">Mobile interaction tips:</p>
        </div>
        <ul className="space-y-1 ml-6 list-disc text-muted-foreground">
          <li>Swipe rows left or right to reveal actions</li>
          <li>Tap on a row to view details</li>
          <li>The card layout automatically simplifies on smaller screens</li>
          <li>Less important columns are hidden on mobile</li>
        </ul>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">About Mobile Optimization</h2>
          
          <p>
            This demo showcases mobile-optimized components created as part of the Phase 4 
            implementation for the Content Roadmap Tool. These components are designed with 
            both mobile and desktop experiences in mind.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-medium">Key Features:</h3>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Touch-Optimized Interactions</span>
                  <p className="text-sm text-muted-foreground">
                    Larger touch targets, swipe gestures, and intuitive mobile interactions
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Responsive Layouts</span>
                  <p className="text-sm text-muted-foreground">
                    Different layouts for mobile and desktop that optimize for available screen space
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Mobile Navigation</span>
                  <p className="text-sm text-muted-foreground">
                    Bottom navigation and slide-out menus that follow mobile UX best practices
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Performance Optimized</span>
                  <p className="text-sm text-muted-foreground">
                    Components designed for minimal re-renders and optimal performance on mobile devices
                  </p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button>
              <ChevronRight className="h-4 w-4 mr-2" />
              Next Phase
            </Button>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  )
} 