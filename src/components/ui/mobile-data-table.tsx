"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, PanInfo, useAnimation } from "framer-motion"
import { ChevronRight, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DataTableColumn<T> {
  header: string
  accessorKey: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  visibleOnMobile?: boolean
  sortable?: boolean
}

export interface RowAction<T> {
  label: string
  onClick: (item: T) => void
  icon?: React.ReactNode
  destructive?: boolean
  color?: string
}

export interface SwipeAction<T> {
  label: string
  onClick: (item: T) => void
  icon: React.ReactNode
  color: string
  side: "left" | "right"
}

interface MobileDataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  keyAccessor: keyof T
  actions?: RowAction<T>[]
  swipeActions?: SwipeAction<T>[]
  onRowClick?: (item: T) => void
  className?: string
  isLoading?: boolean
  loadingRows?: number
  emptyState?: React.ReactNode
  headerClassName?: string
  rowClassName?: string
  cellClassName?: string
}

export function MobileDataTable<T>({
  data,
  columns,
  keyAccessor,
  actions,
  swipeActions = [],
  onRowClick,
  className,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  headerClassName,
  rowClassName,
  cellClassName,
}: MobileDataTableProps<T>) {
  // Filter columns for mobile view
  const mobileColumns = columns.filter(col => col.visibleOnMobile !== false)
  
  // Generate loading rows when data is being fetched
  const loadingRowsArray = isLoading ? Array(loadingRows).fill(0) : []

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      {/* Header Row - Only visible on larger screens */}
      <div className={cn(
        "hidden md:grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4 p-3 border-b font-medium text-sm",
        headerClassName
      )}>
        {columns.map((column, idx) => (
          <div key={idx} className={cn("truncate", column.className)}>
            {column.header}
          </div>
        ))}
        {actions && actions.length > 0 && <div className="w-10" />}
      </div>
      
      {/* Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          {emptyState || "No data available"}
        </div>
      )}
      
      {/* Data Rows or Loading Rows */}
      <div className="divide-y">
        {isLoading
          ? loadingRowsArray.map((_, idx) => (
              <LoadingRow 
                key={idx} 
                columns={mobileColumns.length || 3} 
                hasActions={!!actions?.length}
              />
            ))
          : data.map(item => (
              <SwipeableRow
                key={String(item[keyAccessor])}
                item={item}
                columns={mobileColumns}
                actions={actions}
                swipeActions={swipeActions}
                onRowClick={onRowClick}
                className={rowClassName}
                cellClassName={cellClassName}
              />
            ))}
      </div>
    </div>
  )
}

// Loading Row Component
function LoadingRow({ 
  columns, 
  hasActions 
}: { 
  columns: number; 
  hasActions: boolean 
}) {
  return (
    <div className={cn(
      "grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4 p-3",
      "md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]",
      hasActions && "md:grid-cols-[repeat(auto-fit,minmax(0,1fr)),auto]"
    )}>
      {Array(columns).fill(0).map((_, idx) => (
        <div key={idx} className="h-6 bg-muted/50 rounded animate-pulse" />
      ))}
      {hasActions && <div className="h-6 w-10 bg-muted/30 rounded animate-pulse" />}
    </div>
  )
}

