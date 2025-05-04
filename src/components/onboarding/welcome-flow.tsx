"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, CheckCircle, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface WelcomeFlowProps {
  onComplete: () => void
  onSkip?: () => void
  className?: string
}

export function WelcomeFlow({ onComplete, onSkip, className }: WelcomeFlowProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    company: "",
    goals: [] as string[],
    avatar: null as File | null,
  })
  
  const totalSteps = 4
  const progress = (step / totalSteps) * 100
  
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }
  
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }
  
  const handleCheckboxChange = (goal: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, goals: [...formData.goals, goal] })
    } else {
      setFormData({ ...formData, goals: formData.goals.filter(g => g !== goal) })
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, avatar: e.target.files[0] })
    }
  }
  
  return (
    <div className={cn("max-w-lg mx-auto", className)}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {step === 1 && "Welcome to Content Roadmap!"}
              {step === 2 && "Tell us about yourself"}
              {step === 3 && "What are your goals?"}
              {step === 4 && "You&apos;re all set!"}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </div>
          </div>
          <CardDescription>
            {step === 1 && "Let&apos;s get you started with our platform."}
            {step === 2 && "We&apos;ll use this information to personalize your experience."}
            {step === 3 && "Select your primary goals for using our platform."}
            {step === 4 && "Your account is ready! Here&apos;s what you can do next."}
          </CardDescription>
        </CardHeader>
        
        <Progress value={progress} className="h-1" />
        
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                <Image 
                  src="/images/welcome-illustration.svg" 
                  alt="Welcome to Content Roadmap"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="prose prose-sm">
                <p>
                  Welcome to <strong>Content Roadmap</strong>, your all-in-one platform for content strategy and analysis.
                </p>
                <p>
                  We&apos;ll help you plan, analyze, and optimize your content strategy with powerful tools and insights.
                </p>
                <p>
                  This quick setup will help us personalize your experience. It only takes about 2 minutes to complete.
                </p>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-center pb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {formData.avatar ? (
                      <AvatarImage src={URL.createObjectURL(formData.avatar)} alt="Avatar" />
                    ) : (
                      <AvatarFallback>
                        {formData.name ? formData.name.substring(0, 2).toUpperCase() : "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer">
                    <CheckIcon className="h-4 w-4" />
                    <span className="sr-only">Upload avatar</span>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Input 
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Content Strategist, SEO Manager"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input 
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Your company or organization"
                  />
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply to your content strategy goals:
              </p>
              
              <div className="grid gap-3">
                {[
                  { id: "goal-1", label: "Identify content gaps in my strategy" },
                  { id: "goal-2", label: "Analyze competitor content" },
                  { id: "goal-3", label: "Build topic clusters for better SEO" },
                  { id: "goal-4", label: "Generate content ideas and topics" },
                  { id: "goal-5", label: "Optimize existing content performance" },
                  { id: "goal-6", label: "Create reports for stakeholders" },
                ].map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-2 border rounded-md p-3">
                    <Checkbox 
                      id={goal.id} 
                      checked={formData.goals.includes(goal.label)}
                      onCheckedChange={(checked) => handleCheckboxChange(goal.label, checked as boolean)}
                    />
                    <Label htmlFor={goal.id} className="text-sm font-normal cursor-pointer flex-1">
                      {goal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">Welcome, {formData.name || "User"}!</h3>
                <p className="text-muted-foreground">
                  Your account is fully set up and ready to go.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Here&apos;s what you can do next:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                    <span className="text-sm">Create your first project and start analyzing content gaps</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                    <span className="text-sm">Set up competitor tracking to benchmark your performance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                    <span className="text-sm">Explore the dashboard and customize your workspace</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                    <span className="text-sm">Check out the help center if you need assistance</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={handlePrevious}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          )}
          
          <Button onClick={handleNext}>
            {step < totalSteps ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 