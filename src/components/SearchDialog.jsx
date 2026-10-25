import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import Avatar from './Avatar.jsx'
import { CURRENT_USER_ID, getPerson } from '../data/people.js'
import { searchTasks } from '../domain/selectors.js'
import { formatDateTime } from '../lib/dates.js'
import { useTasks, useUI } from '../state/contexts.js'
import './SearchDialog.css'

const MAX_RESULTS = 20

/** Who a task involves, for the line under its name in the results. */
function personLine(task) {
  if (task.createdBy !== CURRENT_USER_ID) return `From ${getPerson(task.createdBy).name}`
  if (task.assigneeId !== CURRENT_USER_ID) return `For ${getPerson(task.assigneeId).name}`
  return 'Your task'
}

/** Search across every task's name and notes. Opening a result opens the task. */
function SearchDialog({ open, onClose, now }) {
  const ref = useRef(null)
  const { tasks } = useTasks()
  const { openTask } = useUI()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchTasks(tasks, query).slice(0, MAX_RESULTS), [tasks, query])
  const typed = query.trim().length > 0

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) {
      dialog.close()
      setQuery('')
    }
  }, [open])

  const pick = (task) => {
    onClose()
    openTask(task)
  }

  return (
    <dialog
      ref={ref}
      className="search-dialog"
      aria-label="Search tasks"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="search-dialog__panel">
          <div className="search-dialog__field">
            <Search size={18} aria-hidden="true" />
            <input
              className="search-dialog__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks and notes…"
              aria-label="Search tasks and notes"
              autoFocus
              enterKeyHint="search"
            />
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {!typed ? (
            <p className="search-dialog__hint">Type a word from a task or its notes.</p>
          ) : results.length === 0 ? (
            <p className="search-dialog__hint">Nothing matches “{query.trim()}”.</p>
          ) : (
            <ul className="search-dialog__results">
              {results.map((task) => (
                <li key={task.id}>
                  <button type="button" className="search-result" onClick={() => pick(task)}>
                    <Avatar
                      personId={task.createdBy === CURRENT_USER_ID ? task.assigneeId : task.createdBy}
                      size={28}
                    />
                    <span className="search-result__text">
                      <span className={`search-result__title${task.status === 'done' ? ' is-done' : ''}`}>
                        {task.title}
                      </span>
                      <span className="search-result__meta">
                        {personLine(task)} · {formatDateTime(task.dueAt, now)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </dialog>
  )
}

export default SearchDialog
