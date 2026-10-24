import { forwardRef } from 'react'
import TimelineCards from './TimelineCards.jsx'
import TimelineList from './TimelineList.jsx'
import './TaskLists.css'
import { isSameDay } from '../../lib/dates.js'

const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

function columnTitle(column, now) {
  if (column.kind === 'later') return { title: 'Later', sub: 'After this week' }
  // "Today" stays as a word; every other day uses its name ("Sunday"), with the date small beside it.
  const title = isSameDay(column.date, now) ? 'Today' : weekdayFormat.format(column.date)
  return { title, sub: dayFormat.format(column.date) }
}

function DateColumn({ column, now, onToggle, onOpen, onToggleSubtask, cards }) {
  const { title, sub } = columnTitle(column, now)
  const headingId = `col-${column.id}`
  // Show the day on rows only where a column can hold more than one day:
  // "Later", and the earliest past day (which also holds older unfinished tasks).
  const showDay = column.kind === 'later' || column.tasks.some((t) => !isSameDay(t.dueAt, column.date))
  const List = cards ? TimelineCards : TimelineList

  return (
    <section className={`board-col board-col--${column.kind}`} aria-labelledby={headingId}>
      {/* The date strip shows the day; the heading stays for screen readers. */}
      <h2 id={headingId} className="visually-hidden">
        {title}
        {sub && `, ${sub}`}
      </h2>

      {column.tasks.length > 0 ? (
        <List
          tasks={column.tasks}
          now={now}
          showDay={showDay}
          onToggle={onToggle}
          onOpen={onOpen}
          onToggleSubtask={onToggleSubtask}
        />
      ) : (
        <p className="board-col__empty">No tasks</p>
      )}
    </section>
  )
}

/**
 * Date columns that scroll horizontally (To me and My tasks). `cards` switches
 * To me to the MyGate-style feed card (TimelineCards) instead of the compact
 * row list (TimelineList); My tasks always uses the compact rows.
 */
const DateBoard = forwardRef(function DateBoard(
  { columns, now, onToggle, onOpen, onToggleSubtask, onScroll, cards = false },
  ref,
) {
  return (
    <div
      ref={ref}
      id="task-board"
      className="board"
      role="region"
      aria-label="Tasks by date"
      tabIndex={0}
      onScroll={onScroll}
    >
      {columns.map((column) => (
        <DateColumn
          key={column.id}
          column={column}
          now={now}
          onToggle={onToggle}
          onOpen={onOpen}
          onToggleSubtask={onToggleSubtask}
          cards={cards}
        />
      ))}
    </div>
  )
})

export default DateBoard
