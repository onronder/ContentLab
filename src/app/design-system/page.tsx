import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const metadata: Metadata = {
  title: "Design System | Content Roadmap Tool",
  description: "Design system and component documentation",
}

export default function DesignSystemPage() {
  return (
    <div className="container max-w-6xl py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Design System</h1>
        <ThemeToggle />
      </div>
      <p className="text-muted-foreground mt-2 mb-8">
        Documentation and examples of the design system components and styles.
      </p>

      <Tabs defaultValue="colors">
        <TabsList className="mb-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors">
          <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <ColorCard name="Primary" bg="bg-primary" text="text-primary-foreground" />
            <ColorCard name="Secondary" bg="bg-secondary" text="text-secondary-foreground" />
            <ColorCard name="Accent" bg="bg-accent" text="text-accent-foreground" />
            <ColorCard name="Muted" bg="bg-muted" text="text-muted-foreground" />
            <ColorCard name="Destructive" bg="bg-destructive" text="text-destructive-foreground" />
            <ColorCard name="Background" bg="bg-background" text="text-foreground" />
            <ColorCard name="Card" bg="bg-card" text="text-card-foreground" border />
          </div>
          
          <h3 className="text-lg font-semibold mb-4">Chart Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="h-16 rounded-md flex items-center justify-center bg-[hsl(var(--chart-1))] text-white font-medium">
              Chart 1
            </div>
            <div className="h-16 rounded-md flex items-center justify-center bg-[hsl(var(--chart-2))] text-white font-medium">
              Chart 2
            </div>
            <div className="h-16 rounded-md flex items-center justify-center bg-[hsl(var(--chart-3))] text-white font-medium">
              Chart 3
            </div>
            <div className="h-16 rounded-md flex items-center justify-center bg-[hsl(var(--chart-4))] text-white font-medium">
              Chart 4
            </div>
            <div className="h-16 rounded-md flex items-center justify-center bg-[hsl(var(--chart-5))] text-white font-medium">
              Chart 5
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="typography">
          <h2 className="text-xl font-semibold mb-4">Typography</h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Headings</h3>
          <div className="space-y-4 mb-8">
            <div>
              <h1>Heading 1</h1>
              <p className="text-sm text-muted-foreground">text-3xl lg:text-4xl (1.875rem / 2.25rem)</p>
            </div>
            <div>
              <h2>Heading 2</h2>
              <p className="text-sm text-muted-foreground">text-2xl lg:text-3xl (1.5rem / 1.875rem)</p>
            </div>
            <div>
              <h3>Heading 3</h3>
              <p className="text-sm text-muted-foreground">text-xl lg:text-2xl (1.25rem / 1.5rem)</p>
            </div>
            <div>
              <h4>Heading 4</h4>
              <p className="text-sm text-muted-foreground">text-lg lg:text-xl (1.125rem / 1.25rem)</p>
            </div>
            <div>
              <h5>Heading 5</h5>
              <p className="text-sm text-muted-foreground">text-base lg:text-lg (1rem / 1.125rem)</p>
            </div>
            <div>
              <h6>Heading 6</h6>
              <p className="text-sm text-muted-foreground">text-sm lg:text-base (0.875rem / 1rem)</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Body Text</h3>
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-base">Base text (text-base): The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Default paragraph size (1rem / 16px)</p>
            </div>
            <div>
              <p className="text-sm">Small text (text-sm): The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Used for captions, metadata (0.875rem / 14px)</p>
            </div>
            <div>
              <p className="text-xs">Extra small text (text-xs): The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Used for fine print, footnotes (0.75rem / 12px)</p>
            </div>
            <div>
              <p className="text-lg">Large text (text-lg): The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Used for lead paragraphs, introductions (1.125rem / 18px)</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Font Families</h3>
          <div className="space-y-4 mb-8">
            <div>
              <p className="font-sans text-base mb-1">Sans-serif: Geist (Primary font)</p>
              <p className="font-sans">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789</p>
            </div>
            <div>
              <p className="font-mono text-base mb-1">Monospace: Geist Mono</p>
              <p className="font-mono">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="components">
          <h2 className="text-xl font-semibold mb-4">UI Components</h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Buttons</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Button Sizes</h3>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" className="h-9 w-9">
              <span className="h-4 w-4">+</span>
            </Button>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card content and information can go here.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost">Cancel</Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features Overview</CardTitle>
                <CardDescription>Key metrics for the current project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Projects</span>
                    <span className="font-medium">24</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Completed Analyses</span>
                    <span className="font-medium">15</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Content Gaps</span>
                    <span className="font-medium">37</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Details</Button>
              </CardFooter>
            </Card>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Badges</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Form Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="default-input" className="block text-sm font-medium mb-1">
                  Default Input
                </label>
                <Input id="default-input" placeholder="Enter text here..." />
              </div>
              <div>
                <label htmlFor="disabled-input" className="block text-sm font-medium mb-1">
                  Disabled Input
                </label>
                <Input id="disabled-input" placeholder="Cannot edit..." disabled />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="with-label" className="block text-sm font-medium mb-1">
                  Input with Icon
                </label>
                <div className="relative">
                  <Input id="with-label" placeholder="Search..." className="pl-8" />
                  <svg 
                    className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label htmlFor="with-button" className="block text-sm font-medium mb-1">
                  Input with Button
                </label>
                <div className="flex space-x-2">
                  <Input id="with-button" placeholder="Email address..." />
                  <Button>Subscribe</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="spacing">
          <h2 className="text-xl font-semibold mb-4">Spacing System</h2>
          <p className="mb-6">Our spacing system uses a 4px base unit, creating a consistent rhythm throughout the UI.</p>
          
          <div className="space-y-8">
            {[
              { name: '1 (4px)', size: 'var(--spacing-1)' },
              { name: '2 (8px)', size: 'var(--spacing-2)' },
              { name: '3 (12px)', size: 'var(--spacing-3)' },
              { name: '4 (16px)', size: 'var(--spacing-4)' },
              { name: '6 (24px)', size: 'var(--spacing-6)' },
              { name: '8 (32px)', size: 'var(--spacing-8)' },
              { name: '12 (48px)', size: 'var(--spacing-12)' },
              { name: '16 (64px)', size: 'var(--spacing-16)' },
            ].map((space) => (
              <div key={space.name} className="flex items-center">
                <div className="w-24 text-sm">{space.name}</div>
                <div className="bg-primary ml-4" style={{ height: '24px', width: space.size }}></div>
              </div>
            ))}
          </div>
          
          <h3 className="text-lg font-semibold mt-10 mb-4">Shadow System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="font-medium mb-2">Shadow SM</div>
              <div className="text-sm text-muted-foreground">var(--shadow-sm)</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
              <div className="font-medium mb-2">Shadow MD</div>
              <div className="text-sm text-muted-foreground">var(--shadow-md)</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-lg">
              <div className="font-medium mb-2">Shadow LG</div>
              <div className="text-sm text-muted-foreground">var(--shadow-lg)</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-xl">
              <div className="font-medium mb-2">Shadow XL</div>
              <div className="text-sm text-muted-foreground">var(--shadow-xl)</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ColorCard({ name, bg, text, border = false }: { name: string; bg: string; text: string; border?: boolean }) {
  return (
    <div className={`rounded-md overflow-hidden ${border ? 'border' : ''}`}>
      <div className={`${bg} ${text} h-24 flex items-center justify-center p-4`}>
        <span className="font-medium">{name}</span>
      </div>
      <div className="p-2 text-xs bg-muted/50">
        <div className="font-mono text-muted-foreground">{bg}</div>
        <div className="font-mono text-muted-foreground">{text}</div>
      </div>
    </div>
  )
} 