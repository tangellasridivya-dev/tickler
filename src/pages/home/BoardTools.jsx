import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, SlidersHorizontal } from 'lucide-react'
import { BOARD_FILTERS } from '../../domain/selectors.js'
import { startOfDay, toDateInputValue } from '../../lib/dates.js'
import { useToast } from '../../state/contexts.js'

const DAY_MS = 86_400_000

/**
 * The filter, behind an icon instead of a row of tabs. The current one is
 * named beside the icon whenever it isn't "All", so a filtered board never
 * looks like an empty one.
 */
export function FilterMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = BOARD_FILTERS.find((f) => f.id === value)
  const filtered = value !== 'all'

  useEffect(() => {
    if (!open) return
    const onDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className="board-tool" ref={ref}>
      <button
        type="button"
        className={`board-tool__btn${filtered ? ' is-on' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={filtered ? `Filter: ${active.label}` : 'Filter tasks'}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {filtered && <span className="board-tool__label">{active.label}</span>}
      </button>

      {open && (
        <div className="board-menu" role="menu">
          {BOARD_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="menuitemradio"
              aria-checked={filter.id === value}
              className={`board-menu__item${filter.id === value ? ' is-on' : ''}`}
              onClick={() => {
                onChange(filter.id)
                setOpen(false)
              }}
            >
              {filter.label}
              {filter.id === value && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}

/**
 * Jump to a day. The sideways calendar is gone, so this is what replaces it:
 * pick a date and the page scrolls to that day's heading.
 */
export function DateJump({ now }) {
  const ref = useRef(null)
  const toast = useToast()

  const jump = (value) => {
    if (!value) return
    const [y, m, d] = value.split('-').map(Number)
    const offset = Math.round((startOfDay(new Date(y, m - 1, d)) - startOfDay(now)) / DAY_MS)
    // Section ids follow the columns: day-0 is today, day--1 yesterday, and
    // anything past the end of the board lives in "later".
    const heading =
      document.getElementById(`day-day-${offset}`) ?? (offset > 0 ? document.getElementById('day-later') : null)
    if (!heading) {
      toast.show({ message: 'Nothing on that day.' })
      return
    }
    // Gliding there is nicer, but anyone who has asked for less motion gets
    // taken straight to it instead.
    const gentle = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: gentle ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <span className="board-tool">
      <button
        type="button"
        className="board-tool__btn"
        onClick={() => {
          const input = ref.current
          if (input?.showPicker) input.showPicker()
          else input?.click()
        }}
        aria-label="Jump to a day"
      >
        <CalendarDays size={16} aria-hidden="true" />
      </button>
      <input
        ref={ref}
        type="date"
        className="board-tool__date"
        defaultValue={toDateInputValue(now)}
        onChange={(event) => jump(event.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </span>
  )
}
