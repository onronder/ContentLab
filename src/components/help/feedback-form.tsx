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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"

// Define the form schema with zod
const feedbackSchema = z.object({
  feedbackType: z.enum(["positive", "negative", "suggestion"], {
    required_error: "Please select a feedback type",
  }),
  rating: z.string().min(1, "Please select a rating"),
  comments: z.string().min(5, "Please provide more details").max(1000),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

interface FeedbackFormProps {
  onSubmitSuccess?: () => void
  className?: string
  compact?: boolean
}

export function FeedbackForm({ 
  onSubmitSuccess,
  className,
  compact = false,
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Initialize the form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: "positive",
      rating: "",
      comments: "",
    },
  })

  // Form submission handler
  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true)
    
    try {
      // In a real app, you would send this data to your API
      console.log("Feedback data:", data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input and will use it to improve our platform.",
      })
      
      // Reset form
      form.reset()
      setShowForm(false)
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      })
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compact feedback buttons (quick thumbs up/down)
  if (compact && !showForm) {
    return (
      <div className={className}>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">Was this helpful?</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 h-8"
              onClick={() => {
                form.setValue("feedbackType", "positive")
                form.setValue("rating", "5")
                form.setValue("comments", "This was helpful!")
                onSubmit(form.getValues())
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Yes</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 h-8"
              onClick={() => setShowForm(true)}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>No</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className={compact ? "text-base" : undefined}>Share Your Feedback</CardTitle>
        {!compact && (
          <CardDescription>
            Help us improve the platform by sharing your experience
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className={compact ? "text-sm" : undefined}>Feedback Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="positive" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          <span className="flex items-center space-x-1">
                            <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                            <span>Positive</span>
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="negative" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          <span className="flex items-center space-x-1">
                            <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                            <span>Negative</span>
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="suggestion" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                            <span>Suggestion</span>
                          </span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className={compact ? "text-sm" : undefined}>Rating</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem key={rating} className="space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              value={rating.toString()}
                              id={`rating-${rating}`}
                              className="peer sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`rating-${rating}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                          >
                            {rating}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-xs">
                    1 = Poor, 5 = Excellent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={compact ? "text-sm" : undefined}>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please share your thoughts, suggestions, or experiences..."
                      rows={compact ? 3 : 4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-2">
              {showForm && compact && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit"
                size={compact ? "sm" : undefined}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      {!compact && (
        <CardFooter className="text-xs text-center text-muted-foreground border-t pt-4">
          <p className="w-full">
            Your feedback helps us create a better experience for all users.
            Thank you for taking the time to share your thoughts!
          </p>
        </CardFooter>
      )}
    </Card>
  )
} 