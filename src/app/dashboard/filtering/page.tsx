"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DataFilter, FilterCondition, FilterOption } from "@/components/ui/data-filter"
import { FilterBuilder } from "@/components/ui/filter-builder"
import { SavedFilter, SavedFilters } from "@/components/ui/saved-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/analysis/empty-state"
import { SlidersHorizontal, Search, FileText, Filter as FilterIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function FilteringPage() {
  // Define filter options (in a real app, these would come from an API)
  const filterOptions: FilterOption[] = [
    {
      id: "title",
      label: "Title",
      value: "title",
      supportedOperators: ["equals", "contains", "startsWith", "endsWith", "isNull", "isNotNull"],
      type: "text",
    },
    {
      id: "description",
      label: "Description", 
      value: "description",
      supportedOperators: ["equals", "contains", "startsWith", "endsWith", "isNull", "isNotNull"],
      type: "text",
    },
    {
      id: "status",
      label: "Status",
      value: "status",
      supportedOperators: ["equals", "in", "isNull", "isNotNull"],
      type: "select",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      id: "category",
      label: "Category",
      value: "category",
      supportedOperators: ["equals", "in", "isNull", "isNotNull"],
      type: "select",
      options: [
        { label: "Blog Post", value: "blog" },
        { label: "Tutorial", value: "tutorial" },
        { label: "Case Study", value: "case-study" },
        { label: "White Paper", value: "white-paper" },
      ],
    },
    {
      id: "wordCount",
      label: "Word Count",
      value: "wordCount",
      supportedOperators: ["equals", "greaterThan", "lessThan", "between"],
      type: "number",
    },
    {
      id: "publishDate",
      label: "Publish Date",
      value: "publishDate",
      supportedOperators: ["equals", "greaterThan", "lessThan", "between"],
      type: "date",
    },
    {
      id: "isFeatured",
      label: "Is Featured",
      value: "isFeatured",
      supportedOperators: ["equals"],
      type: "boolean",
    },
  ]
  
  // State for selected filters
  const [selectedFilters, setSelectedFilters] = React.useState<FilterCondition[]>([])
  
  // State for saved filters
  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>([])
  
  // State for content type (to demonstrate filtering with different content types)
  const [contentType, setContentType] = React.useState<string>("all")
  
  // Handle saving a filter
  const handleSaveFilter = (filter: SavedFilter) => {
    setSavedFilters([...savedFilters, filter])
  }
  
  // Handle deleting a filter
  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(savedFilters.filter((filter) => filter.id !== filterId))
  }
  
  // Handle updating a filter
  const handleUpdateFilter = (updatedFilter: SavedFilter) => {
    setSavedFilters(
      savedFilters.map((filter) => {
        if (filter.id === updatedFilter.id) {
          return updatedFilter
        }
        
        // If the updated filter is now the default, remove default from others
        if (updatedFilter.isDefault && filter.isDefault && filter.id !== updatedFilter.id) {
          return { ...filter, isDefault: false }
        }
        
        return filter
      })
    )
  }
  
  // Handle applying a saved filter
  const handleApplySavedFilter = (filter: SavedFilter) => {
    setSelectedFilters(filter.conditions)
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Advanced Filtering"
        subheading="Create, save, and apply complex filters to your content."
      />
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Content Type:</p>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="tutorial">Tutorials</SelectItem>
              <SelectItem value="case-study">Case Studies</SelectItem>
              <SelectItem value="white-paper">White Papers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DataFilter 
          options={filterOptions} 
          selectedFilters={selectedFilters} 
          onFilterChange={setSelectedFilters}
        />
      </div>
      
      <Tabs defaultValue="results">
        <TabsList className="mb-4">
          <TabsTrigger value="results">
            <Search className="h-4 w-4 mr-2" />
            Filter Results
          </TabsTrigger>
          <TabsTrigger value="builder">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter Builder
          </TabsTrigger>
          <TabsTrigger value="saved">
            <FileText className="h-4 w-4 mr-2" />
            Saved Filters
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Filtered Content</CardTitle>
              <CardDescription>
                Results matching your filter criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FilterIcon className="h-10 w-10 text-muted-foreground" />}
                title="No Content Matches Your Filters"
                description={
                  selectedFilters.length > 0
                    ? "Try adjusting your filter criteria to see more results."
                    : "Add filters to narrow down the content."
                }
                action={
                  selectedFilters.length > 0 ? (
                    <Button variant="outline" onClick={() => setSelectedFilters([])}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => document.getElementById("filter-builder-tab")?.click()}>
                      Create Filter
                    </Button>
                  )
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="builder" id="filter-builder-tab">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <FilterBuilder
                options={filterOptions}
                filters={selectedFilters}
                onChange={setSelectedFilters}
                onSave={() => document.getElementById("saved-filters-tab")?.click()}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Filter Preview</CardTitle>
                <CardDescription>
                  This is how your filter will appear.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFilters.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <FilterIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Use the filter builder to create a filter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <DataFilter 
                      options={filterOptions} 
                      selectedFilters={selectedFilters} 
                      onFilterChange={setSelectedFilters}
                      className="mb-4"
                    />
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Current Filter:</h4>
                      {selectedFilters.map((filter, index) => {
                        const option = filterOptions.find(o => o.value === filter.field)
                        return (
                          <div key={filter.id} className="text-sm">
                            {index > 0 && <span className="text-muted-foreground">AND </span>}
                            <span className="font-medium">{option?.label || filter.field}</span>
                            <span className="text-muted-foreground">{" "}
                              {filter.operator === "isNull" ? "is empty" :
                               filter.operator === "isNotNull" ? "is not empty" :
                               `${filter.operator} ${filter.value}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" id="saved-filters-tab">
          <SavedFilters
            filters={savedFilters}
            currentFilter={selectedFilters}
            onFilterSelect={handleApplySavedFilter}
            onFilterSave={handleSaveFilter}
            onFilterDelete={handleDeleteFilter}
            onFilterUpdate={handleUpdateFilter}
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
} 