'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * True while the page is scrolling down past `threshold`; false near the top
 * or while scrolling up. Ignores sub-pixel jitter smaller than 4px so it
 * doesn't flicker on trackpad/momentum scroll.
 */
export function useHideOnScrollDown(threshold = 8) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    function handleScroll() {
      const y = window.scrollY
      const diff = y - lastY.current

      if (y < threshold) {
        setHidden(false)
      } else if (Math.abs(diff) > 4) {
        setHidden(diff > 0)
      }
      lastY.current = y
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return hidden
}
