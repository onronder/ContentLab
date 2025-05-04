"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Plus, Trash2, Filter, Save } from "lucide-react"
import { FilterCondition, FilterOption, FilterOperator, FilterValue } from "./data-filter"

interface FilterBuilderProps {
  options: FilterOption[]
  filters: FilterCondition[]
  onChange: (filters: FilterCondition[]) => void
  className?: string
  maxFilters?: number
  onSave?: () => void
  onClear?: () => void
}

export function FilterBuilder({
  options,
  filters,
  onChange,
  className,
  maxFilters = 10,
  onSave,
  onClear
}: FilterBuilderProps) {
  // Create a unique ID for a new filter
  const createFilterId = () => `filter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  // Get supported operators for a specific field
  const getSupportedOperators = (field: string) => {
    const option = options.find((option) => option.value === field)
    return option ? option.supportedOperators : []
  }
  
  // Get field type
  const getFieldType = (field: string) => {
    const option = options.find((option) => option.value === field)
    return option ? option.type : "text"
  }
  
  // Get field options for select fields
  const getFieldOptions = (field: string) => {
    const option = options.find((option) => option.value === field)
    return option?.options || []
  }
  
  // Handle adding a new filter
  const handleAddFilter = () => {
    if (filters.length >= maxFilters) return
    
    // Use the first available option if there are options
    if (options.length === 0) return
    
    const firstOption = options[0]
    const newFilter: FilterCondition = {
      id: createFilterId(),
      field: firstOption.value,
      operator: firstOption.supportedOperators[0],
      value: firstOption.type === "boolean" ? false : "",
    }
    
    onChange([...filters, newFilter])
  }
  
  // Handle removing a filter
  const handleRemoveFilter = (filterId: string) => {
    onChange(filters.filter((filter) => filter.id !== filterId))
  }
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    onChange([])
    if (onClear) onClear()
  }
  
  // Handle field change
  const handleFieldChange = (filterId: string, field: string) => {
    const option = options.find((option) => option.value === field)
    if (!option) return
    
    onChange(
      filters.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            field,
            operator: option.supportedOperators[0],
            value: option.type === "boolean" ? false : "",
          }
        }
        return filter
      })
    )
  }
  
  // Handle operator change
  const handleOperatorChange = (filterId: string, operator: FilterOperator) => {
    onChange(
      filters.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            operator,
            // Reset value for some operators
            value: operator === "isNull" || operator === "isNotNull" ? null : filter.value,
          }
        }
        return filter
      })
    )
  }
  
  // Handle value change
  const handleValueChange = (filterId: string, value: FilterValue) => {
    onChange(
      filters.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            value,
          }
        }
        return filter
      })
    )
  }

  // Check if we have any options
  const hasOptions = options.length > 0
  
  // Render no options state
  if (!hasOptions) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Advanced Filtering</CardTitle>
          <CardDescription>
            Define custom filter conditions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Filter className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Filter Options Available</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 text-center max-w-xs">
            No filterable fields have been defined for this content type.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Advanced Filtering</CardTitle>
        <CardDescription>
          Combine multiple conditions to filter your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-muted/20 rounded-lg border border-dashed border-muted">
            <Filter className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Add filter conditions to create a custom filter for your data.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={handleAddFilter}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Filter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, index) => {
              // Get the field type and options
              const fieldType = getFieldType(filter.field)
              const fieldOptions = getFieldOptions(filter.field)
              const operators = getSupportedOperators(filter.field)
              
              // Determine if we need to show the value input
              const hideValueInput = filter.operator === "isNull" || filter.operator === "isNotNull"
              
              return (
                <div 
                  key={filter.id} 
                  className="grid grid-cols-12 gap-2 p-3 rounded-md border bg-card"
                >
                  {/* Condition connector */}
                  {index > 0 && (
                    <div className="col-span-12 -mt-5 mb-1 flex justify-center items-center">
                      <Badge variant="outline" className="text-xs font-normal">
                        AND
                      </Badge>
                    </div>
                  )}
                  
                  {/* Field selector */}
                  <div className="col-span-4">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => handleFieldChange(filter.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Operator selector */}
                  <div className="col-span-3">
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => handleOperatorChange(filter.id, value as FilterOperator)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Value input */}
                  <div className="col-span-4">
                    {!hideValueInput && (
                      <>
                        {fieldType === "select" ? (
                          <Select
                            value={filter.value as string}
                            onValueChange={(value) => handleValueChange(filter.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map((option) => (
                                <SelectItem 
                                  key={option.value.toString()}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fieldType === "boolean" ? (
                          <Select
                            value={(filter.value as boolean).toString()}
                            onValueChange={(value) => handleValueChange(filter.id, value === "true")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={filter.value as string || ""}
                            onChange={(e) => handleValueChange(filter.id, e.target.value)}
                            placeholder="Value"
                            type={fieldType === "number" ? "number" : "text"}
                          />
                        )}
                      </>
                    )}
                    {hideValueInput && (
                      <div className="h-9 flex items-center text-sm text-muted-foreground italic">
                        No value needed
                      </div>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Remove filter</span>
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {/* Add another filter button */}
            {filters.length < maxFilters && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleAddFilter}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Filter
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between border-t px-6 py-4">
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          disabled={filters.length === 0}
        >
          Clear Filters
        </Button>
        <Button
          variant="default"
          onClick={onSave}
          disabled={filters.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  )
} 