import { useId, useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import { getPerson } from '../../data/people.js'
import { isOpen } from '../../domain/selectors.js'
import { PROGRESS, getProgress } from '../../domain/task.js'
import { formatTime, isSameDay } from '../../lib/dates.js'
import { sendReminder } from '../../lib/sendReminder.js'
import { useCelebrateOnDone } from '../../lib/useCelebrateOnDone.js'
import { useToast } from '../../state/contexts.js'
import { SubtaskList, SubtaskToggle } from '../../components/Subtasks.jsx'
import { PriorityFlag, RepeatIcon } from './taskParts.jsx'
import './ByMeList.css'

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' })

/** "Today", "Tomorrow", "Yesterday", or "Monday, 26 Oct". */
function sectionTitle(column, now) {
  if (column.kind === 'later') return 'Later'
  const days = Math.round(
    (new Date(column.date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000,
  )
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return dayLabel.format(column.date)
}

/**
 * Which day sections to show: today and every later day that has tasks, plus
 * earlier days only if something there is still unfinished. Empty days are skipped.
 */
function visibleSections(columns) {
  return columns
    .map((column) => (column.kind === 'past' ? { ...column, tasks: column.tasks.filter(isOpen) } : column))
    .filter((column) => column.tasks.length > 0)
}

function ByMeRow({ task, now, inMultiDay, onOpen, onRemind }) {
  const person = getPerson(task.assigneeId)
  const progress = getProgress(task)
  const done = task.status === 'done'
  const hasSubtasks = task.subtasks?.length > 0
  const [showSubtasks, setShowSubtasks] = useState(false)
  const listId = useId()
  const celebrating = useCelebrateOnDone(done)
  // Rows in "Later" (or holding older tasks) need the date as well as the time.
  const when =
    inMultiDay && !isSameDay(task.dueAt, now)
      ? new Date(task.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
        ', ' +
        formatTime(task.dueAt)
      : formatTime(task.dueAt)

  const open = () => onOpen(task)

  return (
    <li className={`byme-item${done ? ' is-done' : ''}${celebrating ? ' is-celebrating' : ''}`}>
      <div className="byme-row">
        <span className="byme-row__avatar">
          <Avatar personId={task.assigneeId} size={28} label={`For ${person.name}`} />
          {celebrating && (
            <span className="task-celebrate-badge" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </span>
        {/* A div, not a button, so the subtask toggle below the title can be a
            real nested button; the whole area still opens the task. */}
        <div
          className="byme-row__main"
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              open()
            }
          }}
        >
          <span className="byme-row__title">{task.title}</span>
          {hasSubtasks && (
            <span className="byme-row__sub-row">
              <SubtaskToggle
                task={task}
                open={showSubtasks}
                onToggle={(event) => {
                  event.stopPropagation()
                  setShowSubtasks((v) => !v)
                }}
                listId={listId}
              />
            </span>
          )}
          <span className="byme-row__meta">
            <PriorityFlag task={task} />
            <span>{person.name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={task.dueAt}>{when}</time>
            <span aria-hidden="true">·</span>
            <span className={`byme-row__progress byme-row__progress--${progress}`}>{PROGRESS[progress].label}</span>
            <RepeatIcon task={task} />
          </span>
        </div>
        {!done && task.acceptance !== 'declined' && (
          <button
            type="button"
            className="icon-btn byme-row__remind"
            onClick={() => onRemind(task)}
            aria-label={`Remind ${person.name} about “${task.title}”`}
            title={`Remind ${person.name}`}
          >
            <BellRing size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {/* Read-only here: the person doing the task ticks these off. */}
      {showSubtasks && hasSubtasks && <SubtaskList task={task} id={listId} />}
    </li>
  )
}

/** "By me" as a simple vertical list: day sections (Today, Tomorrow, …), each with its tasks. */
function ByMeList({ columns, now, onOpen, emptyText = 'You haven’t given anyone a task yet. Use + to assign one.' }) {
  const toast = useToast()
  const sections = visibleSections(columns)

  if (sections.length === 0) {
    return <p className="byme-empty">{emptyText}</p>
  }

  return (
    <div className="byme">
      {sections.map((column) => {
        const title = sectionTitle(column, now)
        const headingId = `byme-${column.id}`
        return (
          <section key={column.id} className="byme-section" aria-labelledby={headingId}>
            <h2 id={headingId} className={`byme-section__title${title === 'Today' ? ' is-today' : ''}`}>
              {title}
            </h2>
            <ul className="byme-section__list">
              {column.tasks.map((task) => (
                <ByMeRow
                  key={task.id}
                  task={task}
                  now={now}
                  inMultiDay={column.kind === 'later' || column.kind === 'past'}
                  onOpen={onOpen}
                  onRemind={(t) => sendReminder(t, now, toast)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export default ByMeList
