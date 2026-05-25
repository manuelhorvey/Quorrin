import { useQuery } from '@tanstack/react-query'
import { WeeklyReviewSchema } from '../lib/schemas'
import type { z } from 'zod'

export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>

async function fetchWeeklyReview(): Promise<WeeklyReview> {
  const resp = await fetch('/weekly-review.json')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  const parsed = WeeklyReviewSchema.safeParse(json)
  if (!parsed.success) {
    console.error('[WeeklyReview] validation failed:', parsed.error.issues)
    throw new Error('Invalid weekly review data from server')
  }
  return parsed.data
}

export function useWeeklyReview() {
  return useQuery<WeeklyReview>({
    queryKey: ['weeklyReview'],
    queryFn: fetchWeeklyReview,
    refetchInterval: 120_000,
    staleTime: 60_000,
  })
}

export async function acknowledgeWeeklyReview(): Promise<void> {
  const resp = await fetch('/weekly-review/acknowledge', { method: 'POST' })
  if (!resp.ok) throw new Error('Failed to acknowledge weekly review')
}
