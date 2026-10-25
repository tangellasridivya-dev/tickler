import { useId, useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import { getPerson } from '../../data/people.js'
import { PROGRESS, getProgress } from '../../domain/task.js'
import { formatTime, isSameDay } from '../../lib/dates.js'
import { sendReminder } from '../../lib/sendReminder.js'
import { useCelebrateOnDone } from '../../lib/useCelebrateOnDone.js'
import { useToast } from '../../state/contexts.js'
import { SubtaskList, SubtaskToggle } from '../../components/Subtasks.jsx'
import DaySections from './DaySections.jsx'
import { spansDays } from './daySections.js'
import { PriorityFlag, RepeatIcon } from './taskParts.jsx'
import './ByMeList.css'

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

/** "By me": the shared day sections, each holding the tasks you gave other people. */
function ByMeList({ columns, now, onOpen, emptyText = 'You haven’t given anyone a task yet. Use + to assign one.' }) {
  const toast = useToast()

  return (
    <DaySections columns={columns} now={now} emptyText={emptyText}>
      {(column) => (
        <ul className="byme-section__list">
          {column.tasks.map((task) => (
            <ByMeRow
              key={task.id}
              task={task}
              now={now}
              inMultiDay={spansDays(column)}
              onOpen={onOpen}
              onRemind={(t) => sendReminder(t, now, toast)}
            />
          ))}
        </ul>
      )}
    </DaySections>
  )
}

export default ByMeList
