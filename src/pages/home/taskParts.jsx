// Small pieces shared by the task layouts on the Home board.
import { Flag, Repeat } from 'lucide-react'
import { isOverdue } from '../../domain/selectors.js'
import { formatTime, isSameDay } from '../../lib/dates.js'

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** Chat-style time: "2:30 PM" today, then "Yesterday", "Mon", "30 Oct". */
function chatTime(date, now) {
  const d = new Date(date)
  if (isSameDay(d, now)) return formatTime(d)
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === -1) return 'Yesterday'
  if (Math.abs(days) < 7) return weekday.format(d)
  return shortDate.format(d)
}

/** Due time; in multi-day columns (overdue, later) it shows the day instead. */
export function TaskTime({ task, now, showDay, className = '' }) {
  const overdue = isOverdue(task, now)
  return (
    <time
      className={`task-time ${className}`}
      dateTime={task.dueAt}
    >
      {overdue && <span className="visually-hidden">Overdue, due </span>}
      {showDay ? chatTime(task.dueAt, now) : formatTime(task.dueAt)}
    </time>
  )
}

/** Priority flag: red = high, blue = normal. */
export function PriorityFlag({ task, className = '' }) {
  const high = task.priority === 'high'
  const label = high ? 'High priority' : 'Normal priority'
  return (
    <span
      className={`priority-flag priority-flag--${high ? 'high' : 'normal'} ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <Flag size={11} fill="currentColor" strokeWidth={2.25} aria-hidden="true" />
    </span>
  )
}

/** Small icon marking a repeating task. */
export function RepeatIcon({ task }) {
  if (!task.repeat || task.repeat === 'none') return null
  return (
    <span className="repeat-icon" role="img" aria-label={`Repeats ${task.repeat}`} title={`Repeats ${task.repeat}`}>
      <Repeat size={12} aria-hidden="true" />
    </span>
  )
}
