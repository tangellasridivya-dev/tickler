import { useMemo, useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { buildSuggestion } from '../../domain/suggestions.js'

const DISMISSED_KEY = 'tickler.dismissedSuggestions'

function readDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

/**
 * Tickler's suggestion in two crisp lines: what's wrong, then what would help.
 * Nothing moves unless the user taps "Move" (with undo); × hides this
 * particular suggestion for good.
 */
function SuggestionBanner({ tasks, now, onApply }) {
  const [dismissed, setDismissed] = useState(readDismissed)
  const suggestion = useMemo(() => buildSuggestion(tasks, now), [tasks, now])
  if (!suggestion || dismissed.has(suggestion.key)) return null

  const dismiss = () => {
    const next = new Set([...dismissed, suggestion.key])
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next].slice(-100)))
    } catch {
      // Hidden for this visit only.
    }
  }

  return (
    <aside className="suggestion-banner" aria-label="Tickler’s suggestion">
      <button type="button" className="icon-btn suggestion-banner__close" onClick={dismiss} aria-label="Dismiss suggestion">
        <X size={14} aria-hidden="true" />
      </button>
      <span className="suggestion-banner__icon" aria-hidden="true">
        <Lightbulb size={16} />
      </span>
      <div className="suggestion-banner__body">
        <p className="suggestion-banner__headline">{suggestion.headline}</p>
        <p className="suggestion-banner__action">{suggestion.action}</p>
      </div>
      {suggestion.kind === 'reschedule' && (
        <button
          type="button"
          className="suggestion-banner__move"
          onClick={() => {
            onApply(suggestion.changes)
            dismiss()
          }}
        >
          Move it
        </button>
      )}
    </aside>
  )
}

export default SuggestionBanner
