import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'qf_last_review_v1'

export interface LastReviewControls {
  show: boolean
  dismiss: () => void
  snooze: () => void
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

export function useLastReview(): LastReviewControls {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY)
    if (!last || daysSince(last) >= 7) {
      setShow(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setShow(false)
  }, [])

  const snooze = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setShow(false)
  }, [])

  return { show, dismiss, snooze }
}
