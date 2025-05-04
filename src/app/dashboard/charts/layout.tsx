import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chart Showcase | Content Roadmap Tool",
  description: "Showcase of chart components with theming",
}

export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
} 