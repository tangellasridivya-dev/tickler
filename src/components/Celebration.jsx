import { useEffect, useMemo } from 'react'
import { Check, Flame } from 'lucide-react'
import './Celebration.css'

const PARTICLE_COUNT = 34
const VISIBLE_MS = 3600
const COLORS = ['var(--color-brand-bg)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-primary)']

/**
 * A fresh burst each time rather than one canned animation: a reward that
 * varies slightly keeps its effect far longer than one that repeats exactly.
 */
function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const distance = 90 + Math.random() * 150
    return {
      id: i,
      dx: Math.round(Math.cos(angle) * distance),
      // Biased upward, so it reads as thrown rather than scattered.
      dy: Math.round(Math.sin(angle) * distance) - 30,
      rotate: Math.round(Math.random() * 540 - 270),
      delay: Math.round(Math.random() * 140),
      duration: 1000 + Math.round(Math.random() * 700),
      size: 6 + Math.round(Math.random() * 5),
      color: COLORS[i % COLORS.length],
      round: i % 3 === 0,
    }
  })
}

/**
 * Shown once, the moment everything due today is done. It names the number
 * finished — saying the loop is closed is the point of it — and the streak,
 * if there is one. It clears itself after a few seconds, and a tap, a click
 * or Escape dismisses it sooner; it is a pat on the back, not a dialog.
 */
function Celebration({ count, streak, onDismiss }) {
  const particles = useMemo(() => makeParticles(), [])

  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS)
    const onKey = (event) => event.key === 'Escape' && onDismiss()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onDismiss])

  return (
    <div className="celebrate" role="status" aria-live="polite" onClick={onDismiss}>
      <div className="celebrate__burst" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className={`celebrate__particle${p.round ? ' is-round' : ''}`}
            style={{
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rotate': `${p.rotate}deg`,
              '--size': `${p.size}px`,
              '--color': p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
            }}
          />
        ))}
      </div>

      <div className="celebrate__card">
        <span className="celebrate__badge" aria-hidden="true">
          <Check size={28} strokeWidth={3} />
        </span>
        <p className="celebrate__title">Day cleared</p>
        <p className="celebrate__sub">
          {count === 1 ? 'That was the last one left.' : `All ${count} tasks done today.`}
        </p>
        {streak > 1 && (
          <p className="celebrate__streak">
            <Flame size={13} aria-hidden="true" />
            {streak} days in a row
          </p>
        )}
      </div>
    </div>
  )
}

export default Celebration
