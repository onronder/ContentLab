"use client"

import React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  DownloadCloud, 
  Share2, 
  MoreHorizontal, 
  Search, 
  Clock, 
  XCircle, 
  BarChart2, 
  Globe, 
  FileText,
  Repeat,
  PieChart,
  Plus
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Sample report data - in a real app, this would come from an API
const reports = [
  {
    id: "1",
    title: "SEO Content Gap Analysis - Q3 2023",
    description: "Comprehensive analysis of content gaps against top 3 competitors",
    type: "content-gaps",
    status: "completed",
    projectId: "1",
    projectName: "SEO Content Gap Analysis",
    createdAt: "2023-10-10T14:00:00Z",
    updatedAt: "2023-10-10T16:30:00Z",
    creator: {
      name: "Alex Chen",
      email: "alex@example.com",
      avatar: "/avatars/01.png",
    },
    summary: {
      totalGaps: 42,
      topOpportunities: 12,
      priorityScore: 78,
      recommendations: 15,
    },
    scheduled: false,
  },
  {
    id: "2",
    title: "Competitor Benchmark Report - Content Strategy",
    description: "Analysis of competitor content strategies and performance",
    type: "competitor",
    status: "completed",
    projectId: "4",
    projectName: "Competitor Content Benchmark",
    createdAt: "2023-10-05T09:15:00Z",
    updatedAt: "2023-10-05T11:45:00Z",
    creator: {
      name: "Taylor Kim",
      email: "taylor@example.com",
      avatar: "/avatars/04.png",
    },
    summary: {
      competitorsAnalyzed: 5,
      contentGapScore: 65,
      topKeywords: 28,
      recommendations: 12,
    },
    scheduled: false,
  },
  {
    id: "3",
    title: "Content Performance Analysis - Blog Section",
    description: "Performance metrics and optimization recommendations for blog content",
    type: "performance",
    status: "completed",
    projectId: "3",
    projectName: "Blog Content Optimization",
    createdAt: "2023-09-28T13:30:00Z",
    updatedAt: "2023-09-28T15:10:00Z",
    creator: {
      name: "Mark Wilson",
      email: "mark@example.com",
      avatar: "/avatars/03.png",
    },
    summary: {
      pagesAnalyzed: 87,
      avgEngagement: "2m 45s",
      improvementOpportunities: 32,
      recommendations: 18,
    },
    scheduled: false,
  },
  {
    id: "4",
    title: "Product Launch Content Strategy",
    description: "Pre-launch content gap analysis and strategy recommendations",
    type: "content-gaps",
    status: "in-progress",
    projectId: "2",
    projectName: "Product Launch Content Plan",
    createdAt: "2023-10-12T10:00:00Z",
    updatedAt: "2023-10-12T10:05:00Z",
    creator: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "/avatars/02.png",
    },
    summary: {
      progress: 45,
      estimatedCompletion: "2023-10-12T11:30:00Z",
    },
    scheduled: false,
  },
  {
    id: "5",
    title: "Weekly Content Performance Report",
    description: "Automated weekly report of content performance metrics",
    type: "performance",
    status: "scheduled",
    projectId: "3",
    projectName: "Blog Content Optimization",
    createdAt: "2023-10-01T08:00:00Z",
    updatedAt: "2023-10-08T08:00:00Z",
    creator: {
      name: "System",
      email: "system@example.com",
      avatar: "/avatars/system.png",
    },
    summary: {
      frequency: "weekly",
      nextRun: "2023-10-15T08:00:00Z",
      recipients: 3,
    },
    scheduled: true,
  },
  {
    id: "6",
    title: "Monthly Competitor Content Analysis",
    description: "Automated monthly analysis of competitor content changes",
    type: "competitor",
    status: "scheduled",
    projectId: "4",
    projectName: "Competitor Content Benchmark",
    createdAt: "2023-09-01T06:00:00Z",
    updatedAt: "2023-10-01T06:00:00Z",
    creator: {
      name: "System",
      email: "system@example.com",
      avatar: "/avatars/system.png",
    },
    summary: {
      frequency: "monthly",
      nextRun: "2023-11-01T06:00:00Z",
      recipients: 5,
    },
    scheduled: true,
  },
  {
    id: "7",
    title: "Technical Documentation Coverage Report",
    description: "Analysis of documentation completeness and quality",
    type: "content-gaps",
    status: "completed",
    projectId: "5",
    projectName: "Technical Documentation Audit",
    createdAt: "2023-08-12T11:20:00Z",
    updatedAt: "2023-08-12T14:15:00Z",
    creator: {
      name: "Jordan Lee",
      email: "jordan@example.com",
      avatar: "/avatars/05.png",
    },
    summary: {
      totalGaps: 24,
      completenessScore: 72,
      qualityScore: 85,
      recommendations: 9,
    },
    scheduled: false,
  },
];

