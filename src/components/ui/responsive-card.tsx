"use client"

import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { motion, useAnimation, PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"

interface ResponsiveCardProps extends Omit<React.ComponentPropsWithoutRef<typeof Card>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  isExpandable?: boolean
  initiallyExpanded?: boolean
  onExpand?: (expanded: boolean) => void
  mobileFullWidth?: boolean
  touchThreshold?: number
  children?: React.ReactNode
}

export function ResponsiveCard({
  title,
  description,
  footer,
  isExpandable = false,
  initiallyExpanded = false,
  onExpand,
  mobileFullWidth = true,
  touchThreshold = 50,
  children,
  className,
  ...props
}: ResponsiveCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  // Track component mounting
  useEffect(() => {
    setHasMounted(true)
    return () => setHasMounted(false)
  }, [])

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    
    // Only add event listeners after component has mounted
    const resizeHandler = () => {
      window.requestAnimationFrame(checkIsMobile)
    }
    
    window.addEventListener("resize", resizeHandler)
    
    return () => {
      window.removeEventListener("resize", resizeHandler)
    }
  }, [])

  // Handle card expansion
  const toggleExpand = () => {
    if (!isExpandable) return
    
    const newExpandedState = !expanded
    setExpanded(newExpandedState)
    
    if (onExpand) {
      onExpand(newExpandedState)
    }
  }

  // Handle touch/drag gestures for mobile
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isExpandable || !isMobile) return
    
    // If user swiped up, expand. If swiped down, collapse
    if (info.offset.y < -touchThreshold && !expanded) {
      setExpanded(true)
      if (onExpand) onExpand(true)
    } else if (info.offset.y > touchThreshold && expanded) {
      setExpanded(false)
      if (onExpand) onExpand(false)
    }
    
    // Reset position
    controls.start({ y: 0, transition: { type: "spring", bounce: 0.2 } })
  }

  // Determine if drag should be enabled
  const shouldEnableDrag = hasMounted && isExpandable && isMobile

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-all duration-300",
        mobileFullWidth && isMobile && "rounded-none border-x-0 w-full",
        expanded && isMobile && "min-h-[70vh] rounded-b-none border-b-0",
        isExpandable && isMobile && "cursor-grab active:cursor-grabbing",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader
          className={cn(
            isExpandable && "cursor-pointer",
            isMobile && isExpandable && "select-none"
          )}
          onClick={isExpandable ? toggleExpand : undefined}
        >
          {title && (
            <CardTitle>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription>
              {description}
            </CardDescription>
          )}
          {isExpandable && isMobile && (
            <div className="absolute top-3 right-3">
              <div className="h-1 w-6 bg-muted-foreground/30 rounded-full" />
            </div>
          )}
        </CardHeader>
      )}
      
      {isMobile && isExpandable && hasMounted ? (
        <motion.div
          drag={shouldEnableDrag ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={cn(
            "overflow-hidden transition-all duration-300",
            !expanded && "max-h-[150px]",
            expanded && "max-h-[calc(100vh-200px)]"
          )}
        >
          <CardContent className={expanded ? "" : "overflow-hidden relative"}>
            {children}
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
            )}
          </CardContent>
        </motion.div>
      ) : (
        <CardContent>
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </Card>
  )
} 