import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, ListChecks, RefreshCw, X } from 'lucide-react'
import EmptyState from '../../components/EmptyState.jsx'
import ByMeList from './ByMeList.jsx'
import CategoryTabs from './CategoryTabs.jsx'
import DateBoard from './DateBoard.jsx'
import DateStrip from './DateStrip.jsx'
import SuggestionBanner from './SuggestionBanner.jsx'
import HomeHeader from './HomeHeader.jsx'
import TaskComposer from './TaskComposer.jsx'
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

// Distance between the starts of two neighbouring columns (width + gap).
function columnStep(el) {
  const cols = el.querySelectorAll('.board-col')
  if (cols.length > 1) return cols[1].offsetLeft - cols[0].offsetLeft
  return cols[0]?.offsetWidth || el.clientWidth
}

function BoardSkeleton() {
  return (
    <div className="board" aria-busy="true" aria-label="Loading your tasks">
      {[0, 1, 2].map((i) => (
        <div key={i} className="board-col">
          <div className="skeleton" style={{ height: 20, width: 120 }} />
          <div className="skeleton" style={{ height: 64 }} />
          <div className="skeleton" style={{ height: 64 }} />
        </div>
      ))}
    </div>
  )
}

/**
 * The Home board (tasks from others, and tasks you gave others) or, with
 * `personal`, the My tasks board (tasks you made for yourself).
 */
function HomePage({ personal = false }) {
  const { status, tasks, reload } = useTasks()
  const { toggleComplete, toggleSubtask, rescheduleTasks } = useTaskActions()
  const { openTask } = useUI()
  const now = useNow()
  const [savedScope, setScopeState] = useState(readScope)
  const scope = personal ? 'mine' : savedScope
  const byMe = scope === 'by-me'
  const boardRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })
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

  // Which days are on screen (one on phones, two or three on wider screens).
  // The first one is where a task typed without a day lands.
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(1)
  const visibleDay = columns[visibleIndex]?.date ?? null

  const updateEdges = useCallback(() => {
    const el = boardRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
    const step = columnStep(el)
    setVisibleIndex(step ? Math.round(el.scrollLeft / step) : 0)
    setVisibleCount(step ? Math.max(1, Math.round(el.clientWidth / step)) : 1)
  }, [])

  const jumpTo = (index) => {
    const el = boardRef.current
    const column = el?.querySelectorAll('.board-col')[index]
    if (column) el.scrollTo({ left: column.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  // Open on Today when the board first appears or the switch or filter
  // changes, not on every task update. If a filter leaves today empty, open on
  // the next day that has something (or the latest earlier one, for Overdue).
  const ready = status === 'ready' && tasks.length > 0
  const columnsRef = useRef(columns)
  // Runs before the effect below, so it always sees the latest columns.
  useEffect(() => {
    columnsRef.current = columns
  })
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const cols = columnsRef.current
    const todayIndex = cols.findIndex((c) => c.kind === 'today')
    let index = todayIndex
    if (filter !== 'all' && cols[todayIndex]?.tasks.length === 0) {
      const after = cols.findIndex((c, i) => i > todayIndex && c.tasks.length > 0)
      const before = cols.findLastIndex((c, i) => i < todayIndex && c.tasks.length > 0)
      index = after >= 0 ? after : before >= 0 ? before : todayIndex
    }
    const target = el.querySelectorAll('.board-col')[index]
    if (target) el.scrollLeft = target.offsetLeft - el.offsetLeft
    updateEdges()
  }, [ready, scope, filter, updateEdges])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges, columns, status])

  const scrollBoard = (direction) => {
    const el = boardRef.current
    if (!el) return
    el.scrollBy({ left: direction * columnStep(el), behavior: 'smooth' })
  }

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
    // By me is a plain vertical list grouped by day, without the sideways calendar.
    board = (
      <ByMeList
        columns={columns}
        now={now}
        onOpen={openTask}
        emptyText={filter === 'all' ? undefined : `Nothing in ${filterLabel}.`}
      />
    )
  } else {
    board = (
      <DateBoard
        ref={boardRef}
        columns={columns}
        now={now}
        onToggle={onToggle}
        onOpen={openTask}
        onToggleSubtask={toggleSubtask}
        onScroll={updateEdges}
        cards={scope === 'to-me'}
      />
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
        nav={
          !byMe && (
          <span className="board-nav">
            <button
              type="button"
              className="icon-btn"
              aria-label="Earlier dates"
              disabled={edges.start}
              onClick={() => scrollBoard(-1)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Later dates"
              disabled={edges.end}
              onClick={() => scrollBoard(1)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </span>
          )
        }
      />
      {ready && !byMe && (
        <DateStrip
          columns={columns}
          now={now}
          firstVisible={visibleIndex}
          visibleCount={visibleCount}
          onSelect={jumpTo}
        />
      )}
      {ready && !byMe && <CategoryTabs value={filter} onChange={setFilter} />}
      {ready && personal && (
        <SuggestionBanner tasks={tasks} now={now} onApply={(changes) => rescheduleTasks(changes).catch(() => {})} />
      )}
      {ready && scope !== 'by-me' && !tipSeen && (
        <p className="swipe-tip">
          Swipe a task right to mark it done
          <button type="button" className="swipe-tip__close" onClick={dismissTip} aria-label="Dismiss tip">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}
      {board}
      {status === 'ready' && <TaskComposer now={now} day={visibleDay} personal={personal} />}
    </main>
  )
}

export default HomePage
