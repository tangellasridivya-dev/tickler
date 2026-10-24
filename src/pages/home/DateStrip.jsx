import { useEffect, useRef } from 'react'
import { isSameDay } from '../../lib/dates.js'

const weekdayShort = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

function chipLabel(column, now) {
  if (column.kind === 'later') return { top: 'Later', bottom: null }
  if (isSameDay(column.date, now)) return { top: 'Today', bottom: column.date.getDate() }
  return { top: weekdayShort.format(column.date), bottom: column.date.getDate() }
}

/**
 * A row of day chips under the top bar. Tapping one jumps the board to that
 * day, so moving between days never depends on swiping (which completes tasks).
 * Chips for the days currently on screen are highlighted.
 */
function DateStrip({ columns, now, firstVisible, visibleCount, onSelect }) {
  const stripRef = useRef(null)

  // Keep the highlighted chip in view when the board scrolls.
  useEffect(() => {
    const chip = stripRef.current?.querySelector(`[data-index="${firstVisible}"]`)
    chip?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [firstVisible])

  return (
    <nav className="date-strip" ref={stripRef} aria-label="Jump to a day">
      {columns.map((column, index) => {
        const { top, bottom } = chipLabel(column, now)
        const active = index >= firstVisible && index < firstVisible + visibleCount
        return (
          <button
            key={column.id}
            type="button"
            data-index={index}
            className={`date-chip date-chip--${column.kind}${active ? ' is-active' : ''}${column.kind === 'past' && column.openCount ? ' has-overdue' : ''}`}
            aria-current={index === firstVisible ? 'date' : undefined}
            aria-label={`${top}${bottom ? ` ${bottom}` : ''}, ${column.openCount} to do`}
            onClick={() => onSelect(index)}
          >
            <span className="date-chip__top">{top}</span>
            {bottom != null && <span className="date-chip__day">{bottom}</span>}
            {column.openCount > 0 && <span className="date-chip__dot" aria-hidden="true" />}
          </button>
        )
      })}
    </nav>
  )
}

export default DateStrip
