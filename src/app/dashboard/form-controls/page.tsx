"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { FormColorPicker } from "@/components/ui/form-color-picker"
import { FormNumberInput } from "@/components/ui/form-number-input"
import { FormMaskedInput } from "@/components/ui/form-masked-input"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "@/components/ui/color-picker"
import { NumberInput } from "@/components/ui/number-input"
import { MaskedInput } from "@/components/ui/masked-input"

// Define schema for the form
const formSchema = z.object({
  themeColor: z.string().min(4, "Please select a color"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100"),
  price: z.number().min(0, "Price cannot be negative"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  creditCard: z.string().min(16, "Please enter a valid credit card number"),
})

type FormValues = z.infer<typeof formSchema>

export default function FormControlsPage() {
  // Define default values
  const defaultValues: Partial<FormValues> = {
    themeColor: "#3b82f6",
    quantity: 1,
    price: 29.99,
    phoneNumber: "",
    creditCard: "",
  }
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  
  // Handle form submission
  function onSubmit(data: FormValues) {
    toast({
      title: "Form submitted",
      description: (
        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }
  
  // States for individual component demos
  const [colorValue, setColorValue] = React.useState("#6366f1")
  const [numberValue, setNumberValue] = React.useState(10)
  const [phoneValue, setPhoneValue] = React.useState("")
  
  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Custom Form Controls" 
        subheading="Showcase of advanced form input components"
      />
      
      <Tabs defaultValue="form" className="space-y-4">
        <TabsList>
          <TabsTrigger value="form">Form Example</TabsTrigger>
          <TabsTrigger value="components">Individual Components</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Form with Custom Controls</CardTitle>
              <CardDescription>
                This form demonstrates all custom form controls integrated with React Hook Form validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormColorPicker 
                    name="themeColor"
                    label="Theme Color"
                    description="Choose a color for the theme"
                  />
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormNumberInput 
                      name="quantity"
                      label="Quantity"
                      description="Enter the number of items"
                      min={1}
                      max={100}
                      step={1}
                    />
                    
                    <FormNumberInput 
                      name="price"
                      label="Price"
                      description="Enter the price per item"
                      min={0}
                      step={0.01}
                      decimalPlaces={2}
                      formatOptions={{ style: 'currency', currency: 'USD' }}
                    />
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormMaskedInput 
                      name="phoneNumber"
                      label="Phone Number"
                      description="Enter your phone number"
                      mask="(999) 999-9999"
                      placeholder="(123) 456-7890"
                    />
                    
                    <FormMaskedInput 
                      name="creditCard"
                      label="Credit Card"
                      description="Enter your credit card number"
                      mask="9999 9999 9999 9999"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  
                  <Button type="submit" className="mt-8">Submit</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Color Picker</CardTitle>
                <CardDescription>
                  An advanced color selector with preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Default Style:</p>
                  <ColorPicker 
                    value={colorValue} 
                    onChange={setColorValue}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Large Preview:</p>
                  <ColorPicker 
                    value={colorValue} 
                    onChange={setColorValue}
                    previewSize="lg"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Hidden Input:</p>
                  <ColorPicker 
                    value={colorValue} 
                    onChange={setColorValue}
                    showInput={false}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Selected color: {colorValue}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Number Input</CardTitle>
                <CardDescription>
                  Number input with increment/decrement controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Basic:</p>
                  <NumberInput 
                    value={numberValue} 
                    onChange={setNumberValue}
                    min={0}
                    max={100}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">With Decimals:</p>
                  <NumberInput 
                    value={numberValue} 
                    onChange={setNumberValue}
                    min={0}
                    step={0.1}
                    decimalPlaces={1}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Currency Format:</p>
                  <NumberInput 
                    value={numberValue} 
                    onChange={setNumberValue}
                    min={0}
                    step={0.01}
                    formatOptions={{ style: 'currency', currency: 'USD' }}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">No Controls:</p>
                  <NumberInput 
                    value={numberValue} 
                    onChange={setNumberValue}
                    controls={false}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Current value: {numberValue}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Masked Input</CardTitle>
                <CardDescription>
                  Text input with formatting masks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Phone Number:</p>
                  <MaskedInput 
                    value={phoneValue} 
                    onChange={setPhoneValue}
                    mask="(999) 999-9999"
                    placeholder="(123) 456-7890"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Date:</p>
                  <MaskedInput 
                    value={phoneValue} 
                    onChange={setPhoneValue}
                    mask="99/99/9999"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Credit Card:</p>
                  <MaskedInput 
                    value={phoneValue} 
                    onChange={setPhoneValue}
                    mask="9999 9999 9999 9999"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Custom Format:</p>
                  <MaskedInput 
                    value={phoneValue} 
                    onChange={setPhoneValue}
                    mask="aa-99-**"
                    placeholder="AB-12-C3"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Raw value: {phoneValue}
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
} 