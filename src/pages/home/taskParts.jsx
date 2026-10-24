// Small pieces shared by the task layouts on the Home board.
import { Check, Circle, CircleCheck, CircleDashed, Flag, Hourglass } from 'lucide-react'
import { getPerson } from '../../data/people.js'
import { isMine, isOverdue } from '../../domain/selectors.js'
import { formatTime, isSameDay } from '../../lib/dates.js'
import { PROGRESS, getProgress } from '../../domain/task.js'

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** Chat-style time: "2:30 PM" today, then "Yesterday", "Tomorrow", "Mon", "30 Oct". */
function chatTime(date, now) {
  const d = new Date(date)
  if (isSameDay(d, now)) return formatTime(d)
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === -1) return 'Yesterday'
  if (days === 1) return 'Tomorrow'
  if (Math.abs(days) < 7) return weekday.format(d)
  return shortDate.format(d)
}

/** Due time; in multi-day columns (overdue, later) it shows the day instead. */
export function TaskTime({ task, now, showDay, className = '' }) {
  const overdue = isOverdue(task, now)
  return (
    <time
      className={`task-time${overdue ? ' task-time--overdue' : ''}${task.status === 'done' ? ' task-time--done' : ''} ${className}`}
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

/**
 * Checkbox. Your own tasks get a real checkbox; tasks someone else is doing
 * show a dashed box (filled once they've finished) that can't be ticked here.
 */
export function TaskCheck({ task, onToggle }) {
  const done = task.status === 'done'
  if (isMine(task)) {
    return (
      <label className="task-check" title={done ? 'Mark as not done' : 'Mark as done'}>
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(task, !done)}
          aria-label={done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
        />
        <span className="task-check__circle" aria-hidden="true">
          <Check size={11} strokeWidth={3} />
        </span>
      </label>
    )
  }
  const name = getPerson(task.assigneeId).name
  const status = done ? `Done by ${name}` : `Waiting on ${name}`
  return (
    <span
      className={`task-check__circle task-check__circle--theirs${done ? ' is-done' : ''}`}
      role="img"
      aria-label={status}
      title={status}
    >
      <Check size={11} strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

const PROGRESS_ICONS = { pending: Hourglass, 'not-started': Circle, 'in-progress': CircleDashed, done: CircleCheck }

/** Progress label for a task someone else is doing: Awaiting acceptance, Not started, In progress or Done. */
export function ProgressBadge({ task }) {
  const progress = getProgress(task)
  const Icon = PROGRESS_ICONS[progress]
  return (
    <span className={`progress-badge progress-badge--${progress}`}>
      <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
      {PROGRESS[progress].label}
    </span>
  )
}
