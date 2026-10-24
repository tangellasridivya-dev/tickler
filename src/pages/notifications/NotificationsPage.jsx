import { useMemo, useState } from 'react'
import { ArrowLeft, BellOff, BellRing, CalendarClock, Check, Clock, CircleAlert, CircleX, Inbox, RefreshCw } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { getPerson } from '../../data/people.js'
import { getRequestTimeline } from '../../domain/selectors.js'
import { formatRelativeDay, formatTime, formatTimeAgo, startOfDay } from '../../lib/dates.js'
import { goBack } from '../../lib/router.js'
import { useNow } from '../../state/useNow.js'
import { useTasks, useUI } from '../../state/contexts.js'
import { useTaskActions } from '../../state/useTaskActions.js'
import { PriorityFlag } from '../home/taskParts.jsx'
import './NotificationsPage.css'

const DAY_MS = 86_400_000

/** "Today", "Yesterday", "This week" or "Earlier" — grouped the way Instagram dates its activity. */
function dateGroupTitle(at, now) {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS)
  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return 'This week'
  return 'Earlier'
}

/** Buckets an already newest-first list under its date headings, in order. */
function groupByDate(items, now) {
  const groups = []
  for (const item of items) {
    const title = dateGroupTitle(item.at, now)
    const last = groups[groups.length - 1]
    if (last?.title === title) last.items.push(item)
    else groups.push({ title, items: [item] })
  }
  return groups
}

/** Lets the user allow system alerts for reminders, once. */
function ReminderPermission() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')
  if (permission === 'granted' || permission === 'unsupported') return null
  if (permission === 'denied') {
    return (
      <p className="reminder-permission reminder-permission--blocked">
        <BellOff size={16} aria-hidden="true" />
        Reminder alerts are blocked. Allow notifications for this site in your browser settings to get them.
      </p>
    )
  }
  return (
    <div className="reminder-permission">
      <BellRing size={18} aria-hidden="true" />
      <p>Get an alert on this device when a task's reminder is due.</p>
      <button
        type="button"
        className="btn btn--primary btn--sm"
        onClick={async () => setPermission(await Notification.requestPermission())}
      >
        Turn on
      </button>
    </div>
  )
}

/**
 * One request row: who it's from and what it is on top, then either the one
 * action that matters (Accept, for a pending request) or a quiet status line
 * underneath — never both, so there's only ever one thing to look at per row.
 * A line under each row separates them, not a boxed card.
 */
function RequestRow({ task, now, status, onAccept, onOpen }) {
  const from = getPerson(task.createdBy).name
  return (
    <li className={`req-row req-row--${status}`}>
      <Avatar personId={task.createdBy} size={32} label={from} />
      <div className="req-row__body">
        <p className="req-row__line">
          <span className="req-row__name">{from}</span> assigned a task to you · {formatTimeAgo(task.createdAt, now)}
        </p>
        <button type="button" className="req-row__task" onClick={() => onOpen(task)}>
          {task.title}
        </button>
        <p className="req-row__meta">
          <PriorityFlag task={task} />
          <span className="req-row__meta-item">
            <CalendarClock size={11} aria-hidden="true" />
            {formatRelativeDay(task.dueAt, now)}
          </span>
          <span className="req-row__meta-item">
            <Clock size={11} aria-hidden="true" />
            {formatTime(task.dueAt)}
          </span>
        </p>
        {status === 'pending' ? (
          <button
            type="button"
            className="req-row__accept"
            onClick={() => onAccept(task)}
            aria-label={`Accept “${task.title}” from ${from}`}
          >
            <Check size={15} strokeWidth={2.75} aria-hidden="true" />
            Accept
          </button>
        ) : (
          <p className={`req-row__status req-row__status--${status}`}>
            {status === 'accepted' ? (
              <Check size={12} strokeWidth={2.75} aria-hidden="true" />
            ) : (
              <CircleX size={12} aria-hidden="true" />
            )}
            {status === 'accepted' ? 'Accepted' : 'Declined'}
          </p>
        )}
      </div>
    </li>
  )
}

/** Task requests: everything people have given you, newest first, dated like a feed. Accept one to add it to your day. */
function NotificationsPage() {
  const { status, tasks, reload } = useTasks()
  const { acceptTask } = useTaskActions()
  const { openTask } = useUI()
  const now = useNow()
  const timeline = useMemo(() => getRequestTimeline(tasks), [tasks])
  const pendingCount = useMemo(() => timeline.filter((r) => r.status === 'pending').length, [timeline])
  const groups = useMemo(() => groupByDate(timeline, now), [timeline, now])

  let content
  if (status === 'loading') {
    content = <div className="skeleton" style={{ height: 200 }} aria-busy="true" aria-label="Loading task requests" />
  } else if (status === 'error') {
    content = (
      <EmptyState
        icon={CircleAlert}
        title="We couldn’t load your task requests."
        action={
          <button type="button" className="btn btn--secondary" onClick={reload}>
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        }
      />
    )
  } else if (timeline.length === 0) {
    content = (
      <EmptyState icon={Inbox} compact title="No task requests">
        When someone gives you a task, it’ll show up here for you to accept.
      </EmptyState>
    )
  } else {
    content = groups.map((group) => (
      <section key={group.title} className="req-group" aria-labelledby={`req-${group.title}`}>
        <h2 id={`req-${group.title}`} className="req-group__title">
          {group.title}
        </h2>
        <ul className="req-list">
          {group.items.map(({ task, status: reqStatus }) => (
            <RequestRow key={task.id} task={task} now={now} status={reqStatus} onAccept={acceptTask} onOpen={openTask} />
          ))}
        </ul>
      </section>
    ))
  }

  return (
    <main id="main" className="notifications" tabIndex={-1}>
      <header className="notifications__header">
        <button type="button" className="icon-btn" onClick={() => goBack('/')} aria-label="Back to Home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="notifications__title">
          Task requests
          {pendingCount > 0 && <span className="notif-count">{pendingCount}</span>}
        </h1>
      </header>
      <ReminderPermission />
      {content}
    </main>
  )
}

export default NotificationsPage
