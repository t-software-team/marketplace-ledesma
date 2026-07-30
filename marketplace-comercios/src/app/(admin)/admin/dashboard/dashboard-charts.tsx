'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CHART_COLOR = 'var(--color-primary)'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ShopsGrowthChart({ data }: { data: { date: string; comercios: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="shopsGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
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
          width={28}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          labelFormatter={(label) => `Día ${label}`}
          formatter={(value) => [value, 'Nuevos comercios']}
        />
        <Area
          type="monotone"
          dataKey="comercios"
          stroke={CHART_COLOR}
          strokeWidth={2}
          fill="url(#shopsGrowth)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RevenueByPlanChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Todavía no hay ingresos registrados.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(value: number) => `$${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          formatter={(value) => [formatMoney(Number(value)), 'Ingresos']}
        />
        <Bar dataKey="revenue" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
