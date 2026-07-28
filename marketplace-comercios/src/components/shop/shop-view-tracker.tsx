'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShopViewTrackerProps {
  shopId: string
}

export function ShopViewTracker({ shopId }: ShopViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const supabase = createClient()
    void supabase.rpc('increment_shop_metric', {
      p_shop_id: shopId,
      p_metric: 'view',
    })
  }, [shopId])

  return null
}
