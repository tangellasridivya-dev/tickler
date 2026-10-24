import { useMemo, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import ScopeTabs from './ScopeTabs.jsx'
import MenuDrawer from '../../components/MenuDrawer.jsx'
import { getDaySummary, getTaskRequests } from '../../domain/selectors.js'
import { hrefFor } from '../../lib/router.js'
import { useTasks } from '../../state/contexts.js'

/** Bell that opens the Notifications page; the badge counts task requests waiting for you. */
function NotificationsLink({ now }) {
  const { tasks } = useTasks()
  const count = useMemo(() => getTaskRequests(tasks, now).pending.length, [tasks, now])

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

/** Top bar: menu on the left, To me / By me centred, day arrows and the bell on the right. */
function HomeHeader({ now, scope, onScopeChange, showControls, nav, personal }) {
  const { tasks } = useTasks()
  const [menuOpen, setMenuOpen] = useState(false)
  const mineCount = useMemo(() => getDaySummary(tasks, now, 'mine').remaining, [tasks, now])

  return (
    <header className="home-header">
      <div className="home-header__progress">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <MenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          path={personal ? '/mine' : '/'}
          mineCount={mineCount}
        />
      </div>
      <div className="home-header__center">
        {personal ? (
          <h1 className="home-header__title">My tasks</h1>
        ) : (
          showControls && <ScopeTabs value={scope} onChange={onScopeChange} />
        )}
      </div>
      <div className="home-header__actions">
        {showControls && nav}
        <NotificationsLink now={now} />
      </div>
    </header>
  )
}

export default HomeHeader
