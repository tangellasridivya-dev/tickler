import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { makeSubtask } from '../domain/task.js'
import './Subtasks.css'

const SUBTASK_MAX = 80
const MAX_SUBTASKS = 20

/** Add and remove a task's subtasks (used when creating or editing a task). */
function SubtaskEditor({ value, onChange, labelId }) {
  const [draft, setDraft] = useState('')
  const full = value.length >= MAX_SUBTASKS

  const add = () => {
    const title = draft.trim().slice(0, SUBTASK_MAX)
    if (!title || full) return
    onChange([...value, makeSubtask(title)])
    setDraft('')
  }

  return (
    <div className="subtask-editor">
      {value.length > 0 && (
        <ul className="subtask-editor__list" aria-labelledby={labelId}>
          {value.map((sub) => (
            <li key={sub.id} className={`subtask-editor__item${sub.done ? ' is-done' : ''}`}>
              <span className="subtask-editor__dot" aria-hidden="true" />
              <span className="subtask-editor__title">{sub.title}</span>
              <button
                type="button"
                className="icon-btn subtask-editor__remove"
                onClick={() => onChange(value.filter((s) => s.id !== sub.id))}
                aria-label={`Remove “${sub.title}”`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="subtask-editor__add">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the step instead of submitting the whole form.
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={full ? `Up to ${MAX_SUBTASKS} subtasks` : 'Add a subtask'}
          maxLength={SUBTASK_MAX}
          disabled={full}
          aria-labelledby={labelId}
        />
        <button
          type="button"
          className="btn btn--secondary subtask-editor__add-btn"
          onClick={add}
          disabled={!draft.trim() || full}
          aria-label="Add subtask"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default SubtaskEditor
