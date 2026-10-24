import { Check, ChevronDown, ListChecks } from 'lucide-react'
import { subtaskCount } from '../domain/task.js'
import './Subtasks.css'

/** Small "1/3" pill shown on rows that have subtasks; tap it to show or hide them. */
export function SubtaskToggle({ task, open, onToggle, listId }) {
  const { done, total } = subtaskCount(task)
  if (total === 0) return null
  return (
    <button
      type="button"
      className={`subtask-toggle${open ? ' is-open' : ''}${done === total ? ' is-complete' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={listId}
      aria-label={`${done} of ${total} subtasks done. ${open ? 'Hide' : 'Show'} subtasks`}
    >
      <ListChecks size={12} aria-hidden="true" />
      {done}/{total}
      <ChevronDown size={11} className="subtask-toggle__chevron" aria-hidden="true" />
    </button>
  )
}

/**
 * The subtasks under a row. The person doing the task can tick them off;
 * everyone else (By me) sees them read-only.
 */
export function SubtaskList({ task, id, onToggleSubtask, className = '' }) {
  const editable = Boolean(onToggleSubtask)
  return (
    <ul id={id} className={`subtasks ${className}`} aria-label={`Subtasks of “${task.title}”`}>
      {task.subtasks.map((sub) => (
        <li key={sub.id} className={`subtask${sub.done ? ' is-done' : ''}`}>
          {editable ? (
            <label className="subtask__check">
              <input type="checkbox" checked={sub.done} onChange={() => onToggleSubtask(task, sub.id)} />
              <span className="subtask__box" aria-hidden="true">
                {sub.done && <Check size={10} strokeWidth={3} />}
              </span>
              <span className="subtask__title">{sub.title}</span>
            </label>
          ) : (
            <span className="subtask__check">
              <span className="subtask__box" aria-hidden="true">
                {sub.done && <Check size={10} strokeWidth={3} />}
              </span>
              <span className="subtask__title">
                {sub.title}
                <span className="visually-hidden">{sub.done ? ' (done)' : ' (not done)'}</span>
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
