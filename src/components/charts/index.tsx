"use client"

import React from 'react'
import { 
  AreaChart as RechartsAreaChart, 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart, 
  PieChart as RechartsPieChart,
  Area, 
  Bar, 
  Line, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

// Theme colors for charts - these will automatically use CSS variables from our theme
const CHART_COLORS = {
  primary: 'var(--chart-primary)',
  secondary: 'var(--chart-secondary)',
  success: 'var(--chart-success)',
  warning: 'var(--chart-warning)',
  danger: 'var(--chart-danger)',
  info: 'var(--chart-info)',
  muted: 'var(--chart-muted)',
}

// Default styling for chart elements
const DEFAULT_PROPS = {
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: 'var(--border)',
  },
  xAxis: {
    tick: { fill: 'var(--muted-foreground)' },
    stroke: 'var(--border)',
  },
  yAxis: {
    tick: { fill: 'var(--muted-foreground)' },
    stroke: 'var(--border)',
  },
}

// Common chart container for all chart types
interface ChartProps {
  children: React.ReactNode
  className?: string
  height?: number | string
  title?: string
  description?: string
}

export function ChartWrapper({ 
  children, 
  className, 
  height = 300,
  title,
  description
}: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {React.Children.only(children) as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Custom tooltip for all charts
interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: any;
  labelFormatter?: (label: string) => React.ReactNode;
}

export function CustomTooltip({ 
  active, 
  payload, 
  label,
  formatter,
  labelFormatter
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-background p-2 shadow-md">
      {labelFormatter ? (
        <p className="text-sm font-medium">{labelFormatter(label ?? '')}</p>
      ) : label ? (
        <p className="text-sm font-medium">{label}</p>
      ) : null}
      <div className="mt-1">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: entry.color }} 
            />
            <span className="text-muted-foreground">{entry.name}: </span>
            <span className="font-medium">
              {formatter 
                ? formatter(entry.value, entry.name, entry, index)
                : entry.value
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Line Chart Component
interface LineChartProps {
  data: Record<string, unknown>[]
  lines: Array<{
    dataKey: string
    name?: string
    color?: keyof typeof CHART_COLORS | string
    strokeWidth?: number
    dot?: boolean | object
    activeDot?: boolean | object
  }>
  xAxisDataKey: string
  yAxisDomain?: [number, number]
  yAxisTickFormatter?: (value: number | string) => string
  tooltipFormatter?: (value: number | string, name?: string, props?: Record<string, unknown>, index?: number) => React.ReactNode
  tooltipLabelFormatter?: (label: string) => React.ReactNode
  className?: string
  height?: number | string
  title?: string
  description?: string
  grid?: boolean
}

export function LineChart({
  data,
  lines,
  xAxisDataKey,
  yAxisDomain,
  yAxisTickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className,
  height,
  title,
  description,
  grid = true,
}: LineChartProps) {
  const config = lines.reduce((acc, curr) => {
    acc[curr.dataKey] = {
      label: curr.name || curr.dataKey,
      theme: {
        light: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
        dark: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
      },
    }
    return acc
  }, {})

  return (
    <ChartWrapper 
      className={className} 
      height={height}
      title={title}
      description={description}
    >
      <ChartContainer config={config}>
        <RechartsLineChart data={data}>
          {grid && <CartesianGrid {...DEFAULT_PROPS.cartesianGrid} />}
          <XAxis 
            dataKey={xAxisDataKey} 
            {...DEFAULT_PROPS.xAxis} 
          />
          <YAxis 
            domain={yAxisDomain || [0, 'auto']} 
            tickFormatter={yAxisTickFormatter}
            {...DEFAULT_PROPS.yAxis}
          />
          <ChartTooltip 
            content={({ active, payload, label }) => (
              <CustomTooltip 
                active={active} 
                payload={payload} 
                label={label}
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
            )}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={`var(--color-${line.dataKey})`}
              strokeWidth={line.strokeWidth || 2}
              dot={line.dot || { r: 3 }}
              activeDot={line.activeDot || { r: 5 }}
              isAnimationActive={true}
            />
          ))}
        </RechartsLineChart>
      </ChartContainer>
    </ChartWrapper>
  )
}

// Bar Chart Component
interface BarChartProps {
  data: Record<string, unknown>[]
  bars: Array<{
    dataKey: string
    name?: string
    color?: keyof typeof CHART_COLORS | string
    stackId?: string
    radius?: number | [number, number, number, number]
  }>
  xAxisDataKey: string
  yAxisDomain?: [number, number]
  yAxisTickFormatter?: (value: number | string) => string
  tooltipFormatter?: (value: number | string, name?: string, props?: Record<string, unknown>, index?: number) => React.ReactNode
  tooltipLabelFormatter?: (label: string) => React.ReactNode
  className?: string
  height?: number | string
  title?: string
  description?: string
  grid?: boolean
  layout?: 'vertical' | 'horizontal'
}