interface ReportsListProps {
  reportType?: string;
}

export function ReportsList({ reportType }: ReportsListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("newest")
  const [page, setPage] = React.useState(1)
  const perPage = 6
  
  // Filter reports based on search, status, and type
  const filteredReports = reports.filter(report => {
    // Report type filter
    if (reportType && reportType !== "all" && reportType !== report.type) {
      // Handle scheduled reports separately
      if (reportType === "scheduled" && !report.scheduled) {
        return false
      } else if (reportType !== "scheduled" && report.type !== reportType) {
        return false
      }
    }
    
    // Search filter
    if (searchQuery && 
        !report.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !report.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !report.projectName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (statusFilter !== "all" && report.status !== statusFilter) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case "name-asc":
        return a.title.localeCompare(b.title)
      case "name-desc":
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })
  
  // Pagination
  const totalPages = Math.ceil(filteredReports.length / perPage)
  const paginatedReports = filteredReports.slice((page - 1) * perPage, page * perPage)
  
  // Get report type icon
  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "content-gaps":
        return BarChart2
      case "competitor":
        return Globe
      case "performance":
        return PieChart
      default:
        return FileText
    }
  }
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">Completed</Badge>
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">In Progress</Badge>
      case "scheduled":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30">Scheduled</Badge>
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Empty state for no reports
  if (filteredReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No reports found</h3>
        <p className="text-muted-foreground mt-1 mb-6 max-w-md">
          {searchQuery || statusFilter !== "all" 
            ? "Try adjusting your filters or search to find reports."
            : reportType === "scheduled" 
              ? "You don't have any scheduled reports yet."
              : "You haven't created any reports yet."}
        </p>
        <Button asChild>
          <Link href="/dashboard/reports/new">
            {reportType === "scheduled" 
              ? "Schedule a Report" 
              : "Generate a Report"}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Your Reports</h2>
          <p className="text-muted-foreground">
            Manage your reports and schedules
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1"
          asChild
        >
          <Link href="/dashboard/reports/new">
            <Plus className="h-3.5 w-3.5" />
            <span>New Report</span>
          </Link>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 gap-2 justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedReports.map((report) => {
          const ReportIcon = getReportTypeIcon(report.type)
          return (
            <Card key={report.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${
                      report.type === "content-gaps" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      report.type === "competitor" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      <ReportIcon className="h-3.5 w-3.5" />
                    </div>
                    <Badge variant="secondary" className="font-normal capitalize">
                      {report.type.replace("-", " ")}
                    </Badge>
                    {getStatusBadge(report.status)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/reports/${report.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <DownloadCloud className="mr-2 h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" /> Share
                      </DropdownMenuItem>
                      {report.scheduled && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Repeat className="mr-2 h-4 w-4" /> Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Schedule
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-2">
                  <Link href={`/dashboard/reports/${report.id}`} className="hover:underline">
                    {report.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Link href={`/dashboard/projects/${report.projectId}`} className="hover:underline">
                    {report.projectName}
                  </Link>
                </div>
                
                {report.status === "completed" && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {report.type === "content-gaps" && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Content Gaps</span>
                          <span className="font-medium">{report.summary.totalGaps}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Recommendations</span>
                          <span className="font-medium">{report.summary.recommendations}</span>
                        </div>
                      </>
                    )}
                    
                    {report.type === "competitor" && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Competitors</span>
                          <span className="font-medium">{report.summary.competitorsAnalyzed}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Top Keywords</span>
                          <span className="font-medium">{report.summary.topKeywords}</span>
                        </div>
                      </>
                    )}
                    
                    {report.type === "performance" && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Pages Analyzed</span>
                          <span className="font-medium">{report.summary.pagesAnalyzed}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Opportunities</span>
                          <span className="font-medium">{report.summary.improvementOpportunities}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {report.status === "in-progress" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span>{report.summary.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${report.summary.progress}%` }}
                      />
                    </div>
                    <div className="flex text-xs text-muted-foreground justify-end mt-1">
                      Estimated completion: {formatDistanceToNow(new Date(report.summary.estimatedCompletion), { addSuffix: true })}
                    </div>
                  </div>
                )}
                
                {report.status === "scheduled" && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Frequency</span>
                      <span className="font-medium capitalize">{report.summary.frequency}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Next Run</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(report.summary.nextRun), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto pt-4">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={report.creator.avatar} alt={report.creator.name} />
                      <AvatarFallback>{report.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{report.creator.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {report.status === "scheduled" 
                        ? `Updated ${formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}` 
                        : formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      
      {totalPages > 1 && (
        <Pagination className="justify-center mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : ""} 
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
} 