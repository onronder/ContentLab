import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart2, Users, FileText, Search, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12 md:py-20">
      <div className="container flex flex-col items-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Plan, Create, and Optimize Your Content Strategy
        </h1>
        <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
          Identify content gaps, analyze competitor strategies, and create a data-driven
          content roadmap that drives results.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Go to Dashboard <BarChart2 className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>

      <div className="container grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Content Gap Analysis</h3>
          <p className="text-muted-foreground">
            Discover untapped content opportunities your audience is searching for.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Competitor Insights</h3>
          <p className="text-muted-foreground">
            Analyze what&apos;s working for competitors and identify your edge.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center lg:col-span-1">
          <div className="rounded-full bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Strategic Roadmaps</h3>
          <p className="text-muted-foreground">
            Build prioritized content plans aligned with your business goals.
          </p>
        </div>
      </div>

      <div className="w-full bg-muted py-12">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to transform your content strategy?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Join thousands of marketers and content creators using our platform.
            </p>
          </div>
          <Button asChild size="lg" className="mt-4 md:mt-0">
            <Link href="/signup">
              Create Account <Users className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


