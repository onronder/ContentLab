"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PlusCircle, X, Filter, ChevronsUpDown } from "lucide-react"

export type FilterValue = string | number | boolean | null | undefined
export type FilterOperator = "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between" | "in" | "isNull" | "isNotNull"

// This represents a single filter condition
export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: FilterValue | FilterValue[]
}

// Define a filter option (available field that can be filtered)
export interface FilterOption {
  id: string
  label: string
  value: string
  supportedOperators: FilterOperator[]
  type: "text" | "number" | "date" | "select" | "boolean"
  options?: { label: string; value: string | number | boolean }[]
}

interface DataFilterProps {
  options: FilterOption[]
  selectedFilters: FilterCondition[]
  onFilterChange: (filters: FilterCondition[]) => void
  className?: string
}

export function DataFilter({
  options,
  selectedFilters,
  onFilterChange,
  className,
}: DataFilterProps) {
  const [open, setOpen] = React.useState(false)

  // Group filters by field
  const filtersByField = selectedFilters.reduce<Record<string, FilterCondition[]>>(
    (acc, filter) => {
      if (!acc[filter.field]) {
        acc[filter.field] = []
      }
      acc[filter.field].push(filter)
      return acc
    },
    {}
  )

  // Get option label by field value
  const getOptionLabel = (value: string) => {
    const option = options.find((option) => option.value === value)
    return option ? option.label : value
  }

  // Handle adding a new filter
  const handleAddFilter = (option: FilterOption) => {
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      field: option.value,
      operator: option.supportedOperators[0],
      value: option.type === "boolean" ? false : null,
    }
    
    onFilterChange([...selectedFilters, newFilter])
  }
  
  // Handle removing a filter
  const handleRemoveFilter = (filterId: string) => {
    onFilterChange(selectedFilters.filter((filter) => filter.id !== filterId))
  }
  
  // Handle removing all filters
  const handleClearFilters = () => {
    onFilterChange([])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-dashed"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {selectedFilters.length > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 rounded-sm font-normal"
              >
                {selectedFilters.length}
              </Badge>
            )}
            <ChevronsUpDown className="ml-auto h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search fields..." />
            <CommandList>
              <CommandEmpty>No field found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      handleAddFilter(option)
                    }}
                  >
                    <span>{option.label}</span>
                    <PlusCircle className="ml-auto h-4 w-4" />
                  </CommandItem>
                ))}
              </CommandGroup>
              {selectedFilters.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Applied Filters">
                    {Object.entries(filtersByField).map(([field, filters]) => (
                      <div key={field} className="px-2 py-1.5">
                        <div className="text-xs font-medium leading-none mb-1">
                          {getOptionLabel(field)}
                        </div>
                        <div className="space-y-1">
                          {filters.map((filter) => (
                            <Button
                              key={filter.id}
                              variant="secondary"
                              size="sm"
                              className="h-7 gap-1 text-xs w-full justify-between"
                              onClick={() => handleRemoveFilter(filter.id)}
                            >
                              <span className="truncate">
                                {filter.operator === "isNull" || filter.operator === "isNotNull" 
                                  ? filter.operator === "isNull" ? "is empty" : "is not empty"
                                  : `${filter.operator}: ${filter.value}`}
                              </span>
                              <X className="h-3 w-3 opacity-50" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <CommandItem
                      className="justify-center text-center text-sm"
                      onSelect={handleClearFilters}
                    >
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display active filters */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="rounded flex items-center gap-1 pr-1"
            >
              <span className="text-xs">
                {getOptionLabel(filter.field)}: 
                {filter.operator === "isNull" ? " is empty" : 
                 filter.operator === "isNotNull" ? " is not empty" : 
                 ` ${filter.operator} ${filter.value}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => handleRemoveFilter(filter.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove filter</span>
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={handleClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 