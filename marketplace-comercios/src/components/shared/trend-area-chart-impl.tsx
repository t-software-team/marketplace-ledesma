'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface TrendAreaChartProps {
  data: Record<string, string | number>[]
  dataKey: string
  label: string
  gradientId: string
  height?: number
  /** 'pulse' draws straight segments between points (a heartbeat-monitor
   * read) instead of the default smoothed curve. Opt-in per chart. */
  variant?: 'smooth' | 'pulse'
}

export function TrendAreaChart({
  data,
  dataKey,
  label,
  gradientId,
  height = 160,
  variant = 'smooth',
}: TrendAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          formatter={(value) => [value, label]}
        />
        <Area
          type={variant === 'pulse' ? 'linear' : 'monotone'}
          dataKey={dataKey}
          stroke="var(--color-primary)"
          strokeWidth={variant === 'pulse' ? 2.5 : 2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
