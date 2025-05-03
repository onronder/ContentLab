'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/')}>
          Go Home
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    </div>
  )
} 