'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Soft-refreshes the current route on an interval so server-rendered data
// (messages, SLA countdown, stages) stays live without a full reload. Pauses
// while the tab is hidden and refreshes once when it becomes visible again.
export function LiveRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      router.refresh()
    }
    const timer = setInterval(tick, intervalMs)
    const onVisible = () => {
      if (!document.hidden) router.refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router, intervalMs])

  return null
}
