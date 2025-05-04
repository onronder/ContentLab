import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mobile Optimization Demo - Content Roadmap Tool",
  description: "Explore mobile-optimized components with responsive designs and touch interactions",
}

export default function MobileOptimizedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 