import { useMemo, useState } from 'react'
import { Inbox, PanelLeft, Search } from 'lucide-react'
import ScopeTabs from './ScopeTabs.jsx'
import MenuDrawer from '../../components/MenuDrawer.jsx'
import SearchDialog from '../../components/SearchDialog.jsx'
import { getDaySummary, getTaskRequests } from '../../domain/selectors.js'
import { hrefFor } from '../../lib/router.js'
import { useTasks } from '../../state/contexts.js'

/** Opens the Task requests page; the badge counts the ones waiting for you. */
function RequestsLink({ now }) {
  const { tasks } = useTasks()
  const count = useMemo(() => getTaskRequests(tasks, now).pending.length, [tasks, now])

  return (
    <a
      className="icon-btn"
      href={hrefFor('/notifications')}
      aria-label={count ? `Task requests, ${count} waiting` : 'Task requests'}
      title="Task requests"
    >
      <Inbox size={20} aria-hidden="true" />
      {count > 0 && (
        <span className="badge" aria-hidden="true">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </a>
  )
}

/** Top bar: menu on the left, To me / By me centred, search and requests on the right. */
function HomeHeader({ now, scope, onScopeChange, showControls, personal }) {
  const { tasks } = useTasks()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
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
          <PanelLeft size={20} aria-hidden="true" />
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
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSearchOpen(true)}
          aria-label="Search tasks"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
        >
          <Search size={20} aria-hidden="true" />
        </button>
        <RequestsLink now={now} />
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} now={now} />
      </div>
    </header>
  )
}

export default HomeHeader
