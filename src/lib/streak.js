import { addDays } from './dates.js'

/**
 * How many days in a row the user has finished everything due that day.
 *
 * A streak is worth tracking because people work noticeably harder to avoid
 * breaking one than to start one — the pull is loss, not gain. It is only ever
 * shown at the moment a day is cleared, never as a nagging counter, so a
 * missed day costs a number quietly rather than scolding anyone.
 *
 * Stored as { date: 'YYYY-MM-DD', count }, where `date` is the last day cleared.
 */
const KEY = 'tickler.streak'

function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return stored && typeof stored.count === 'number' ? stored : null
  } catch {
    return null
  }
}

/** True once today has been celebrated, so re-opening the app doesn't replay it. */
export function clearedToday(now = new Date()) {
  return read()?.date === dayKey(now)
}

/**
 * The run of days cleared, counting today or yesterday as still live. Anything
 * older means a day was missed, so the run is over and this reads 0.
 */
export function currentStreak(now = new Date()) {
  const stored = read()
  if (!stored) return 0
  return stored.date === dayKey(now) || stored.date === dayKey(addDays(now, -1)) ? stored.count : 0
}

/**
 * Records today as cleared and returns the streak length. Clearing two days
 * running continues the streak; a missed day starts again at 1.
 */
export function recordDayCleared(now = new Date()) {
  const stored = read()
  const today = dayKey(now)
  if (stored?.date === today) return stored.count

  const count = stored?.date === dayKey(addDays(now, -1)) ? stored.count + 1 : 1
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: today, count }))
  } catch {
    // The streak is a nicety; losing it doesn't break anything.
  }
  return count
}
