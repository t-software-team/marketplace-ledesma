'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

export const TrendAreaChart = dynamic(
  () => import('./trend-area-chart-impl').then((mod) => mod.TrendAreaChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full rounded-lg" />,
  }
)
