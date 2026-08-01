import Link from 'next/link'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AlertRow {
  label: string
  count: number
  href: string
}

export function DashboardAlerts({ alerts }: { alerts: AlertRow[] }) {
  const visibleAlerts = alerts.filter((alert) => alert.count > 0)

  if (visibleAlerts.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-1 pt-6">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive" aria-hidden />
          <h2 className="text-sm font-medium text-muted-foreground">Requiere atención</h2>
        </div>
        <ul className="divide-y divide-border">
          {visibleAlerts.map((alert) => (
            <li key={alert.label}>
              <Link
                href={alert.href}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
              >
                <span>
                  <strong className="font-mono">{alert.count}</strong> {alert.label}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