// Swipeable Row Component
function SwipeableRow<T>({ 
  item, 
  columns, 
  actions, 
  swipeActions,
  onRowClick,
  className,
  cellClassName
}: { 
  item: T; 
  columns: DataTableColumn<T>[];
  actions?: RowAction<T>[];
  swipeActions?: SwipeAction<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  cellClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const leftActions = swipeActions?.filter(a => a.side === "left") || []
  const rightActions = swipeActions?.filter(a => a.side === "right") || []
  const controls = useAnimation()
  const rowRef = useRef<HTMLDivElement>(null)
  
  // Track component mounting
  useEffect(() => {
    setHasMounted(true)
    return () => setHasMounted(false)
  }, [])
  
  // Calculate swipe dimensions
  const actionWidth = 80 // Width of each action button
  const maxLeftSwipe = leftActions.length * actionWidth
  const maxRightSwipe = -rightActions.length * actionWidth
  
  // Determine if drag should be enabled
  const shouldEnableDrag = hasMounted && swipeActions && swipeActions.length > 0
  
  // Handle swipe gesture
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info
    setIsSwiping(false)
    
    // Threshold to trigger action (50% of action width)
    const threshold = actionWidth / 2
    
    if (offset.x > threshold && leftActions.length > 0) {
      // Snapped to left actions
      const snapPosition = Math.min(
        Math.round(offset.x / actionWidth) * actionWidth,
        maxLeftSwipe
      )
      controls.start({ x: snapPosition })
      setIsOpen(true)
    } else if (offset.x < -threshold && rightActions.length > 0) {
      // Snapped to right actions
      const snapPosition = Math.max(
        Math.round(offset.x / actionWidth) * actionWidth,
        maxRightSwipe
      )
      controls.start({ x: snapPosition })
      setIsOpen(true)
    } else {
      // Return to center
      controls.start({ x: 0 })
      setIsOpen(false)
    }
  }
  
  // Handle row click
  const handleRowClick = () => {
    if (isOpen) {
      // If open, close it instead of triggering row click
      controls.start({ x: 0 })
      setIsOpen(false)
    } else if (onRowClick && !isSwiping) {
      // Only trigger if we're not swiping
      onRowClick(item)
    }
  }
  
  return (
    <div className="relative overflow-hidden" ref={rowRef}>
      {/* Left Swipe Actions */}
      {leftActions.length > 0 && hasMounted && (
        <div 
          className="absolute left-0 top-0 bottom-0 flex h-full" 
          style={{ width: maxLeftSwipe }}
        >
          {leftActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick(item)
                controls.start({ x: 0 })
                setIsOpen(false)
              }}
              className="flex items-center justify-center h-full"
              style={{ 
                width: actionWidth, 
                backgroundColor: action.color || 'var(--primary)' 
              }}
            >
              <div className="flex flex-col items-center text-white">
                {action.icon}
                <span className="text-xs mt-1">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Right Swipe Actions */}
      {rightActions.length > 0 && hasMounted && (
        <div 
          className="absolute right-0 top-0 bottom-0 flex h-full" 
          style={{ width: maxRightSwipe * -1 }}
        >
          {rightActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick(item)
                controls.start({ x: 0 })
                setIsOpen(false)
              }}
              className="flex items-center justify-center h-full"
              style={{ 
                width: actionWidth, 
                backgroundColor: action.color || 'var(--destructive)' 
              }}
            >
              <div className="flex flex-col items-center text-white">
                {action.icon}
                <span className="text-xs mt-1">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Main Row Content */}
      <motion.div
        className={cn(
          "bg-background relative touch-pan-y", 
          onRowClick && "cursor-pointer",
          className
        )}
        animate={controls}
        drag={shouldEnableDrag ? "x" : false}
        dragConstraints={{ 
          left: maxRightSwipe, 
          right: maxLeftSwipe 
        }}
        dragElastic={0.1}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        onClick={handleRowClick}
      >
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="flex p-3 items-center">
            <div className="flex-1 space-y-1">
              {/* Primary Column (first visible on mobile) */}
              <div className="font-medium">
                {renderCellContent(item, columns[0])}
              </div>
              
              {/* Secondary Columns (remaining visible on mobile) */}
              {columns.slice(1).map((column, idx) => (
                <div 
                  key={idx} 
                  className={cn("text-sm text-muted-foreground", cellClassName)}
                >
                  <span className="md:hidden font-medium mr-2">
                    {column.header}:
                  </span>
                  {renderCellContent(item, column)}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Actions Menu for Mobile */}
              {actions && actions.length > 0 && (
                <MobileActionMenu actions={actions} item={item} />
              )}
              
              {/* Indicate clickable row */}
              {onRowClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:items-center md:gap-4 md:p-3">
          {columns.map((column, idx) => (
            <div 
              key={idx} 
              className={cn(
                "truncate", 
                idx === 0 && "font-medium", 
                column.className,
                cellClassName
              )}
            >
              {renderCellContent(item, column)}
            </div>
          ))}
          
          {/* Actions for Desktop */}
          {actions && actions.length > 0 && (
            <div className="flex justify-end">
              <DesktopActionMenu actions={actions} item={item} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Helper to render cell content
function renderCellContent<T>(item: T, column: DataTableColumn<T>) {
  if (column.cell) {
    return column.cell(item)
  }
  
  const value = item[column.accessorKey]
  return value !== undefined && value !== null ? String(value) : ""
}

// Mobile Actions Menu Component
function MobileActionMenu<T>({ 
  actions, 
  item 
}: { 
  actions: RowAction<T>[]; 
  item: T 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={() => action.onClick(item)}
            className={cn(
              "flex items-center gap-2",
              action.destructive && "text-destructive focus:text-destructive"
            )}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Desktop Actions Menu Component
function DesktopActionMenu<T>({ 
  actions, 
  item 
}: { 
  actions: RowAction<T>[]; 
  item: T 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={() => action.onClick(item)}
            className={cn(
              "flex items-center gap-2",
              action.destructive && "text-destructive focus:text-destructive"
            )}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 