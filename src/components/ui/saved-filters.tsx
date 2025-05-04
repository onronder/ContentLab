"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterCondition } from "./data-filter"
import { Bookmark, BookmarkPlus, Check, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

export interface SavedFilter {
  id: string
  name: string
  description?: string
  conditions: FilterCondition[]
  isDefault?: boolean
  createdAt: Date
}

interface SavedFiltersProps {
  filters: SavedFilter[]
  currentFilter: FilterCondition[]
  onFilterSelect: (filter: SavedFilter) => void
  onFilterSave: (filter: SavedFilter) => void
  onFilterDelete: (filterId: string) => void
  onFilterUpdate: (filter: SavedFilter) => void
  className?: string
}

export function SavedFilters({
  filters,
  currentFilter,
  onFilterSelect,
  onFilterSave,
  onFilterDelete,
  onFilterUpdate,
  className,
}: SavedFiltersProps) {
  const [newFilterName, setNewFilterName] = React.useState("")
  const [newFilterDescription, setNewFilterDescription] = React.useState("")
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [editingFilter, setEditingFilter] = React.useState<SavedFilter | null>(null)
  
  // Handle saving a new filter
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return
    
    const newFilter: SavedFilter = {
      id: editingFilter?.id || `filter-${Date.now()}`,
      name: newFilterName,
      description: newFilterDescription || undefined,
      conditions: currentFilter,
      isDefault: editingFilter?.isDefault || false,
      createdAt: editingFilter?.createdAt || new Date(),
    }
    
    if (editingFilter) {
      onFilterUpdate(newFilter)
    } else {
      onFilterSave(newFilter)
    }
    
    // Reset the form
    setNewFilterName("")
    setNewFilterDescription("")
    setEditingFilter(null)
    setSaveDialogOpen(false)
  }
  
  // Handle editing a filter
  const handleEditFilter = (filter: SavedFilter) => {
    setEditingFilter(filter)
    setNewFilterName(filter.name)
    setNewFilterDescription(filter.description || "")
    setSaveDialogOpen(true)
  }
  
  // Count the number of conditions in a filter
  const countConditions = (filter: SavedFilter) => {
    return filter.conditions.length
  }
  
  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date instanceof Date ? date : new Date(date))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? "Edit Saved Filter" : "Save Current Filter"}
            </DialogTitle>
            <DialogDescription>
              {editingFilter
                ? "Update this saved filter with a new name and description."
                : "Save your current filter settings for future use."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="filter-name" className="text-sm font-medium">
                Filter Name
              </label>
              <Input
                id="filter-name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="My Custom Filter"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="filter-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                id="filter-description"
                value={newFilterDescription}
                onChange={(e) => setNewFilterDescription(e.target.value)}
                placeholder="Brief description of what this filter does"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveDialogOpen(false)
                setEditingFilter(null)
                setNewFilterName("")
                setNewFilterDescription("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
              {editingFilter ? "Update Filter" : "Save Filter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Saved Filters</h3>
        <Button
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          disabled={currentFilter.length === 0}
        >
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Save Current Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="text-lg font-medium">No Saved Filters</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Save your frequently used filters for quick access. Create a filter and click &quot;Save&quot; to add it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <Card key={filter.id} className={cn(filter.isDefault && "border-primary/30")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium flex items-center">
                      {filter.name}
                      {filter.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs bg-primary/10">
                          Default
                        </Badge>
                      )}
                    </h4>
                    {filter.description && (
                      <p className="text-sm text-muted-foreground">{filter.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {countConditions(filter)} condition{countConditions(filter) !== 1 && "s"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Saved on {formatDate(filter.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => onFilterSelect(filter)}
                    >
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Apply
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditFilter(filter)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const updatedFilter = {
                              ...filter,
                              isDefault: !filter.isDefault,
                            }
                            onFilterUpdate(updatedFilter)
                          }}
                        >
                          {filter.isDefault ? (
                            <>
                              <Check className="h-4 w-4 mr-2 text-muted-foreground" />
                              Remove as Default
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Set as Default
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onFilterDelete(filter.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 