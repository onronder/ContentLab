"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { X, Plus, Globe, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const projectSchema = z.object({
  name: z.string().min(3, {
    message: "Project name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  status: z.enum(["draft", "active"], {
    required_error: "Please select a project status.",
  }),
  tags: z.array(z.string()).min(1, {
    message: "Add at least one tag for better organization.",
  }),
  domains: z.array(z.string().url({
    message: "Please enter valid URLs (include http:// or https://)",
  })).min(1, {
    message: "Add at least one domain to analyze.",
  }),
  websiteStructure: z.string().optional(),
  settings: z.object({
    analyzeCompetitors: z.boolean().default(true),
    includeSocialMedia: z.boolean().default(false),
    focusKeywords: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).min(1, {
      message: "Select at least one content type to analyze."
    }),
    analysisDepth: z.enum(["basic", "standard", "deep"]).default("standard"),
    excludeUrls: z.array(z.string()).optional(),
  }),
})

type ProjectFormValues = z.infer<typeof projectSchema>

export function ProjectForm({ project }: { project?: ProjectFormValues }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("details")
  const [submitting, setSubmitting] = React.useState(false)
  const [newTag, setNewTag] = React.useState("")
  const [newDomain, setNewDomain] = React.useState("")
  const [newKeyword, setNewKeyword] = React.useState("")
  const [newExcludeUrl, setNewExcludeUrl] = React.useState("")
  
  // Default form values
  const defaultValues: Partial<ProjectFormValues> = {
    name: "",
    description: "",
    status: "draft",
    tags: [],
    domains: [],
    websiteStructure: "",
    settings: {
      analyzeCompetitors: true,
      includeSocialMedia: false,
      focusKeywords: [],
      contentTypes: ["blog", "product"],
      analysisDepth: "standard",
      excludeUrls: [],
    },
    ...project,
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: "onChange",
  })

  const contentTypeOptions = [
    { label: "Blog Posts", value: "blog" },
    { label: "Product Pages", value: "product" },
    { label: "Category Pages", value: "category" },
    { label: "Landing Pages", value: "landing" },
    { label: "Documentation", value: "docs" },
  ]

  function addTag() {
    if (newTag && !form.getValues().tags.includes(newTag)) {
      form.setValue("tags", [...form.getValues().tags, newTag])
      setNewTag("")
    }
  }

  function removeTag(tag: string) {
    form.setValue(
      "tags",
      form.getValues().tags.filter((t) => t !== tag)
    )
  }

  function addDomain() {
    // Add http:// prefix if missing
    let domain = newDomain
    if (domain && !domain.startsWith("http")) {
      domain = `https://${domain}`
    }
    
    if (domain && !form.getValues().domains.includes(domain)) {
      form.setValue("domains", [...form.getValues().domains, domain])
      setNewDomain("")
    }
  }

  function removeDomain(domain: string) {
    form.setValue(
      "domains",
      form.getValues().domains.filter((d) => d !== domain)
    )
  }

  function addKeyword() {
    if (newKeyword && !form.getValues().settings.focusKeywords?.includes(newKeyword)) {
      form.setValue("settings.focusKeywords", [
        ...(form.getValues().settings.focusKeywords || []),
        newKeyword,
      ])
      setNewKeyword("")
    }
  }

  function removeKeyword(keyword: string) {
    form.setValue(
      "settings.focusKeywords",
      form.getValues().settings.focusKeywords?.filter((k) => k !== keyword) || []
    )
  }

  function addExcludeUrl() {
    // Add http:// prefix if missing
    let url = newExcludeUrl
    if (url && !url.startsWith("http")) {
      url = `https://${url}`
    }
    
    if (url && !form.getValues().settings.excludeUrls?.includes(url)) {
      form.setValue("settings.excludeUrls", [
        ...(form.getValues().settings.excludeUrls || []),
        url,
      ])
      setNewExcludeUrl("")
    }
  }

  function removeExcludeUrl(url: string) {
    form.setValue(
      "settings.excludeUrls",
      form.getValues().settings.excludeUrls?.filter((u) => u !== url) || []
    )
  }

  function onSubmit(data: ProjectFormValues) {
    setSubmitting(true)
    
    // In a real app, this would save to a database
    console.log(data)
    
    // Simulate API delay
    setTimeout(() => {
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      })
      setSubmitting(false)
      router.push("/dashboard/projects")
    }, 1500)
  }

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-3">
        <TabsTrigger value="details">Project Details</TabsTrigger>
        <TabsTrigger value="domains">Domains & Tags</TabsTrigger>
        <TabsTrigger value="settings">Analysis Settings</TabsTrigger>
      </TabsList>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <TabsContent value="details" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Provide basic information about your content analysis project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. SEO Content Analysis 2023" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear name that describes the purpose of this project.
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the goals and scope of this project..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe the purpose and goals of this content analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set as &quot;Draft&quot; to set up without starting analysis, or &quot;Active&quot; to begin analysis immediately.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard/projects")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("domains")}>
                  Next: Domains & Tags
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="domains" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Domains & Tags</CardTitle>
                <CardDescription>
                  Add domains to analyze and tags to categorize your project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="domains"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Domains to Analyze</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <div className="flex-1 flex items-center space-x-2">
                            <div className="relative flex-1">
                              <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter a domain URL (e.g., example.com)"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                className="pl-8"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addDomain()
                                  }
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addDomain}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((domain) => (
                          <Badge
                            key={domain}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5"
                          >
                            <Globe className="h-3 w-3" />
                            {domain}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDomain(domain)}
                              className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Add your website and competitor domains to compare and analyze.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Project Tags</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <div className="flex-1 flex items-center space-x-2">
                            <Input
                              placeholder="Enter tag (e.g., SEO, Content, Blog)"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addTag()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addTag}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {field.value.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="px-3 py-1"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTag(tag)}
                              className="h-4 w-4 p-0 hover:bg-transparent ml-1.5"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Add tags to help organize and filter your projects.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                >
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("settings")}>
                  Next: Analysis Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Settings</CardTitle>
                <CardDescription>
                  Configure how your content will be analyzed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="settings.contentTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Types to Analyze</FormLabel>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {contentTypeOptions.map((option) => (
                          <Badge
                            key={option.value}
                            variant={field.value.includes(option.value) ? "default" : "outline"}
                            className="px-3 py-1.5 cursor-pointer"
                            onClick={() => {
                              const current = field.value || []
                              const updated = current.includes(option.value)
                                ? current.filter((v) => v !== option.value)
                                : [...current, option.value]
                              
                              form.setValue("settings.contentTypes", updated)
                            }}
                          >
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Select the types of content to include in your analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="settings.analysisDepth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Analysis Depth</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select analysis depth" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic (Faster, Less Detail)</SelectItem>
                          <SelectItem value="standard">Standard (Recommended)</SelectItem>
                          <SelectItem value="deep">Deep (Thorough, More Time)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how thoroughly content should be analyzed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="settings.focusKeywords"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Focus Keywords (Optional)</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <div className="flex-1 flex items-center space-x-2">
                            <Input
                              placeholder="Enter focus keyword(s)"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addKeyword()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addKeyword}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {field.value?.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="px-3 py-1"
                          >
                            {keyword}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeKeyword(keyword)}
                              className="h-4 w-4 p-0 hover:bg-transparent ml-1.5"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Add specific keywords you want to focus on in your analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.excludeUrls"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Exclude URLs (Optional)</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <div className="flex-1 flex items-center space-x-2">
                            <Input
                              placeholder="Enter exclude URL(s)"
                              value={newExcludeUrl}
                              onChange={(e) => setNewExcludeUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addExcludeUrl()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addExcludeUrl}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {field.value?.map((url) => (
                          <Badge
                            key={url}
                            variant="outline"
                            className="px-3 py-1"
                          >
                            {url}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExcludeUrl(url)}
                              className="h-4 w-4 p-0 hover:bg-transparent ml-1.5"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Add URLs you want to exclude from your analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="websiteStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Structure</FormLabel>
                      <div className="bg-muted/50 p-3 rounded-md text-sm mb-2">
                        <p className="mb-1">
                          Include the structure of your website to help identify content structure correctly.
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Format: &quot;/path/to/section&quot; followed by &quot;Name of Section&quot; (one per line)
                        </p>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={`/blog\nBlog Posts\n/products\nProduct Pages\n/support\nSupport Articles`}
                          className="font-mono h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the path structure of your site, one per line.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("domains")}
                >
                  Back
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Creating Project..." : "Create Project"}
                </Button>
              </CardFooter>
            </Card>
            
            {!form.formState.isValid && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 mt-4 border border-yellow-200 dark:border-yellow-900/30">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Form validation errors
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc space-y-1 pl-5">
                        {Object.entries(form.formState.errors).map(([key, error]) => (
                          <li key={key}>
                            {key}: {error?.message?.toString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </form>
      </Form>
    </Tabs>
  )
} 