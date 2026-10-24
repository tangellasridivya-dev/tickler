import { useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import Dialog from './Dialog.jsx'
import { CURRENT_USER_ID, PEOPLE, getPerson } from '../data/people.js'
import { ESTIMATES, PRIORITIES, REMINDERS } from '../domain/task.js'
import {
  addDays,
  atTime,
  formatDuration,
  fromDateTimeInputs,
  isSameDay,
  toDateInputValue,
  toTimeInputValue,
} from '../lib/dates.js'
import { useTasks, useToast } from '../state/contexts.js'
import './CreateTaskDialog.css'

const TITLE_MAX = 120

/** Next whole hour today, or 9:00 AM tomorrow if it's late. */
function defaultDue(now = new Date()) {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  if (next.getHours() >= 22 || next.getDate() !== now.getDate()) return atTime(addDays(now, 1), 9)
  return next
}

function initialForm(preset) {
  // Opened from a future day's "Add a task": default to 9:00 AM that day.
  const due = preset.date && !isSameDay(preset.date, new Date()) ? atTime(preset.date, 9) : defaultDue()
  return {
    title: '',
    assigneeId: preset.assigneeId ?? CURRENT_USER_ID,
    date: toDateInputValue(due),
    time: toTimeInputValue(due),
    reminder: '15m',
    priority: 'normal',
    estimateMinutes: '',
    flexible: false,
    notes: '',
  }
}

function validate(form) {
  const errors = {}
  const title = form.title.trim()
  if (!title) errors.title = 'Give your task a name.'
  else if (title.length > TITLE_MAX) errors.title = `Keep the name under ${TITLE_MAX} characters.`
  const due = fromDateTimeInputs(form.date, form.time)
  if (!due) errors.due = 'Choose a date and time.'
  else if (due.getTime() < Date.now() - 60_000) errors.due = 'Choose a time that hasn’t passed yet.'
  return errors
}

function CreateTaskForm({ preset, onClose, onCreated }) {
  const { createTask } = useTasks()
  const toast = useToast()
  const [form, setForm] = useState(() => initialForm(preset))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const titleRef = useRef(null)
  const dateRef = useRef(null)

  const forMe = form.assigneeId === CURRENT_USER_ID
  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field] || (field === 'date' || field === 'time')) setErrors((e) => ({ ...e, [field]: undefined, due: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (found.title) return titleRef.current?.focus()
    if (found.due) return dateRef.current?.focus()

    setSubmitting(true)
    setSubmitError(null)
    try {
      const task = await createTask({
        title: form.title.trim(),
        assigneeId: form.assigneeId,
        dueAt: fromDateTimeInputs(form.date, form.time).toISOString(),
        reminder: form.reminder,
        priority: form.priority,
        estimateMinutes: form.estimateMinutes ? Number(form.estimateMinutes) : null,
        flexible: forMe && form.flexible,
        // The other person needs to accept a task before it joins their day.
        acceptance: forMe ? 'accepted' : 'pending',
        notes: form.notes.trim(),
      })
      onClose()
      toast.show({
        message: forMe ? 'Task created' : `Task assigned to ${getPerson(form.assigneeId).name}`,
        action: { label: 'View', onClick: () => onCreated(task) },
      })
    } catch {
      setSubmitError('We couldn’t save this task. Your details are still here, so you can try again.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      as="form"
      onSubmit={handleSubmit}
      onClose={onClose}
      title="Create task"
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : forMe ? 'Create task' : 'Assign task'}
          </button>
        </>
      }
    >
      {submitError && (
        <div className="banner banner--error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          {submitError}
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="task-title">
          What needs to be done?
        </label>
        <input
          ref={titleRef}
          id="task-title"
          className="input"
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Call the plumber"
          autoComplete="off"
          data-autofocus
          maxLength={TITLE_MAX + 20}
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
        />
        {errors.title && (
          <p id="task-title-error" className="field__error">
            <CircleAlert size={14} aria-hidden="true" />
            {errors.title}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="task-assignee">
          Who will do it?
        </label>
        <select id="task-assignee" className="select" value={form.assigneeId} onChange={set('assigneeId')}>
          {PEOPLE.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id === CURRENT_USER_ID ? 'Me' : `${p.name} (${p.relation})`}
            </option>
          ))}
        </select>
        {!forMe && (
          <p className="field__hint">
            They’ll get a request to accept it. You can follow it under “By me”; it won’t count toward
            your own tasks.
          </p>
        )}
      </div>

      <fieldset className="create-task__due">
        <legend className="field__label">When is it due?</legend>
        <div className="create-task__row">
          <div className="field">
            <label className="visually-hidden" htmlFor="task-date">
              Due date
            </label>
            <input
              ref={dateRef}
              id="task-date"
              type="date"
              className="input"
              value={form.date}
              onChange={set('date')}
              aria-invalid={errors.due ? 'true' : undefined}
              aria-describedby={errors.due ? 'task-due-error' : undefined}
            />
          </div>
          <div className="field">
            <label className="visually-hidden" htmlFor="task-time">
              Due time
            </label>
            <input
              id="task-time"
              type="time"
              className="input"
              value={form.time}
              onChange={set('time')}
              aria-invalid={errors.due ? 'true' : undefined}
              aria-describedby={errors.due ? 'task-due-error' : undefined}
            />
          </div>
        </div>
        {errors.due && (
          <p id="task-due-error" className="field__error">
            <CircleAlert size={14} aria-hidden="true" />
            {errors.due}
          </p>
        )}
      </fieldset>

      <div className="create-task__row">
        <div className="field">
          <label className="field__label" htmlFor="task-reminder">
            Reminder
          </label>
          <select id="task-reminder" className="select" value={form.reminder} onChange={set('reminder')}>
            {REMINDERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="field">
          <legend className="field__label">
            Priority
          </legend>
          <div className="segmented">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="segmented__option">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={form.priority === p.value}
                  onChange={set('priority')}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <details className="create-task__more">
        <summary>More options</summary>
        <div className="create-task__more-body">
          <div className="field">
            <label className="field__label" htmlFor="task-estimate">
              How long will it take?
            </label>
            <select id="task-estimate" className="select" value={form.estimateMinutes} onChange={set('estimateMinutes')}>
              {ESTIMATES.map((m) => (
                <option key={m ?? 'none'} value={m ?? ''}>
                  {m == null ? 'Not sure' : formatDuration(m)}
                </option>
              ))}
            </select>
            <p className="field__hint">Helps Tickler notice when your day is getting too full.</p>
          </div>
          {forMe && (
            <label className="checkbox-field">
              <input type="checkbox" checked={form.flexible} onChange={set('flexible')} />
              <span>
                <span className="checkbox-field__label">The time is flexible</span>
                <span className="field__hint">
                  Tickler may suggest moving it if your day gets busy. It never moves tasks without asking.
                </span>
              </span>
            </label>
          )}
          <div className="field">
            <label className="field__label" htmlFor="task-notes">
              Notes
            </label>
            <textarea id="task-notes" className="textarea" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
      </details>
    </Dialog>
  )
}

function CreateTaskDialog({ open, preset, onClose, onCreated }) {
  // Mounting the form only while open gives every new task a fresh form and defaults.
  return open ? <CreateTaskForm preset={preset} onClose={onClose} onCreated={onCreated} /> : null
}

export default CreateTaskDialog
