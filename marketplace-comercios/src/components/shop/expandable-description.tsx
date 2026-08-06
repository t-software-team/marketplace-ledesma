'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ExpandableDescriptionProps {
  html: string
}

export function ExpandableDescription({ html }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  function checkClamped(node: HTMLDivElement | null) {
    contentRef.current = node
    if (node) setIsClamped(node.scrollHeight > node.clientHeight + 1)
  }

  return (
    <div className="mt-4">
      <div
        ref={checkClamped}
        className={cn(
          'prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline',
          !expanded && 'line-clamp-3'
        )}
        // shop.description is sanitized server-side (sanitizeRichText) before it's ever
        // persisted, so it's safe to render here without re-sanitizing on every request.
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isClamped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm font-medium text-primary hover:underline"
        >
          Ver más
        </button>
      )}
    </div>
  )
}
