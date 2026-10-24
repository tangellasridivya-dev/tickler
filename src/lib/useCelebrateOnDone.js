import { useEffect, useRef, useState } from 'react'

const CELEBRATE_MS = 700

/**
 * True for a brief moment right after `done` flips from false to true (not
 * on first render, and not when it flips back). Drives the small flash and
 * checkmark pop that mark a task finishing.
 */
export function useCelebrateOnDone(done) {
  const wasDone = useRef(done)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    if (done && !wasDone.current) {
      setCelebrating(true)
      const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS)
      wasDone.current = done
      return () => clearTimeout(timer)
    }
    wasDone.current = done
  }, [done])

  return celebrating
}
