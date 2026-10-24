import { useMemo } from 'react'
import { ArrowLeft, Bell, Check, CircleAlert, CircleCheck, Inbox, RefreshCw } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { getPerson } from '../../data/people.js'
import { getActiveReminders, getTaskRequests, isOverdue } from '../../domain/selectors.js'
import { formatDateTime, formatTimeAgo } from '../../lib/dates.js'
import { goBack } from '../../lib/router.js'
import { READ_REMINDERS_KEY, useStoredSet } from '../../lib/useStoredSet.js'
import { useNow } from '../../state/useNow.js'
import { useTasks, useUI } from '../../state/contexts.js'
import { useTaskActions } from '../../state/useTaskActions.js'
import { PriorityFlag } from '../home/taskParts.jsx'
import './NotificationsPage.css'


function RequestRow({ task, now, accepted, onAccept, onOpen }) {
  const from = getPerson(task.createdBy).name
  return (
    <li className="notif-row">
      <Avatar personId={task.createdBy} size={32} label={from} />
      <div className="notif-row__body">
        <p className="notif-row__line">
          <strong>{from}</strong> assigned you a task · {formatTimeAgo(task.createdAt, now)}
        </p>
        <button type="button" className="notif-row__task" onClick={() => onOpen(task)}>
          {task.title}
        </button>
        <p className="notif-row__meta">
          <PriorityFlag task={task} />
          Due {formatDateTime(task.dueAt, now)}
        </p>
      </div>
      {accepted ? (
        <span className="accepted-badge">
          <CircleCheck size={14} aria-hidden="true" />
          Accepted
        </span>
      ) : (
        <button
          type="button"
          className="btn btn--primary btn--sm accept-btn"
          onClick={() => onAccept(task)}
          aria-label={`Accept “${task.title}” from ${from}`}
        >
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          Accept
        </button>
      )}
    </li>
  )
}

/**
 * Notifications: task requests from people who gave you something to do (accept
 * them to add them to your day), and reminders for your accepted tasks.
 */
function NotificationsPage() {
  const { status, tasks, reload } = useTasks()
  const { acceptTask } = useTaskActions()
  const { openTask } = useUI()
  const now = useNow()
  const read = useStoredSet(READ_REMINDERS_KEY)

  const requests = useMemo(() => getTaskRequests(tasks, now), [tasks, now])
  const reminders = useMemo(() => getActiveReminders(tasks, now), [tasks, now])
  const unreadReminders = reminders.filter((r) => !read.has(r.key))

  let content
  if (status === 'loading') {
    content = <div className="skeleton" style={{ height: 200 }} aria-busy="true" aria-label="Loading notifications" />
  } else if (status === 'error') {
    content = (
      <EmptyState
        icon={CircleAlert}
        title="We couldn’t load your notifications."
        action={
          <button type="button" className="btn btn--secondary" onClick={reload}>
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        }
      />
    )
  } else {
    content = (
      <>
        <section className="notif-section" aria-labelledby="requests-title">
          <h2 id="requests-title" className="notif-section__title">
            Task requests
            {requests.pending.length > 0 && <span className="notif-count">{requests.pending.length}</span>}
          </h2>
          {requests.pending.length + requests.accepted.length === 0 ? (
            <EmptyState icon={Inbox} compact title="No task requests">
              When someone gives you a task, it’ll show up here for you to accept.
            </EmptyState>
          ) : (
            <ul className="notif-list">
              {requests.pending.map((task) => (
                <RequestRow key={task.id} task={task} now={now} onAccept={acceptTask} onOpen={openTask} />
              ))}
              {requests.accepted.map((task) => (
                <RequestRow key={task.id} task={task} now={now} accepted onOpen={openTask} />
              ))}
            </ul>
          )}
        </section>

        <section className="notif-section" aria-labelledby="reminders-title">
          <div className="notif-section__head">
            <h2 id="reminders-title" className="notif-section__title">
              Reminders
              {unreadReminders.length > 0 && <span className="notif-count">{unreadReminders.length}</span>}
            </h2>
            {unreadReminders.length > 0 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => read.addAll(reminders.map((r) => r.key))}
              >
                Mark all as read
              </button>
            )}
          </div>
          {reminders.length === 0 ? (
            <EmptyState icon={Bell} compact title="No reminders right now">
              Reminders you set on your tasks will show up here.
            </EmptyState>
          ) : (
            <ul className="notif-list">
              {reminders.map(({ task, key }) => {
                const isRead = read.has(key)
                const overdue = isOverdue(task, now)
                return (
                  <li key={key} className="notif-row">
                    <span className="notif-row__icon" aria-hidden="true">
                      <Bell size={16} />
                    </span>
                    <div className="notif-row__body">
                      <button
                        type="button"
                        className="notif-row__task"
                        onClick={() => {
                          read.add(key)
                          openTask(task)
                        }}
                      >
                        {task.title}
                        {!isRead && <span className="visually-hidden"> (unread)</span>}
                      </button>
                      <p className={`notif-row__meta${overdue ? ' notif-row__meta--overdue' : ''}`}>
                        {overdue ? 'Overdue' : 'Due'} · {formatDateTime(task.dueAt, now)}
                      </p>
                    </div>
                    {!isRead && <span className="unread-dot" aria-hidden="true" />}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </>
    )
  }

  return (
    <main id="main" className="notifications" tabIndex={-1}>
      <header className="notifications__header">
        <button type="button" className="icon-btn" onClick={() => goBack('/')} aria-label="Back to Home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="notifications__title">Notifications</h1>
      </header>
      {content}
    </main>
  )
}

export default NotificationsPage
