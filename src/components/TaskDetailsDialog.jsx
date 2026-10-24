import { CircleAlert, CircleCheck } from 'lucide-react'
import Dialog from './Dialog.jsx'
import { CURRENT_USER_ID, getPerson } from '../data/people.js'
import { getOwnership, isAccepted, isMine, isOverdue } from '../domain/selectors.js'
import { PROGRESS, getProgress, priorityLabel, reminderLabel } from '../domain/task.js'
import { formatDateTime, formatDuration } from '../lib/dates.js'
import { useNow } from '../state/useNow.js'
import { useTasks } from '../state/contexts.js'
import { useTaskActions } from '../state/useTaskActions.js'
import './TaskDetailsDialog.css'

function TaskDetailsDialog({ taskId, onClose }) {
  const { tasks } = useTasks()
  const { toggleComplete, acceptTask } = useTaskActions()
  const now = useNow()
  const task = taskId ? tasks.find((t) => t.id === taskId) : null
  const open = task != null

  if (!open) return <Dialog open={false} onClose={onClose} title="" />

  const done = task.status === 'done'
  const overdue = isOverdue(task, now)
  const mine = isMine(task)
  const awaitingMe = mine && !isAccepted(task)
  const ownership = getOwnership(task)

  const rows = [
    ['Due', formatDateTime(task.dueAt, now)],
    ['Who', ownership.description],
    mine ? null : ['Progress', PROGRESS[getProgress(task)].label],
    ['Priority', priorityLabel(task.priority)],
    ['Reminder', reminderLabel(task.reminder)],
    ['Time needed', task.estimateMinutes ? formatDuration(task.estimateMinutes) : 'Not set'],
    mine && task.createdBy === CURRENT_USER_ID
      ? ['Flexible', task.flexible ? 'Yes, it can move if your day gets busy' : 'No, keep this time']
      : null,
  ].filter(Boolean)

  return (
    <Dialog
      open
      onClose={onClose}
      title={task.title}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          {awaitingMe && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                acceptTask(task)
                onClose()
              }}
            >
              Accept task
            </button>
          )}
          {mine && !awaitingMe && (
            <button
              type="button"
              className={`btn ${done ? 'btn--secondary' : 'btn--primary'}`}
              onClick={() => {
                toggleComplete(task, !done)
                onClose()
              }}
            >
              {done ? 'Mark as not done' : 'Mark as done'}
            </button>
          )}
        </>
      }
    >
      <p className={`details-status details-status--${done ? 'done' : overdue ? 'overdue' : 'open'}`}>
        {done ? (
          <>
            <CircleCheck size={16} aria-hidden="true" /> Done {formatDateTime(task.completedAt, now)}
          </>
        ) : overdue ? (
          <>
            <CircleAlert size={16} aria-hidden="true" /> Overdue
          </>
        ) : (
          'To do'
        )}
      </p>
      <dl className="details-list">
        {rows.map(([label, value]) => (
          <div key={label} className="details-list__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {task.notes && (
        <div className="details-notes">
          <h3>Notes</h3>
          <p>{task.notes}</p>
        </div>
      )}
      {!mine && (
        <p className="field__hint">
          {getPerson(task.assigneeId).name} is responsible for this task, so it doesn’t appear in your own list.
        </p>
      )}
    </Dialog>
  )
}

export default TaskDetailsDialog
