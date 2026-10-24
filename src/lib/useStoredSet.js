import { useCallback, useMemo, useState } from 'react'

/** Keys for small per-device sets. */
export const READ_REMINDERS_KEY = 'tickler.readReminders'

function readSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? '[]'))
  } catch {
    return new Set()
  }
}

/** A small set of strings remembered in localStorage (e.g. dismissed suggestions, read reminders). */
export function useStoredSet(key, limit = 200) {
  const [values, setValues] = useState(() => readSet(key))

  const addAll = useCallback(
    (items) =>
      setValues((current) => {
        const next = new Set([...current, ...items])
        const trimmed = [...next].slice(-limit)
        try {
          localStorage.setItem(key, JSON.stringify(trimmed))
        } catch {
          // Storage can be unavailable (private mode); keep the in-memory value.
        }
        return new Set(trimmed)
      }),
    [key, limit],
  )

  return useMemo(
    () => ({ has: (v) => values.has(v), add: (v) => addAll([v]), addAll, size: values.size }),
    [values, addAll],
  )
}
