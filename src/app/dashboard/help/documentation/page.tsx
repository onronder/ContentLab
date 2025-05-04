"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Dynamically import the DocumentationPage component
const DocumentationPage = dynamic(() => import("../documentation"), {
  loading: () => <DocumentationSkeleton />,
  ssr: false // Disable SSR for better client-side performance
})

// Loading skeleton for documentation
function DocumentationSkeleton() {
  return (
    <div className="container py-10 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        
        <Skeleton className="h-10 w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Documentation() {
  return (
    <Suspense fallback={<DocumentationSkeleton />}>
      <DocumentationPage />
    </Suspense>
  )
} 