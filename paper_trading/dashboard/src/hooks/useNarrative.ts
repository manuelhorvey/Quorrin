import { useQuery, useQueryClient } from '@tanstack/react-query'

interface NarrativeStatus {
  week_start: string
  active: Record<string, unknown> | null
  pending: Record<string, unknown> | null
  stale: boolean
  fetch_error: Record<string, unknown> | null
  has_pending: boolean
  needs_confirmation: boolean
}

async function fetchNarrative(): Promise<NarrativeStatus> {
  const resp = await fetch('/narrative.json')
  if (!resp.ok) throw new Error('Failed to fetch narrative')
  return resp.json()
}

export function useNarrative() {
  return useQuery<NarrativeStatus>({
    queryKey: ['narrative'],
    queryFn: fetchNarrative,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useConfirmNarrative() {
  const queryClient = useQueryClient()
  return async () => {
    const resp = await fetch('/narrative/confirm', { method: 'POST' })
    if (!resp.ok) throw new Error('Failed to confirm narrative')
    await queryClient.invalidateQueries({ queryKey: ['narrative'] })
    return resp.json()
  }
}
