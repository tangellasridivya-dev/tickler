import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarClock, CircleAlert, Flag, Repeat, Sparkles, X } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import CategoryPicker from '../../components/CategoryPicker.jsx'
import SubtaskEditor from '../../components/SubtaskEditor.jsx'
import { CURRENT_USER_ID, PEOPLE, getPerson } from '../../data/people.js'
import { categorize } from '../../domain/categories.js'
import { parseTask } from '../../domain/parseTask.js'
import { repeatLabel } from '../../domain/task.js'
import { atTime, formatDateTime, fromDateTimeInputs, isSameDay, toDateInputValue, toTimeInputValue } from '../../lib/dates.js'
import { goBack } from '../../lib/router.js'
import { useNow } from '../../state/useNow.js'
import { useTasks, useToast } from '../../state/contexts.js'
import './NewTaskPage.css'

const TITLE_MAX = 120

/** A date passed in from a column's "Add a task" (yyyy-mm-dd), or null. */
function presetDate(params) {
  const value = params.get('date')
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

function Chip({ icon, children, onRemove, removeLabel, tone }) {
  return (
    <span className={`detect-chip${tone ? ` detect-chip--${tone}` : ''}`}>
      {icon}
      <span>{children}</span>
      {onRemove && (
        <button type="button" className="detect-chip__remove" onClick={onRemove} aria-label={removeLabel}>
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

/**
 * New task: type it as a sentence ("Ask Karthik to pick up milk tomorrow at 6pm")
 * and Tickler fills in who, when and priority as you type. Everything it
 * detects is shown and can be undone or changed by hand.
 */
function NewTaskPage({ params }) {
  const { createTask } = useTasks()
  const toast = useToast()
  const now = useNow(60_000)
  const fromColumn = presetDate(params)

  // Text carried over from the Home composer's "More options".
  const [text, setText] = useState(() => params.get('text') ?? '')
  const [ignore, setIgnore] = useState({})
  const [manual, setManual] = useState({}) // { assigneeId?, dueAt?, priority?, category? }
  const [subtasks, setSubtasks] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const parsed = useMemo(() => parseTask(text, now, { ignore }), [text, now, ignore])

  // Opened from a future day's column and no date typed: due 9:00 AM that day.
  const parsedDue =
    fromColumn && !parsed.detected.date && !isSameDay(fromColumn, now)
      ? atTime(fromColumn, parsed.detected.time?.hours ?? 9, parsed.detected.time?.minutes ?? 0)
      : parsed.dueAt
  const assigneeId = manual.assigneeId ?? parsed.assigneeId ?? CURRENT_USER_ID
  const dueAt = manual.dueAt ?? parsedDue
  const priority = manual.priority ?? parsed.priority ?? 'normal'
  const category = manual.category ?? categorize(parsed.title)
  const forMe = assigneeId === CURRENT_USER_ID
  const person = getPerson(assigneeId)
  const { detected } = parsed
  const typed = text.trim().length > 0

  const dismiss = (kind) => setIgnore((current) => ({ ...current, [kind]: true }))

  const save = async (event) => {
    event.preventDefault()
    const title = parsed.title.trim()
    if (!title) return setError('Describe the task first.')
    if (title.length > TITLE_MAX) return setError(`Keep it under ${TITLE_MAX} characters.`)
    if (dueAt.getTime() < Date.now() - 60_000) return setError('That time has already passed. Pick a later one.')
    setSaving(true)
    setError(null)
    try {
      await createTask({
        title,
        assigneeId,
        dueAt: dueAt.toISOString(),
        priority,
        repeat: parsed.repeat,
        category,
        subtasks,
        reminder: '15m',
        // The other person needs to accept a task before it joins their day.
        acceptance: forMe ? 'accepted' : 'pending',
      })
      toast.show({ message: forMe ? 'Task added' : `Sent to ${person.name} to accept` })
      goBack('/')
    } catch {
      setError('We couldn’t save this task. Your text is still here, so you can try again.')
      setSaving(false)
    }
  }

  return (
    <main id="main" className="new-task" tabIndex={-1}>
      <header className="new-task__header">
        <button type="button" className="icon-btn" onClick={() => goBack('/')} aria-label="Back to Home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="new-task__title">New task</h1>
      </header>

      <form className="new-task__form" onSubmit={save} noValidate>
        <div className="field">
          <label className="visually-hidden" htmlFor="task-text">
            Describe the task
          </label>
          <textarea
            id="task-text"
            className="new-task__input"
            rows={3}
            value={text}
            autoFocus
            placeholder="Try: Ask Karthik to pick up milk tomorrow at 6pm"
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            aria-describedby="task-text-hint"
          />
          <p id="task-text-hint" className="new-task__hint">
            <Sparkles size={12} aria-hidden="true" />
            Tickler picks up the person, day, time and urgency as you type.
          </p>
        </div>

        {typed && (
          <div className="detect-chips" aria-live="polite" aria-label="Picked up from your text">
            {detected.person && !detected.person.self && (
              <Chip
                icon={<Avatar personId={detected.person.personId} size={16} />}
                onRemove={() => dismiss('person')}
                removeLabel={`Don’t assign to ${getPerson(detected.person.personId).name}`}
              >
                For {getPerson(detected.person.personId).name}
              </Chip>
            )}
            {(detected.date || detected.time) && (
              <Chip
                icon={<CalendarClock size={14} aria-hidden="true" />}
                onRemove={() => setIgnore((c) => ({ ...c, date: true, time: true }))}
                removeLabel="Don’t use the time from the text"
              >
                {formatDateTime(parsedDue, now)}
              </Chip>
            )}
            {detected.repeat && (
              <Chip
                icon={<Repeat size={13} aria-hidden="true" />}
                onRemove={() => dismiss('repeat')}
                removeLabel="Don’t repeat"
              >
                {repeatLabel(detected.repeat.repeat)}
              </Chip>
            )}
            {detected.priority && (
              <Chip
                tone="high"
                icon={<Flag size={12} fill="currentColor" aria-hidden="true" />}
                onRemove={() => dismiss('priority')}
                removeLabel="Don’t mark as high priority"
              >
                High priority
              </Chip>
            )}
            {!detected.person && !detected.date && !detected.time && !detected.priority && (
              <span className="new-task__nothing">Nothing picked up yet. Add a name, a day or a time.</span>
            )}
          </div>
        )}

        <section className="new-task__section" aria-labelledby="assign-label">
          <h2 id="assign-label" className="new-task__label">
            For
          </h2>
          <div className="people-picker" role="radiogroup" aria-labelledby="assign-label">
            {PEOPLE.map((p) => {
              const selected = p.id === assigneeId
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`people-picker__option${selected ? ' is-selected' : ''}`}
                  onClick={() => setManual((m) => ({ ...m, assigneeId: p.id }))}
                >
                  <Avatar personId={p.id} size={32} label={p.id === CURRENT_USER_ID ? 'You' : p.name} />
                  <span>{p.id === CURRENT_USER_ID ? 'You' : p.name}</span>
                </button>
              )
            })}
          </div>
          {!forMe && <p className="new-task__hint">{person.name} will get a request to accept it.</p>}
        </section>

        <section className="new-task__section new-task__row">
          <div className="field">
            <label className="new-task__label" htmlFor="task-due">
              When
            </label>
            <input
              id="task-due"
              type="datetime-local"
              className="input"
              value={`${toDateInputValue(dueAt)}T${toTimeInputValue(dueAt)}`}
              onChange={(e) => {
                const [d, t] = e.target.value.split('T')
                const next = fromDateTimeInputs(d, t)
                if (next) setManual((m) => ({ ...m, dueAt: next }))
              }}
            />
          </div>

          <fieldset className="field priority-field">
            <legend className="new-task__label">Priority</legend>
            <div className="priority-toggle">
              {[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
              ].map((option) => (
                <label key={option.value} className={`priority-toggle__option priority-toggle__option--${option.value}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={priority === option.value}
                    onChange={() => setManual((m) => ({ ...m, priority: option.value }))}
                  />
                  <span>
                    <Flag size={12} fill="currentColor" aria-hidden="true" />
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="new-task__section">
          <CategoryPicker
            value={category}
            onChange={(value) => setManual((m) => ({ ...m, category: value }))}
            name="category"
            legendClassName="new-task__label"
          />
        </section>

        <section className="new-task__section" aria-labelledby="subtasks-label">
          <h2 id="subtasks-label" className="new-task__label">
            Subtasks <span className="new-task__optional">(optional)</span>
          </h2>
          <SubtaskEditor value={subtasks} onChange={setSubtasks} labelId="subtasks-label" />
        </section>

        {typed && parsed.title && (
          <p className="new-task__preview">
            <span className="new-task__label">Saved as</span>
            <span>
              <strong>{parsed.title}</strong> · {forMe ? 'you' : person.name} · {formatDateTime(dueAt, now)}
            </span>
          </p>
        )}

        {error && (
          <p className="banner banner--error" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary new-task__submit" disabled={saving}>
          {saving ? 'Saving…' : forMe ? 'Add task' : `Send to ${person.name}`}
        </button>
      </form>
    </main>
  )
}

export default NewTaskPage
