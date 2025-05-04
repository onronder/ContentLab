"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SampleProjectGeneratorProps {
  onComplete: (projectId: string) => void
  onCancel?: () => void
  className?: string
}

type ProjectTemplate = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  competitors: string[]
  keywords: string[]
  analysisTypes: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
}

// Sample project templates
const projectTemplates: ProjectTemplate[] = [
  {
    id: "ecommerce",
    name: "E-commerce Website",
    description: "A sample e-commerce site selling fashion products with competitors analysis.",
    icon: "🛍️",
    competitors: ["fashionnova.com", "asos.com", "zara.com"],
    keywords: ["women's clothing", "men's fashion", "accessories", "shoes", "dresses"],
    analysisTypes: ["content-gaps", "competitive-analysis", "keyword-opportunities"],
    difficulty: "beginner"
  },
  {
    id: "blog",
    name: "Content Marketing Blog",
    description: "A blog focused on content marketing strategies and best practices.",
    icon: "📝",
    competitors: ["contentmarketinginstitute.com", "buffer.com/resources", "ahrefs.com/blog"],
    keywords: ["content marketing", "blogging tips", "content strategy", "SEO writing", "editorial calendar"],
    analysisTypes: ["topic-clusters", "content-gaps", "keyword-research"],
    difficulty: "intermediate"
  },
  {
    id: "saas",
    name: "SaaS Product Website",
    description: "A software-as-a-service product website with comprehensive competitor research.",
    icon: "💻",
    competitors: ["hubspot.com", "mailchimp.com", "monday.com"],
    keywords: ["project management software", "marketing automation", "CRM system", "team collaboration", "business productivity"],
    analysisTypes: ["competitor-analysis", "content-gaps", "conversion-optimization"],
    difficulty: "advanced"
  }
]

export function SampleProjectGenerator({ onComplete, onCancel, className }: SampleProjectGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(projectTemplates[0].id)
  const [projectName, setProjectName] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isGenerated, setIsGenerated] = useState<boolean>(false)
  const [projectId, setProjectId] = useState<string>("")
  
  const handleGenerate = () => {
    setIsGenerating(true)
    
    // Simulate API call to generate sample project
    setTimeout(() => {
      const newProjectId = `demo-${selectedTemplate}-${Date.now()}`
      setProjectId(newProjectId)
      setIsGenerated(true)
      setIsGenerating(false)
    }, 2500)
  }
  
  const handleComplete = () => {
    if (projectId) {
      onComplete(projectId)
    }
  }
  
  const selectedTemplateData = projectTemplates.find(t => t.id === selectedTemplate)
  
  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>Create a Sample Project</CardTitle>
        <CardDescription>
          Get started quickly with a pre-populated sample project to explore the platform features.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isGenerated ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Sample Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select a Template</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Templates include sample competitors, keywords, and pre-configured analyses
                        to help you get familiar with the platform.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <RadioGroup
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="grid gap-4 md:grid-cols-3"
              >
                {projectTemplates.map((template) => (
                  <div key={template.id} className="relative">
                    <RadioGroupItem
                      value={template.id}
                      id={`template-${template.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`template-${template.id}`}
                      className="flex flex-col gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-xl">{template.icon}</span>
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <div className="mt-2">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          template.difficulty === "beginner" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                          template.difficulty === "intermediate" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                          template.difficulty === "advanced" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
                        )}>
                          {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {selectedTemplateData && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Template Details</h4>
                
                <div className="text-xs text-muted-foreground space-y-2">
                  <div>
                    <strong>Competitors:</strong>{" "}
                    {selectedTemplateData.competitors.join(", ")}
                  </div>
                  
                  <div>
                    <strong>Keywords:</strong>{" "}
                    {selectedTemplateData.keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="inline-flex m-0.5 px-2 py-0.5 bg-muted rounded-full text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  
                  <div>
                    <strong>Analysis Types:</strong>{" "}
                    {selectedTemplateData.analysisTypes.join(", ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium">Sample Project Created!</h3>
              <p className="text-muted-foreground">
                Your sample project &quot;{projectName || selectedTemplateData?.name}&quot; has been created and populated with sample data.
              </p>
            </div>
            
            <div className="bg-muted rounded-lg p-4 w-full max-w-sm mt-2">
              <h4 className="font-medium mb-2">What&apos;s included:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                  <span>Pre-populated competitor websites</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                  <span>Sample keyword data and content metrics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                  <span>Demo analysis results ready to explore</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                  <span>Tutorial annotations to guide you through each feature</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!isGenerated ? (
          <>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Sample Project"}
            </Button>
          </>
        ) : (
          <Button 
            className="w-full"
            onClick={handleComplete}
          >
            Go to Project Dashboard
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 