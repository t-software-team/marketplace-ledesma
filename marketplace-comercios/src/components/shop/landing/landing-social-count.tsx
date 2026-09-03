'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'

export function SocialCount({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 900
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setCount(Math.round(progress * value))
      if (progress < 1) requestAnimationFrame(tick)
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value])

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-5 text-center text-sm text-foreground/60 sm:px-8"
    >
      <span className="font-heading text-foreground">+{count}</span> {label}
    </motion.p>
  )
}
