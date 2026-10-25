import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDaySummary } from '../domain/selectors.js'
import { clearedToday, recordDayCleared } from '../lib/streak.js'
import { useTasks } from './contexts.js'
import { useNow } from './useNow.js'

/**
 * Watches for the moment the last task due today gets ticked off.
 *
 * This is the one moment worth making a fuss of. A day's work is remembered
 * largely by how it ended, so the per-task tick stays small and this gets the
 * big reaction — and because it can only happen once a day, it can't wear out
 * the way a reward on every task would.
 *
 * It fires on the change only: opening the app on a day that is already clear
 * is not something that just happened, and a day already celebrated never
 * replays, however many times the app is reopened.
 */
export function useDayCleared() {
  const { tasks, status } = useTasks()
  const now = useNow(60_000)
  const [celebration, setCelebration] = useState(null)
  // null until the first loaded reading, which becomes the baseline.
  const wasCleared = useRef(null)

  const summary = useMemo(() => getDaySummary(tasks, now), [tasks, now])
  const cleared = summary.total > 0 && summary.remaining === 0

  useEffect(() => {
    if (status !== 'ready') return
    if (wasCleared.current === null) {
      wasCleared.current = cleared
      return
    }
    const justCleared = cleared && !wasCleared.current
    wasCleared.current = cleared
    if (!justCleared || clearedToday(now)) return
    setCelebration({ count: summary.completed, streak: recordDayCleared(now) })
  }, [status, cleared, now, summary.completed])

  const dismiss = useCallback(() => setCelebration(null), [])
  return { celebration, dismiss }
}
