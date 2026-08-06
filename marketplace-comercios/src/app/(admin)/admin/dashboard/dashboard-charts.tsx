'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const chartLoading = () => <Skeleton className="h-[220px] w-full rounded-lg" />

export const ShopsGrowthChart = dynamic(
  () => import('./dashboard-charts-impl').then((mod) => mod.ShopsGrowthChart),
  { ssr: false, loading: chartLoading }
)

export const RevenueByPlanChart = dynamic(
  () => import('./dashboard-charts-impl').then((mod) => mod.RevenueByPlanChart),
  { ssr: false, loading: chartLoading }
)
