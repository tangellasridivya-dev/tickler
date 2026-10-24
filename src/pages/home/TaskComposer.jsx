import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowUp, CalendarClock, Flag, Plus, Repeat, SlidersHorizontal, X } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import CategoryIcon from '../../components/CategoryIcon.jsx'
import { CURRENT_USER_ID, getPerson } from '../../data/people.js'
import { CATEGORIES, categorize, categoryLabel } from '../../domain/categories.js'
import { parseTask } from '../../domain/parseTask.js'
import { repeatLabel } from '../../domain/task.js'
import { atTime, formatDateTime, isSameDay } from '../../lib/dates.js'
import { navigate } from '../../lib/router.js'
import { useTasks, useToast } from '../../state/contexts.js'
import './TaskComposer.css'

const TITLE_MAX = 120

/**
 * Task box at the bottom of Home, hidden behind a floating + button until
 * needed. Type a sentence ("Ask Karthik to pick up milk tomorrow at 6pm") and send; who, when and urgency are picked up
 * as you type and shown as chips you can dismiss. With no day typed, the task
 * goes on the day you're looking at.
 */
function TaskComposer({ now, day, personal = false }) {
  const { createTask } = useTasks()
  const toast = useToast()
  const [text, setText] = useState('')
  const [ignore, setIgnore] = useState({})
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const [pickedCategory, setPickedCategory] = useState(null) // set once the chip is tapped
  const inputRef = useRef(null)
  const fabRef = useRef(null)

  // Open and focus in the same tap, so phones show the keyboard straight away.
  const openComposer = () => {
    flushSync(() => setOpen(true))
    inputRef.current?.focus()
  }

  // Closing keeps any half-typed text, so reopening picks up where you left off.
  const closeComposer = () => {
    flushSync(() => setOpen(false))
    fabRef.current?.focus()
  }

  const parsed = useMemo(() => parseTask(text, now, { ignore }), [text, now, ignore])
  const { detected } = parsed
  const onLaterDay = day && !isSameDay(day, now) && day > now
  const dueAt =
    onLaterDay && !detected.date
      ? atTime(day, detected.time?.hours ?? 9, detected.time?.minutes ?? 0)
      : parsed.dueAt
  const assigneeId = parsed.assigneeId ?? CURRENT_USER_ID
  const forMe = assigneeId === CURRENT_USER_ID
  const category = pickedCategory ?? categorize(parsed.title)
  const typed = text.trim().length > 0
  const canSend = typed && parsed.title.length > 0 && !sending

  const reset = () => {
    setText('')
    setIgnore({})
    setPickedCategory(null)
  }

  const send = async (event) => {
    event.preventDefault()
    if (!canSend) return
    const title = parsed.title.slice(0, TITLE_MAX)
    if (dueAt.getTime() < Date.now() - 60_000) {
      toast.show({ tone: 'error', message: 'That time has already passed. Try a later one.' })
      return
    }
    setSending(true)
    try {
      await createTask({
        title,
        assigneeId,
        dueAt: dueAt.toISOString(),
        priority: parsed.priority ?? 'normal',
        repeat: parsed.repeat,
        category,
        reminder: '15m',
        // The other person needs to accept a task before it joins their day.
        acceptance: forMe ? 'accepted' : 'pending',
      })
      if (!forMe) {
        toast.show({ message: `Sent to ${getPerson(assigneeId).name} to accept` })
      } else if (personal) {
        toast.show({ message: `Added for ${formatDateTime(dueAt, now)}` })
      } else {
        // Your own tasks live on My tasks, not Home, so say where it went.
        toast.show({
          message: `Added to My tasks for ${formatDateTime(dueAt, now)}`,
          action: { label: 'View', onClick: () => navigate('/mine') },
        })
      }
      reset()
      closeComposer()
    } catch {
      toast.show({ tone: 'error', message: 'We couldn’t add that task. Your text is still here.' })
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button ref={fabRef} type="button" className="composer-fab" onClick={openComposer} aria-label="Add a task">
        <Plus size={24} aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      className="composer"
      onSubmit={send}
      aria-label="Add a task"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeComposer()
      }}
    >
      <div className="composer__inner">
        {typed && (
          <div className="composer__chips" aria-live="polite">
            <span className="composer-chip">
              <Avatar personId={assigneeId} size={16} />
              {forMe ? 'For you' : `For ${getPerson(assigneeId).name}`}
              {detected.person && !detected.person.self && (
                <button
                  type="button"
                  className="composer-chip__remove"
                  onClick={() => setIgnore((c) => ({ ...c, person: true }))}
                  aria-label="Keep it for yourself"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </span>
            <span className="composer-chip">
              <CalendarClock size={13} aria-hidden="true" />
              {formatDateTime(dueAt, now)}
              {(detected.date || detected.time) && (
                <button
                  type="button"
                  className="composer-chip__remove"
                  onClick={() => setIgnore((c) => ({ ...c, date: true, time: true }))}
                  aria-label="Don’t use the time from the text"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </span>
            {/* Guessed from the words; tap to try the next category. */}
            <button
              type="button"
              className="composer-chip composer-chip--button"
              onClick={() => {
                const i = CATEGORIES.findIndex((c) => c.id === category)
                setPickedCategory(CATEGORIES[(i + 1) % CATEGORIES.length].id)
              }}
              aria-label={`Category: ${categoryLabel(category)}. Tap to change`}
            >
              <CategoryIcon category={category} size={12} />
              {categoryLabel(category)}
            </button>
            {parsed.repeat !== 'none' && (
              <span className="composer-chip">
                <Repeat size={11} aria-hidden="true" />
                {repeatLabel(parsed.repeat)}
                <button
                  type="button"
                  className="composer-chip__remove"
                  onClick={() => setIgnore((c) => ({ ...c, repeat: true }))}
                  aria-label="Don’t repeat"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {parsed.priority === 'high' && (
              <span className="composer-chip composer-chip--high">
                <Flag size={11} fill="currentColor" aria-hidden="true" />
                High
                <button
                  type="button"
                  className="composer-chip__remove"
                  onClick={() => setIgnore((c) => ({ ...c, priority: true }))}
                  aria-label="Don’t mark as high priority"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="composer__row">
          <button type="button" className="icon-btn composer__more" onClick={closeComposer} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn composer__more"
            onClick={() => navigate('/new', { text: text.trim() || null })}
            aria-label="More options"
            title="More options"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
          </button>
          <label className="visually-hidden" htmlFor="composer-input">
            Add a task
          </label>
          <input
            ref={inputRef}
            id="composer-input"
            className="composer__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a task… e.g. Ask Karthik to buy milk at 6pm"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={TITLE_MAX + 60}
          />
          <button type="submit" className="composer__send" disabled={!canSend} aria-label="Add task">
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  )
}

export default TaskComposer
