import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Onboarding | Content Roadmap Tool",
  description: "Get started with the platform through interactive onboarding and tutorials",
}

export default function OnboardingLayout({
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