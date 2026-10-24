import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, ListChecks, Plus, RefreshCw } from 'lucide-react'
import EmptyState from '../../components/EmptyState.jsx'
import DateBoard from './DateBoard.jsx'
import HomeHeader from './HomeHeader.jsx'
import { SCOPES, getBoardColumns, getDaySummary } from '../../domain/selectors.js'
import { useNow } from '../../state/useNow.js'
import { useTasks, useUI } from '../../state/contexts.js'
import { useTaskActions } from '../../state/useTaskActions.js'
import './HomePage.css'

const SCOPE_KEY = 'tickler.scope'

function readScope() {
  try {
    const saved = localStorage.getItem(SCOPE_KEY)
    return SCOPES.some((s) => s.id === saved) ? saved : 'to-me'
  } catch {
    return 'to-me'
  }
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

function HomePage() {
  const { status, tasks, reload } = useTasks()
  const { toggleComplete } = useTaskActions()
  const { openCreate, openTask } = useUI()
  const now = useNow()
  const [scope, setScopeState] = useState(readScope)
  const boardRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const setScope = (value) => {
    setScopeState(value)
    try {
      localStorage.setItem(SCOPE_KEY, value)
    } catch {
      // Remembering the filter is a convenience only.
    }
  }

  const columns = useMemo(() => getBoardColumns(tasks, now, scope), [tasks, now, scope])
  const summary = useMemo(() => getDaySummary(tasks, now), [tasks, now])

  const updateEdges = useCallback(() => {
    const el = boardRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
  }, [])

  // Open on Today (overdue sits one step to the left) when the board first
  // appears or the To me / By me switch changes, not on every task update.
  const ready = status === 'ready' && tasks.length > 0
  useEffect(() => {
    const el = boardRef.current
    const today = el?.querySelector('.board-col--today')
    if (today) el.scrollLeft = today.offsetLeft - el.offsetLeft
    updateEdges()
  }, [ready, scope, updateEdges])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges, columns, status])

  const scrollBoard = (direction) => {
    const el = boardRef.current
    const column = el?.querySelector('.board-col')
    if (!column) return
    const step = column.getBoundingClientRect().width
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const addTask = (date) => openCreate({ date })

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
          action={
            <button type="button" className="btn btn--primary" onClick={() => openCreate()}>
              <Plus size={16} aria-hidden="true" />
              Add a task
            </button>
          }
        >
          Add something you need to do, or give a task to someone in your household.
        </EmptyState>
      </div>
    )
  } else {
    board = (
      <DateBoard
        ref={boardRef}
        columns={columns}
        scope={scope}
        now={now}
        onToggle={toggleComplete}
        onOpen={openTask}
        onAdd={addTask}
        onScroll={updateEdges}
      />
    )
  }

  return (
    <main id="main" className="home" tabIndex={-1}>
      <HomeHeader
        now={now}
        summary={summary}
        scope={scope}
        onScopeChange={setScope}
        showControls={ready}
        nav={
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
        }
      />
      {board}
    </main>
  )
}

export default HomePage
