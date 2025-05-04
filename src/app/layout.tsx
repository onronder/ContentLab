import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SiteHeader } from '@/components/site-header'
import { KeyboardShortcutsProvider } from '@/providers/keyboard-shortcuts-provider'
import { Toaster as SonnerToaster } from 'sonner'
import { registerServiceWorker } from "@/lib/device-features"
import React from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Content Roadmap Tool',
  description: 'Analyze content gaps and create content strategies'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // Register service worker for PWA support
  React.useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="ContentCreate - Content Planning and Analysis Tool" />
        <meta name="theme-color" content="#0077FF" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <KeyboardShortcutsProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <Toaster />
            <SonnerToaster position="top-right" />
          </KeyboardShortcutsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
