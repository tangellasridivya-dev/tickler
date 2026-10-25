import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, CalendarClock, Flag, Mic, Plus, Repeat, X } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import CategoryIcon from '../../components/CategoryIcon.jsx'
import { CURRENT_USER_ID, firstName, getPerson } from '../../data/people.js'
import { CATEGORIES, categorize, categoryLabel } from '../../domain/categories.js'
import { parseTask } from '../../domain/parseTask.js'
import { repeatLabel } from '../../domain/task.js'
import { formatDateTime } from '../../lib/dates.js'
import { navigate } from '../../lib/router.js'
import { useTasks, useToast } from '../../state/contexts.js'
import './TaskComposer.css'

const TITLE_MAX = 120

/** The browser's own speech recognition, where there is one (Chrome, Edge, Safari). */
const SpeechRecognition =
  typeof window === 'undefined' ? null : (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)

/**
 * The task bar fixed along the bottom of the board — always there to type
 * into, the way a chat app's message bar is, rather than hidden behind a
 * button. Type a sentence ("Ask Karthik to pick up milk tomorrow at 6pm") and
 * send; who, when, category and urgency are picked up as you type and shown as
 * chips above the bar, each one dismissible. + opens the full form.
 */
function TaskComposer({ now, personal = false }) {
  const { createTask } = useTasks()
  const toast = useToast()
  const [text, setText] = useState('')
  const [ignore, setIgnore] = useState({})
  const [sending, setSending] = useState(false)
  const [pickedCategory, setPickedCategory] = useState(null) // set once the chip is tapped
  const [listening, setListening] = useState(false)
  const recogniser = useRef(null)

  // Stop the microphone if the board goes away mid-sentence.
  useEffect(() => () => recogniser.current?.abort(), [])

  /**
   * Dictate the task instead of typing it. The words land in the same box, so
   * the sentence reader still picks out who, when and how urgent from them.
   */
  const toggleMic = () => {
    if (listening) {
      recogniser.current?.stop()
      return
    }
    const recogniser_ = new SpeechRecognition()
    recogniser_.lang = navigator.language || 'en-IN'
    recogniser_.interimResults = true
    recogniser_.onresult = (event) =>
      setText(
        Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
          .trimStart(),
      )
    recogniser_.onend = () => setListening(false)
    recogniser_.onerror = (event) => {
      setListening(false)
      if (event.error === 'aborted' || event.error === 'no-speech') return
      toast.show({
        tone: 'error',
        message:
          event.error === 'not-allowed'
            ? 'Microphone access is off for this site.'
            : 'We couldn’t catch that. Try again.',
      })
    }
    recogniser.current = recogniser_
    recogniser_.start()
    setListening(true)
  }

  const parsed = useMemo(() => parseTask(text, now, { ignore }), [text, now, ignore])
  const { detected } = parsed
  const dueAt = parsed.dueAt
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
        toast.show({ message: `Sent to ${firstName(getPerson(assigneeId))} to accept` })
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
    } catch {
      toast.show({ tone: 'error', message: 'We couldn’t add that task. Your text is still here.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="composer" onSubmit={send} aria-label="Add a task">
      {typed && (
        <div className="composer__chips" aria-live="polite">
          <span className="composer-chip">
            <Avatar personId={assigneeId} size={16} />
            {forMe ? 'For you' : `For ${firstName(getPerson(assigneeId))}`}
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

      <div className="composer__bar">
        <button
          type="button"
          className="composer__plus"
          onClick={() => navigate('/new', { text: text.trim() || null })}
          aria-label="More options"
          title="More options"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
        <label className="visually-hidden" htmlFor="composer-input">
          Add a task
        </label>
        <input
          id="composer-input"
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={listening ? 'Listening…' : 'e.g. Ask Karthik to buy milk at 6pm'}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={TITLE_MAX + 60}
        />
        {/* Only offered where the browser can actually hear. */}
        {SpeechRecognition && (
          <button
            type="button"
            className={`composer__mic${listening ? ' is-listening' : ''}`}
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? 'Stop listening' : 'Say the task instead'}
            title={listening ? 'Stop listening' : 'Say the task instead'}
          >
            <Mic size={18} aria-hidden="true" />
          </button>
        )}
        <button type="submit" className="composer__send" disabled={!canSend} aria-label="Add task">
          <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

export default TaskComposer