export function BarChart({
  data,
  bars,
  xAxisDataKey,
  yAxisDomain,
  yAxisTickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className,
  height,
  title,
  description,
  grid = true,
  layout = 'horizontal',
}: BarChartProps) {
  const config = bars.reduce((acc, curr) => {
    acc[curr.dataKey] = {
      label: curr.name || curr.dataKey,
      theme: {
        light: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
        dark: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
      },
    }
    return acc
  }, {})

  return (
    <ChartWrapper 
      className={className} 
      height={height}
      title={title}
      description={description}
    >
      <ChartContainer config={config}>
        <RechartsBarChart 
          data={data} 
          layout={layout}
        >
          {grid && <CartesianGrid {...DEFAULT_PROPS.cartesianGrid} />}
          <XAxis 
            dataKey={layout === 'horizontal' ? xAxisDataKey : undefined}
            type={layout === 'horizontal' ? 'category' : 'number'}
            {...DEFAULT_PROPS.xAxis}
          />
          <YAxis 
            domain={yAxisDomain || [0, 'auto']} 
            tickFormatter={yAxisTickFormatter}
            dataKey={layout === 'vertical' ? xAxisDataKey : undefined}
            type={layout === 'vertical' ? 'category' : 'number'}
            {...DEFAULT_PROPS.yAxis}
          />
          <ChartTooltip 
            content={({ active, payload, label }) => (
              <CustomTooltip 
                active={active} 
                payload={payload} 
                label={label}
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
            )}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={`bar-${index}`}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={`var(--color-${bar.dataKey})`}
              stackId={bar.stackId}
              radius={bar.radius || [4, 4, 0, 0]}
              isAnimationActive={true}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    </ChartWrapper>
  )
}

// Area Chart Component
interface AreaChartProps {
  data: Record<string, unknown>[]
  areas: Array<{
    dataKey: string
    name?: string
    color?: keyof typeof CHART_COLORS | string
    stackId?: string
    fillOpacity?: number
    stroke?: string
    strokeWidth?: number
  }>
  xAxisDataKey: string
  yAxisDomain?: [number, number]
  yAxisTickFormatter?: (value: number | string) => string
  tooltipFormatter?: (value: number | string, name?: string, props?: Record<string, unknown>, index?: number) => React.ReactNode
  tooltipLabelFormatter?: (label: string) => React.ReactNode
  className?: string
  height?: number | string
  title?: string
  description?: string
  grid?: boolean
}

export function AreaChart({
  data,
  areas,
  xAxisDataKey,
  yAxisDomain,
  yAxisTickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className,
  height,
  title,
  description,
  grid = true,
}: AreaChartProps) {
  const config = areas.reduce((acc, curr) => {
    acc[curr.dataKey] = {
      label: curr.name || curr.dataKey,
      theme: {
        light: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
        dark: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS.primary,
      },
    }
    return acc
  }, {})

  return (
    <ChartWrapper 
      className={className} 
      height={height}
      title={title}
      description={description}
    >
      <ChartContainer config={config}>
        <RechartsAreaChart data={data}>
          {grid && <CartesianGrid {...DEFAULT_PROPS.cartesianGrid} />}
          <XAxis 
            dataKey={xAxisDataKey} 
            {...DEFAULT_PROPS.xAxis} 
          />
          <YAxis 
            domain={yAxisDomain || [0, 'auto']} 
            tickFormatter={yAxisTickFormatter}
            {...DEFAULT_PROPS.yAxis}
          />
          <ChartTooltip 
            content={({ active, payload, label }) => (
              <CustomTooltip 
                active={active} 
                payload={payload} 
                label={label}
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
            )}
          />
          <Legend />
          {areas.map((area, index) => (
            <Area
              key={`area-${index}`}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              fill={`var(--color-${area.dataKey})`}
              stroke={area.stroke || `var(--color-${area.dataKey})`}
              strokeWidth={area.strokeWidth || 2}
              stackId={area.stackId}
              fillOpacity={area.fillOpacity || 0.6}
              isAnimationActive={true}
            />
          ))}
        </RechartsAreaChart>
      </ChartContainer>
    </ChartWrapper>
  )
}

// Pie Chart Component
interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color?: keyof typeof CHART_COLORS | string
    [key: string]: unknown
  }>
  nameKey?: string
  dataKey?: string
  tooltipFormatter?: (value: number | string, name?: string, props?: Record<string, unknown>, index?: number) => React.ReactNode
  className?: string
  height?: number | string
  title?: string
  description?: string
  innerRadius?: number | string
  outerRadius?: number | string
  paddingAngle?: number
  cornerRadius?: number
  startAngle?: number
  endAngle?: number
  label?: boolean | ((props: Record<string, unknown>) => React.ReactNode)
}

export function PieChart({
  data,
  nameKey = 'name',
  dataKey = 'value',
  tooltipFormatter,
  className,
  height,
  title,
  description,
  innerRadius = 0,
  outerRadius = '80%',
  paddingAngle = 0,
  cornerRadius = 0,
  startAngle = 0,
  endAngle = 360,
  label = true,
}: PieChartProps) {
  // Create a config object for each data point
  const config = data.reduce((acc, curr, index) => {
    const name = curr[nameKey as keyof typeof curr] as string;
    acc[name] = {
      label: name,
      theme: {
        light: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS[Object.keys(CHART_COLORS)[index % Object.keys(CHART_COLORS).length] as keyof typeof CHART_COLORS],
        dark: curr.color && CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          ? CHART_COLORS[curr.color as keyof typeof CHART_COLORS] 
          : curr.color || CHART_COLORS[Object.keys(CHART_COLORS)[index % Object.keys(CHART_COLORS).length] as keyof typeof CHART_COLORS],
      },
    }
    return acc
  }, {})

  return (
    <ChartWrapper 
      className={className} 
      height={height}
      title={title}
      description={description}
    >
      <ChartContainer config={config}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={label !== false}
            label={label !== false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            cornerRadius={cornerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            dataKey={dataKey}
            nameKey={nameKey}
            isAnimationActive={true}
          >
            {data.map((entry, index) => {
              const name = entry[nameKey as keyof typeof entry] as string;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`var(--color-${name})`} 
                />
              )
            })}
          </Pie>
          <ChartTooltip 
            content={({ active, payload }) => (
              <CustomTooltip 
                active={active} 
                payload={payload} 
                label=""
                formatter={tooltipFormatter}
              />
            )}
          />
          <Legend />
        </RechartsPieChart>
      </ChartContainer>
    </ChartWrapper>
  )
} 