import { useMemo, useState } from 'react'
import { CircleAlert, ListChecks, RefreshCw, X } from 'lucide-react'
import EmptyState from '../../components/EmptyState.jsx'
import ByMeList from './ByMeList.jsx'
import DaySections from './DaySections.jsx'
import { spansDays } from './daySections.js'
import TodayBox from './TodayBox.jsx'
import HomeHeader from './HomeHeader.jsx'
import TaskComposer from './TaskComposer.jsx'
import TimelineCards from './TimelineCards.jsx'
import TimelineList from './TimelineList.jsx'
import { BOARD_FILTERS, SCOPES, getBoardColumns, matchesFilter } from '../../domain/selectors.js'
import { useNow } from '../../state/useNow.js'
import { useTasks, useUI } from '../../state/contexts.js'
import { useTaskActions } from '../../state/useTaskActions.js'
import './HomePage.css'

const SCOPE_KEY = 'tickler.scope'
const SWIPE_TIP_KEY = 'tickler.swipeTipSeen'
const FILTER_KEY = 'tickler.filter'

function readFlag(key) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function readScope() {
  try {
    const saved = localStorage.getItem(SCOPE_KEY)
    return SCOPES.some((s) => s.id === saved) ? saved : 'to-me'
  } catch {
    return 'to-me'
  }
}

function readFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY)
    return BOARD_FILTERS.some((f) => f.id === saved) ? saved : 'all'
  } catch {
    return 'all'
  }
}

function BoardSkeleton() {
  return (
    <div className="day-sections" aria-busy="true" aria-label="Loading your tasks">
      {[0, 1].map((i) => (
        <div key={i} className="day-section">
          <div className="skeleton" style={{ height: 14, width: 90 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
        </div>
      ))}
    </div>
  )
}

/**
 * The Home board (tasks from others, and tasks you gave others) or, with
 * `personal`, the My tasks board (tasks you made for yourself). Every board
 * reads as one page scrolling down through the days.
 */
function HomePage({ personal = false }) {
  const { status, tasks, reload } = useTasks()
  const { toggleComplete, toggleSubtask, rescheduleTasks } = useTaskActions()
  const { openTask } = useUI()
  const now = useNow()
  const [savedScope, setScopeState] = useState(readScope)
  const scope = personal ? 'mine' : savedScope
  const byMe = scope === 'by-me'
  const [tipSeen, setTipSeen] = useState(() => readFlag(SWIPE_TIP_KEY))
  const [filter, setFilterState] = useState(readFilter)

  const setFilter = (value) => {
    setFilterState(value)
    try {
      localStorage.setItem(FILTER_KEY, value)
    } catch {
      // Remembering the filter is a convenience only.
    }
  }

  const dismissTip = () => {
    setTipSeen(true)
    try {
      localStorage.setItem(SWIPE_TIP_KEY, '1')
    } catch {
      // The tip will just show again next time.
    }
  }

  // Finishing a task by swipe also retires the one-time tip.
  const onToggle = (task, done) => {
    if (!tipSeen) dismissTip()
    toggleComplete(task, done)
  }

  const setScope = (value) => {
    setScopeState(value)
    try {
      localStorage.setItem(SCOPE_KEY, value)
    } catch {
      // Remembering the filter is a convenience only.
    }
  }

  const columns = useMemo(
    () => getBoardColumns(filter === 'all' ? tasks : tasks.filter((t) => matchesFilter(t, filter, now)), now, scope),
    [tasks, now, scope, filter],
  )
  const filterLabel = BOARD_FILTERS.find((f) => f.id === filter)?.label
  const emptyText = filter === 'all' ? undefined : `Nothing in ${filterLabel}.`
  const ready = status === 'ready' && tasks.length > 0

  let board
  if (status === 'loading') {
    board = <BoardSkeleton />
  } else if (status === 'error') {
    board = (
      <div className="card">
        <EmptyState
          icon={CircleAlert}
          title="We couldn’t load your tasks."
          action={
            <button type="button" className="btn btn--secondary" onClick={reload}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          }
        >
          Check your connection and try again. Your tasks are safe.
        </EmptyState>
      </div>
    )
  } else if (tasks.length === 0) {
    board = (
      <div className="card">
        <EmptyState
          icon={ListChecks}
          tone="primary"
          title="Create your first task to get started."
        >
          Type it in the box below, like “Ask Karthik to buy milk at 6pm” or “Pay the school fees tomorrow”.
        </EmptyState>
      </div>
    )
  } else if (byMe) {
    board = <ByMeList columns={columns} now={now} onOpen={openTask} emptyText={emptyText} />
  } else {
    // To me reads as a feed of cards; My tasks stays as compact rows.
    const List = personal ? TimelineList : TimelineCards
    board = (
      <DaySections
        columns={columns}
        now={now}
        emptyText={emptyText ?? 'Nothing here yet.'}
      >
        {(column) => (
          <List
            tasks={column.tasks}
            now={now}
            showDay={spansDays(column)}
            onToggle={onToggle}
            onOpen={openTask}
            onToggleSubtask={toggleSubtask}
          />
        )}
      </DaySections>
    )
  }

  return (
    <main id="main" className={`home${personal ? ' home--personal' : ''}`} tabIndex={-1}>
      <HomeHeader
        now={now}
        scope={scope}
        onScopeChange={setScope}
        showControls={ready}
        personal={personal}
      />
      {ready && (
        <TodayBox
          tasks={tasks}
          now={now}
          onApply={(changes) => rescheduleTasks(changes).catch(() => {})}
          filter={filter}
          /* By me has no filtering, so it gets no filter control. */
          onFilterChange={byMe ? undefined : setFilter}
        />
      )}
      {ready && !byMe && !tipSeen && (
        <p className="swipe-tip">
          Swipe a task right to mark it done
          <button type="button" className="swipe-tip__close" onClick={dismissTip} aria-label="Dismiss tip">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}
      {board}
      {status === 'ready' && <TaskComposer now={now} personal={personal} />}
    </main>
  )
}

export default HomePage
