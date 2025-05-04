"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Dynamically import the DocumentationPage component
const DocumentationPage = dynamic(() => import("../../documentation"), {
  loading: () => <ArticleSkeleton />,
  ssr: false // Disable SSR for better client-side performance
})

// Loading skeleton for article
function ArticleSkeleton() {
  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4">
                <Skeleton className="h-6 w-48 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center border-t pt-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Define the page component with proper Next.js App Router params type
export default function DocumentationArticle({ 
  params
}: { 
  params: { slug: string[] } 
}) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <DocumentationPage params={params} />
    </Suspense>
  )
} 