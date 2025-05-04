"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

// Define the schema for analysis configuration form
const analysisFormSchema = z.object({
  projectId: z.string({
    required_error: "Please select a project to analyze.",
  }),
  analysisType: z.enum(["content-gaps", "topic-clusters", "comprehensive"], {
    required_error: "Please select an analysis type.",
  }),
  settings: z.object({
    includeCompetitorData: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true),
    analysisDepth: z.enum(["basic", "standard", "deep"], {
      required_error: "Please select an analysis depth.",
    }).default("standard"),
  }),
})

type AnalysisFormValues = z.infer<typeof analysisFormSchema>

export function AnalysisForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  
  // Default form values
  const defaultValues: Partial<AnalysisFormValues> = {
    analysisType: "comprehensive",
    settings: {
      includeCompetitorData: true,
      includeRecommendations: true,
      analysisDepth: "standard",
    },
  }

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: AnalysisFormValues) {
    setSubmitting(true)
    
    // In a real app, this would make an API call to start the analysis
    console.log(data)
    
    // Simulate API delay
    setTimeout(() => {
      toast({
        title: "Analysis started",
        description: "Your content analysis has been queued and will begin processing shortly.",
      })
      setSubmitting(false)
      router.push("/dashboard/analysis")
    }, 1500)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
            <CardDescription>
              Configure your content analysis parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <SelectItem value="project1">Project 1</SelectItem>
                      <SelectItem value="project2">Project 2</SelectItem>
                      <SelectItem value="project3">Project 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the project you want to analyze.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="analysisType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Analysis Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select analysis type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="content-gaps">Content Gaps Analysis</SelectItem>
                      <SelectItem value="topic-clusters">Topic Clusters Analysis</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of content analysis to run.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="settings.analysisDepth"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Analysis Depth</FormLabel>
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
                          Basic (Quick analysis with key metrics)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="standard" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Standard (Balanced depth and processing time)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="deep" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Deep (Comprehensive analysis, longer processing time)
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
                name="settings.includeCompetitorData"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Competitor Data</FormLabel>
                      <FormDescription>
                        Compare your content with competitor websites.
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
              
              <FormField
                control={form.control}
                name="settings.includeRecommendations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Recommendations</FormLabel>
                      <FormDescription>
                        Generate actionable recommendations based on the analysis.
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
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/analysis")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Starting Analysis..." : "Start Analysis"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 