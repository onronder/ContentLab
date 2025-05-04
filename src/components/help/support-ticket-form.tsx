"use client"

import * as React from "react"
import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { PaperclipIcon, SendIcon, Loader2, X } from "lucide-react"

// Define the form schema with zod
const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  priority: z.string().default("medium"),
  email: z.string().email("Please enter a valid email address"),
  attachments: z.array(z.instanceof(File)).optional(),
  receiveUpdates: z.boolean().default(true),
})

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>

const priorityOptions = [
  { value: "low", label: "Low - General question or feedback" },
  { value: "medium", label: "Medium - Issue affecting some functionality" },
  { value: "high", label: "High - Significant issue with workarounds" },
  { value: "critical", label: "Critical - System unusable or data loss" },
]

const categoryOptions = [
  "Account Access",
  "Billing & Subscription",
  "Technical Issue",
  "Feature Request",
  "Data Analysis",
  "Report Generation",
  "API Integration",
  "Other",
]

interface SupportTicketFormProps {
  defaultValues?: Partial<SupportTicketFormValues>
  onSubmitSuccess?: () => void
  className?: string
}

export function SupportTicketForm({ 
  defaultValues, 
  onSubmitSuccess,
  className,
}: SupportTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  // Initialize the form
  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: defaultValues?.subject || "",
      category: defaultValues?.category || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "medium",
      email: defaultValues?.email || "",
      attachments: defaultValues?.attachments || [],
      receiveUpdates: defaultValues?.receiveUpdates !== undefined ? defaultValues.receiveUpdates : true,
    },
  })

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
      // Update form value
      form.setValue("attachments", [...files, ...newFiles])
    }
  }

  // Remove a file
  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    form.setValue("attachments", newFiles)
  }

  // Form submission handler
  const onSubmit = async (data: SupportTicketFormValues) => {
    setIsSubmitting(true)
    
    try {
      // In a real app, you would send this data to your API
      console.log("Support ticket data:", data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible.",
      })
      
      // Reset form
      form.reset()
      setFiles([])
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      toast({
        title: "Failed to submit ticket",
        description: "Please try again later or contact us directly.",
        variant: "destructive",
      })
      console.error("Error submitting support ticket:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Submit Support Ticket</CardTitle>
        <CardDescription>
          Fill out the form below and our support team will get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your@email.com" 
                        {...field}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief description of your issue" 
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any error messages, steps to reproduce, and what you&apos;ve tried so far.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Please select the appropriate priority level for your issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File attachments */}
            <div>
              <FormLabel htmlFor="attachments">Attachments (Optional)</FormLabel>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachments")?.click()}
                  className="flex items-center gap-2"
                >
                  <PaperclipIcon className="w-4 h-4" />
                  <span>Attach Files</span>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Max 3 files, 5MB each (.pdf, .png, .jpg, .jpeg)
                </span>
              </div>
              
              {/* Display attached files */}
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <PaperclipIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <span className="sr-only">Remove file</span>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="receiveUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Receive Updates</FormLabel>
                    <FormDescription>
                      Receive email notifications about updates to your support ticket.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="min-w-24"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
        <p>
          For urgent issues, please contact us directly at{' '}
          <a href="mailto:support@contentcreate.com" className="text-primary hover:underline">
            support@contentcreate.com
          </a>
        </p>
      </CardFooter>
    </Card>
  )
} 