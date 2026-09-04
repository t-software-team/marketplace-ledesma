'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const CHART_COLOR = 'var(--color-primary)'

export function GymCheckinHoursChart({ data }: { data: { hour: number; count: number }[] }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Todavía no hay ingresos registrados en este período.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="hour"
          tickFormatter={(value: number) => `${String(value).padStart(2, '0')}h`}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          formatter={(value, _name, item) => [
            `${value} ingresos a las ${String(item.payload.hour).padStart(2, '0')}h`,
            '',
          ]}
        />
        <Bar dataKey="count" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
