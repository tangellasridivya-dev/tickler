import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import ScopeTabs from './ScopeTabs.jsx'
import { getActiveReminders, getTaskRequests } from '../../domain/selectors.js'
import { hrefFor } from '../../lib/router.js'
import { READ_REMINDERS_KEY, useStoredSet } from '../../lib/useStoredSet.js'
import { useTasks } from '../../state/contexts.js'

const RING_SIZE = 34
const RING_STROKE = 3

/** Today's progress as a ring with the percentage inside. */
function ProgressRing({ summary }) {
  const { completed, total, progress } = summary
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const percent = progress == null ? null : Math.round(progress * 100)
  const label =
    percent == null ? 'Nothing due today' : `${completed} of ${total} tasks done today, ${percent} percent`

  return (
    <span className="progress-ring" role="img" aria-label={label} title={label}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
        <circle className="progress-ring__track" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} strokeWidth={RING_STROKE} />
        {percent != null && (
          <circle
            className="progress-ring__value"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            strokeWidth={RING_STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        )}
      </svg>
      <span className="progress-ring__text" aria-hidden="true">
        {percent == null ? '–' : `${percent}%`}
      </span>
    </span>
  )
}

/** Bell that opens the Notifications page; the badge counts new requests and unread reminders. */
function NotificationsLink({ now }) {
  const { tasks } = useTasks()
  const read = useStoredSet(READ_REMINDERS_KEY)
  const count = useMemo(() => {
    const requests = getTaskRequests(tasks, now).pending.length
    const reminders = getActiveReminders(tasks, now).filter((r) => !read.has(r.key)).length
    return requests + reminders
  }, [tasks, now, read])

  return (
    <a
      className="icon-btn"
      href={hrefFor('/notifications')}
      aria-label={count ? `Notifications, ${count} new` : 'Notifications'}
      title="Notifications"
    >
      <Bell size={20} aria-hidden="true" />
      {count > 0 && (
        <span className="badge" aria-hidden="true">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </a>
  )
}

/** Top bar: today's progress ring, the To me / By me switch, day arrows and the bell. */
function HomeHeader({ now, summary, scope, onScopeChange, showControls, nav }) {
  return (
    <header className="home-header">
      <ProgressRing summary={summary} />
      {showControls && <ScopeTabs value={scope} onChange={onScopeChange} />}
      <div className="home-header__actions">
        {showControls && nav}
        <NotificationsLink now={now} />
      </div>
    </header>
  )
}

export default HomeHeader
