import { forwardRef } from 'react'
import { Plus } from 'lucide-react'
import PersonGroups from './PersonGroups.jsx'
import TimelineList from './TimelineList.jsx'
import './TaskLists.css'
import { formatRelativeDay } from '../../lib/dates.js'

const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

function columnTitle(column, now) {
  if (column.kind === 'overdue') return { title: 'Overdue', sub: 'Earlier' }
  if (column.kind === 'later') return { title: 'Later', sub: 'After this week' }
  const title = formatRelativeDay(column.date, now)
  // "Tomorrow" needs no date beside it; Today and other weekdays show it small.
  return { title, sub: title === 'Tomorrow' ? null : dayFormat.format(column.date) }
}

function DateColumn({ column, scope, now, onToggle, onOpen, onAdd }) {
  const List = scope === 'by-me' ? PersonGroups : TimelineList
  const { title, sub } = columnTitle(column, now)
  const headingId = `col-${column.id}`
  const canAdd = column.kind === 'today' || column.kind === 'day'

  return (
    <section className={`board-col board-col--${column.kind}`} aria-labelledby={headingId}>
      <header className="board-col__head">
        <h2 id={headingId} className="board-col__title">
          {title}
          {sub && <span className="board-col__date">{sub}</span>}
        </h2>
        {column.openCount > 0 && (
          <span className="board-col__count" aria-label={`${column.openCount} to do`}>
            {column.openCount}
          </span>
        )}
      </header>

      {column.tasks.length > 0 ? (
        <List
          tasks={column.tasks}
          now={now}
          showDay={column.kind === 'overdue' || column.kind === 'later'}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ) : (
        <p className="board-col__empty">No tasks</p>
      )}

      {canAdd && (
        <button type="button" className="add-task" onClick={() => onAdd(column.date)}>
          <Plus size={20} aria-hidden="true" />
          Add a task
        </button>
      )}
    </section>
  )
}

/** Date columns that scroll horizontally. "To me" shows a timeline, "By me" groups by person. */
const DateBoard = forwardRef(function DateBoard({ columns, scope, now, onToggle, onOpen, onAdd, onScroll }, ref) {
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
          scope={scope}
          now={now}
          onToggle={onToggle}
          onOpen={onOpen}
          onAdd={onAdd}
        />
      ))}
    </div>
  )
})

export default DateBoard
