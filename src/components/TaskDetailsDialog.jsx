import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarPlus,
  Check,
  CircleAlert,
  CircleDashed,
  Flag,
  Hourglass,
  Pencil,
  Repeat,
  RotateCcw,
  StickyNote,
  Trash2,
} from 'lucide-react'
import Attachments from './Attachments.jsx'
import Avatar from './Avatar.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import SubtaskEditor from './SubtaskEditor.jsx'
import { SubtaskList } from './Subtasks.jsx'
import Dialog from './Dialog.jsx'
import { CURRENT_USER_ID, getPerson } from '../data/people.js'
import { categoryLabel, categoryOf } from '../domain/categories.js'
import { isAccepted, isMine, isOverdue } from '../domain/selectors.js'
import { PROGRESS, REPEATS, getProgress, priorityLabel, reminderLabel, repeatLabel, subtaskCount } from '../domain/task.js'
import {
  formatDateTime,
  formatDueIn,
  formatTimeAgo,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '../lib/dates.js'
import { useNow } from '../state/useNow.js'
import { useTasks } from '../state/contexts.js'
import { useTaskActions } from '../state/useTaskActions.js'
import './TaskDetailsDialog.css'

const TITLE_MAX = 120
const nameOf = (id) => (id === CURRENT_USER_ID ? 'You' : getPerson(id).name)

function Tile({ icon: Icon, tone, label, value, hint }) {
  return (
    <div className={`detail-tile detail-tile--${tone}`}>
      <span className="detail-tile__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="detail-tile__text">
        <span className="detail-tile__label">{label}</span>
        <span className="detail-tile__value">{value}</span>
        {hint && <span className="detail-tile__hint">{hint}</span>}
      </span>
    </div>
  )
}

/** Inline editor for a task you created: name, time, priority, category, repeat, subtasks and notes. */
function EditForm({ task, onCancel, onSave }) {
  const due = new Date(task.dueAt)
  const [form, setForm] = useState({
    title: task.title,
    due: `${toDateInputValue(due)}T${toTimeInputValue(due)}`,
    priority: task.priority,
    repeat: task.repeat ?? 'none',
    notes: task.notes ?? '',
    category: categoryOf(task),
    subtasks: task.subtasks ?? [],
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const title = form.title.trim()
    const [d, t] = form.due.split('T')
    const dueAt = fromDateTimeInputs(d, t)
    if (!title) return setError('Give the task a name.')
    if (title.length > TITLE_MAX) return setError(`Keep the name under ${TITLE_MAX} characters.`)
    if (!dueAt) return setError('Choose a date and time.')
    setSaving(true)
    const ok = await onSave({
      title,
      dueAt: dueAt.toISOString(),
      priority: form.priority,
      repeat: form.repeat,
      notes: form.notes.trim(),
      category: form.category,
      subtasks: form.subtasks,
    })
    if (!ok) setSaving(false)
  }

  return (
    <form id="task-edit" className="details-edit" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field__label">Task</span>
        <input className="input" value={form.title} onChange={set('title')} data-autofocus maxLength={TITLE_MAX + 20} />
      </label>
      <div className="details-edit__row">
        <label className="field">
          <span className="field__label">When</span>
          <input className="input" type="datetime-local" value={form.due} onChange={set('due')} />
        </label>
        <label className="field">
          <span className="field__label">Repeat</span>
          <select className="select" value={form.repeat} onChange={set('repeat')}>
            {REPEATS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="details-edit__priority">
        <legend className="field__label">Priority</legend>
        {['normal', 'high'].map((value) => (
          <label key={value} className={`details-edit__pill${form.priority === value ? ' is-on' : ''} details-edit__pill--${value}`}>
            <input type="radio" name="edit-priority" value={value} checked={form.priority === value} onChange={set('priority')} />
            <Flag size={12} fill="currentColor" aria-hidden="true" />
            {priorityLabel(value)}
          </label>
        ))}
      </fieldset>
      <CategoryPicker value={form.category} onChange={(category) => setForm((f) => ({ ...f, category }))} name="edit-category" />
      <div className="field">
        <span className="field__label" id="edit-subtasks-label">
          Subtasks
        </span>
        <SubtaskEditor
          value={form.subtasks}
          onChange={(subtasks) => setForm((f) => ({ ...f, subtasks }))}
          labelId="edit-subtasks-label"
        />
      </div>
      <label className="field">
        <span className="field__label">Notes</span>
        <textarea className="textarea" rows={3} value={form.notes} onChange={set('notes')} />
      </label>
      {error && (
        <p className="banner banner--error" role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="details-edit__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function TaskDetailsCard({ task, onClose }) {
  const { toggleComplete, toggleSubtask, acceptTask, snoozeTask, updateTask, deleteTask } = useTaskActions()
  const now = useNow()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = task.status === 'done'
  const overdue = isOverdue(task, now)
  const mine = isMine(task)
  const awaitingMe = mine && !isAccepted(task)
  const high = task.priority === 'high'
  const fromSelf = task.createdBy === task.assigneeId
  const createdByMe = task.createdBy === CURRENT_USER_ID
  // The "other person" is who gave it to you, or who you gave it to.
  const otherId = mine ? task.createdBy : task.assigneeId
  const progress = getProgress(task)
  const category = categoryOf(task)
  const steps = subtaskCount(task)

  const status = done
    ? { tone: 'done', label: 'Done' }
    : awaitingMe
      ? { tone: 'pending', label: 'Waiting for you to accept' }
      : progress === 'declined'
        ? { tone: 'overdue', label: 'Declined' }
        : overdue
          ? { tone: 'overdue', label: 'Overdue' }
          : !mine && progress === 'pending'
            ? { tone: 'pending', label: 'Awaiting acceptance' }
            : { tone: 'open', label: mine ? 'To do' : PROGRESS[progress].label }

  const lead = (
    <div className="details-lead">
      <Avatar personId={otherId} size={40} label={nameOf(otherId)} />
      <p>
        {fromSelf ? (
          <>
            <strong>You</strong> added this for yourself
          </>
        ) : mine ? (
          <>
            <strong>{nameOf(task.createdBy)}</strong> assigned this to you
          </>
        ) : (
          <>
            You assigned this to <strong>{nameOf(task.assigneeId)}</strong>
          </>
        )}
        <span> · {formatTimeAgo(task.createdAt, now)}</span>
      </p>
    </div>
  )

  let action = null
  if (editing) {
    action = null
  } else if (awaitingMe) {
    action = (
      <button type="button" className="btn btn--primary details-action" onClick={() => (acceptTask(task), onClose())}>
        <Check size={16} strokeWidth={2.5} aria-hidden="true" />
        Accept task
      </button>
    )
  } else if (mine) {
    action = (
      <button
        type="button"
        className={`btn details-action ${done ? 'btn--secondary' : 'details-action--done'}`}
        onClick={() => (toggleComplete(task, !done), onClose())}
      >
        {done ? <RotateCcw size={16} aria-hidden="true" /> : <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
        {done ? 'Mark as not done' : 'Mark as done'}
      </button>
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Edit task' : task.title}
      lead={editing ? null : lead}
      className={`task-details task-details--${high ? 'high' : 'normal'}${done ? ' is-done' : ''}`}
      footer={action}
    >
      {editing ? (
        <EditForm
          task={task}
          onCancel={() => setEditing(false)}
          onSave={async (changes) => {
            const ok = await updateTask(task, changes)
            if (ok) setEditing(false)
            return ok
          }}
        />
      ) : (
        <>
          <div className="details-chips">
            <span className={`details-chip details-chip--${status.tone}`}>
              {status.tone === 'done' ? (
                <Check size={13} strokeWidth={2.75} aria-hidden="true" />
              ) : status.tone === 'pending' ? (
                <Hourglass size={13} aria-hidden="true" />
              ) : (
                <CircleDashed size={13} aria-hidden="true" />
              )}
              {status.label}
            </span>
            <span className="details-chip details-chip--category">
              <CategoryIcon category={category} />
              {categoryLabel(category)}
            </span>
          </div>

          {!fromSelf && (
            <div className="details-flow" aria-label={`From ${nameOf(task.createdBy)} to ${nameOf(task.assigneeId)}`}>
              <span className="details-flow__person">
                <Avatar personId={task.createdBy} size={28} />
                {nameOf(task.createdBy)}
              </span>
              <ArrowRight size={16} className="details-flow__arrow" aria-hidden="true" />
              <span className="details-flow__person">
                <Avatar personId={task.assigneeId} size={28} />
                {nameOf(task.assigneeId)}
              </span>
            </div>
          )}

          <div className="detail-tiles">
            <Tile
              icon={CalendarClock}
              tone={overdue ? 'overdue' : 'blue'}
              label="When"
              value={formatDateTime(task.dueAt, now)}
              hint={done ? null : formatDueIn(task.dueAt, now)}
            />
            <Tile icon={Flag} tone={high ? 'high' : 'blue'} label="Priority" value={priorityLabel(task.priority)} />
            <Tile icon={Bell} tone="purple" label="Reminder" value={reminderLabel(task.reminder)} />
            {task.repeat && task.repeat !== 'none' ? (
              <Tile icon={Repeat} tone="teal" label="Repeats" value={repeatLabel(task.repeat)} />
            ) : (
              !mine && <Tile icon={CircleDashed} tone="teal" label="Progress" value={PROGRESS[progress].label} />
            )}
          </div>

          {steps.total > 0 && (
            <section className="details-subtasks" aria-labelledby="details-subtasks-label">
              <h3 id="details-subtasks-label" className="details-subtasks__head">
                Subtasks
                <span>
                  {steps.done}/{steps.total} done
                </span>
              </h3>
              {/* The person doing the task ticks steps off; whoever gave it sees their progress. */}
              <SubtaskList
                task={task}
                className="subtasks--card"
                onToggleSubtask={mine && !awaitingMe ? toggleSubtask : undefined}
              />
            </section>
          )}

          <Attachments task={task} className="attachments--large" />

          {task.notes && (
            <div className="details-notes">
              <StickyNote size={14} aria-hidden="true" />
              <p>{task.notes}</p>
            </div>
          )}

          {createdByMe && (
            <div className="details-tools">
              <button type="button" className="details-tool" onClick={() => setEditing(true)}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </button>
              {mine && !done && (
                <button type="button" className="details-tool" onClick={() => (snoozeTask(task), onClose())}>
                  <CalendarPlus size={15} aria-hidden="true" />
                  Move to tomorrow
                </button>
              )}
              {confirmDelete ? (
                <button
                  type="button"
                  className="details-tool details-tool--danger is-confirm"
                  onClick={() => (deleteTask(task), onClose())}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Tap again to delete
                </button>
              ) : (
                <button type="button" className="details-tool details-tool--danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={15} aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
          )}

          {!mine && (
            <p className="details-foot">
              {getPerson(task.assigneeId).name} marks this done from their side; you’ll see it here when they do.
            </p>
          )}
        </>
      )}
    </Dialog>
  )
}

/** Task details: who it's from and for, when it's due, and one clear action. */
function TaskDetailsDialog({ taskId, onClose }) {
  const { tasks } = useTasks()
  const task = taskId ? tasks.find((t) => t.id === taskId) : null
  if (!task) return <Dialog open={false} onClose={onClose} title="" />
  // Keyed by task so edit state never leaks from one task to the next.
  return <TaskDetailsCard key={task.id} task={task} onClose={onClose} />
}

export default TaskDetailsDialog
