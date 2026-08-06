import { getOpenStatus } from '@/lib/shops/business-hours'
import { cn } from '@/lib/utils'

export function OpenNowBadge({ businessHours }: { businessHours: unknown }) {
  const status = getOpenStatus(businessHours)
  if (!status) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        status.isOpen ? 'bg-success/15 text-success-foreground' : 'bg-muted text-muted-foreground'
      )}
    >
      {status.isOpen && <span className="size-1.5 rounded-full bg-success" aria-hidden />}
      {status.label}
    </span>
  )
}
