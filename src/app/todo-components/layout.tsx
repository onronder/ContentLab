import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Todo Components | Content Roadmap Tool",
  description: "Showcase of individual Todo components",
}

export default function TodoComponentsLayout({
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