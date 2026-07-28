interface EmptyStateProps {
  message: string
  action?: React.ReactNode
  illustration?: React.ReactNode
}

export function EmptyState({ message, action, illustration }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      {illustration && <div className="mb-3">{illustration}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
