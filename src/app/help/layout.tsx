import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Help Center | Content Roadmap Tool",
  description: "Find answers and learn how to use the platform effectively",
}

export default function HelpLayout({
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