"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

// Define the schema for report generation form
const reportFormSchema = z.object({
  title: z.string().min(3, {
    message: "Report title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  projectId: z.string({
    required_error: "Please select a project to analyze.",
  }),
  reportType: z.enum(["content-gaps", "competitor", "performance"], {
    required_error: "Please select a report type.",
  }),
  settings: z.object({
    includeRecommendations: z.boolean().default(true),
    detailLevel: z.enum(["basic", "standard", "detailed"], {
      required_error: "Please select a detail level.",
    }).default("standard"),
    compareWithCompetitors: z.boolean().default(true),
    includeTrends: z.boolean().default(false),
    exportFormat: z.enum(["pdf", "excel", "html"], {
      required_error: "Please select an export format.",
    }).default("pdf"),
  }),
  scheduling: z.object({
    schedule: z.boolean().default(false),
    frequency: z.enum(["once", "daily", "weekly", "monthly"], {
      required_error: "Please select a frequency.",
    }).default("once"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    recipients: z.array(z.string()).default([]),
  }),
})

type ReportFormValues = z.infer<typeof reportFormSchema>

// Sample projects data
const projects = [
  { id: "1", name: "SEO Content Gap Analysis" },
  { id: "2", name: "Product Launch Content Plan" },
  { id: "3", name: "Blog Content Optimization" },
  { id: "4", name: "Competitor Content Benchmark" },
  { id: "5", name: "Technical Documentation Audit" },
]

// Sample recipients data
const recipients = [
  { id: "user-1", name: "Alex Chen", email: "alex@example.com" },
  { id: "user-2", name: "Sarah Johnson", email: "sarah@example.com" },
  { id: "user-3", name: "Mark Wilson", email: "mark@example.com" },
  { id: "user-4", name: "Taylor Kim", email: "taylor@example.com" },
  { id: "user-5", name: "Jordan Lee", email: "jordan@example.com" },
]

export function ReportForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  
  // Default form values
  const defaultValues: Partial<ReportFormValues> = {
    title: "",
    description: "",
    reportType: "content-gaps",
    settings: {
      includeRecommendations: true,
      detailLevel: "standard",
      compareWithCompetitors: true,
      includeTrends: false,
      exportFormat: "pdf",
    },
    scheduling: {
      schedule: false,
      frequency: "once",
      recipients: [],
    },
  }

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const reportType = form.watch("reportType")
  const isScheduled = form.watch("scheduling.schedule")
  
  // Generate title based on project and report type
  const projectIdValue = form.watch("projectId") 
  const reportTypeValue = form.watch("reportType")
  
  React.useEffect(() => {
    const projectId = form.getValues("projectId")
    const selectedReportType = form.getValues("reportType")
    
    if (projectId && selectedReportType) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        let reportTitle = ""
        switch (selectedReportType) {
          case "content-gaps":
            reportTitle = `Content Gap Analysis - ${project.name}`
            break
          case "competitor":
            reportTitle = `Competitor Analysis - ${project.name}`
            break
          case "performance":
            reportTitle = `Performance Report - ${project.name}`
            break
        }
        
        if (reportTitle) {
          const currentTitle = form.getValues("title")
          // Only override if the user hasn't manually changed it
          if (!currentTitle || currentTitle.startsWith("Content Gap Analysis") || currentTitle.startsWith("Competitor Analysis") || currentTitle.startsWith("Performance Report")) {
            form.setValue("title", reportTitle)
          }
        }
      }
    }
  }, [form, projectIdValue, reportTypeValue])

  function onSubmit(data: ReportFormValues) {
    setSubmitting(true)
    
    // In a real app, this would save to a database
    console.log(data)
    
    // Simulate API delay
    setTimeout(() => {
      toast({
        title: data.scheduling.schedule ? "Report scheduled" : "Report generated",
        description: data.scheduling.schedule 
          ? "Your report has been scheduled and will run as configured." 
          : "Your report has been generated successfully.",
      })
      setSubmitting(false)
      router.push("/dashboard/reports")
    }, 1500)
  }

  const getReportTypeDescription = () => {
    switch (reportType) {
      case "content-gaps":
        return "Analysis of missing content opportunities compared to competitors and search demand."
      case "competitor":
        return "Detailed competitive analysis of content strategy and performance."
      case "performance":
        return "Metrics and insights about your content's performance and engagement."
      default:
        return ""
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              Configure the basic information for your report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a project to generate a report for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="content-gaps">Content Gaps</SelectItem>
                        <SelectItem value="competitor">Competitor Analysis</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {getReportTypeDescription()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter report title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive title for your report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional context about this report&apos;s purpose or scope."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional context about this report&apos;s purpose or scope.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
            <CardDescription>
              Configure the content and format of your report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="settings.detailLevel"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Detail Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="basic" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Basic (High-level summary, faster generation)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="standard" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Standard (Balanced detail and generation time)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="detailed" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Detailed (Comprehensive analysis, longer generation time)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormField
                control={form.control}
                name="settings.includeRecommendations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Recommendations</FormLabel>
                      <FormDescription>
                        Add actionable recommendations based on the analysis.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {reportType === "content-gaps" && (
                <FormField
                  control={form.control}
                  name="settings.compareWithCompetitors"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Compare with Competitors</FormLabel>
                        <FormDescription>
                          Include competitor content gap analysis.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              {reportType === "performance" && (
                <FormField
                  control={form.control}
                  name="settings.includeTrends"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Trends</FormLabel>
                        <FormDescription>
                          Show historical performance trends over time.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="settings.exportFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select export format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="html">HTML Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the format for your exported report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scheduling</CardTitle>
                <CardDescription>
                  Configure report scheduling and distribution.
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="scheduling.schedule"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Schedule Report</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          {isScheduled && (
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduling.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">One Time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often should this report be generated.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduling.startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When to start generating this report.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduling.endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => {
                              const startDate = form.getValues("scheduling.startDate")
                              return startDate ? date < startDate : false
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When to stop generating this report. Leave blank for indefinite.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="scheduling.recipients"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Recipients</FormLabel>
                      <FormDescription>
                        Select who should receive this report.
                      </FormDescription>
                    </div>
                    {recipients.map((recipient) => (
                      <FormField
                        key={recipient.id}
                        control={form.control}
                        name="scheduling.recipients"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={recipient.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(recipient.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, recipient.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== recipient.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {recipient.name} ({recipient.email})
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/reports")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isScheduled
              ? submitting ? "Scheduling..." : "Schedule Report"
              : submitting ? "Generating..." : "Generate Report"
            }
          </Button>
        </div>
      </form>
    </Form>
  )
} 