import { useMemo, useState } from 'react'
import { Flame, Lightbulb, X } from 'lucide-react'
import { getDaySummary } from '../../domain/selectors.js'
import { buildSuggestion } from '../../domain/suggestions.js'
import { currentStreak } from '../../lib/streak.js'
import { DateJump, FilterMenu } from './BoardTools.jsx'
import './TodayBox.css'

const DISMISSED_KEY = 'tickler.dismissedSuggestions'
// Past this many, one pip per task gets too fine to read, so it becomes a bar.
const MAX_PIPS = 12

function readDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

/** Two or three words on where the day stands — short enough to read at a glance. */
function standing(done, total) {
  if (done === total) return 'All done'
  if (done === 0) return 'Let’s go'
  const left = total - done
  if (left === 1) return 'One left'
  if (done / total >= 0.5) return 'Nearly there'
  return 'Good start'
}

/**
 * Today in one strip: a pip per task so progress is something you watch fill,
 * the count kept to "4/10", the day streak when there is one, and Tickler's
 * suggestion underneath. Nothing moves unless the user taps "Move it" (with
 * undo); × hides that suggestion for good, leaving the progress behind.
 */
function TodayBox({ tasks, now, onApply, filter, onFilterChange }) {
  const [dismissed, setDismissed] = useState(readDismissed)
  const suggestion = useMemo(() => buildSuggestion(tasks, now), [tasks, now])
  const summary = useMemo(() => getDaySummary(tasks, now), [tasks, now])
  const streak = useMemo(() => currentStreak(now), [now])
  const showTip = suggestion && !dismissed.has(suggestion.key)
  // The box is also where the board's controls live, so it stays even on a day
  // with nothing due — otherwise the filter would have nowhere to sit.
  if (summary.total === 0 && !showTip && !onFilterChange) return null

  const dismiss = () => {
    const next = new Set([...dismissed, suggestion.key])
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next].slice(-100)))
    } catch {
      // Hidden for this visit only.
    }
  }

  const { completed, total } = summary
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const complete = total > 0 && completed === total

  return (
    <aside className={`today-box${complete ? ' is-complete' : ''}`} aria-label="Today at a glance">
      <div className="today-box__top">
        <span className="today-box__day">Today</span>
        <span className="today-box__tools">
          {onFilterChange && <FilterMenu value={filter} onChange={onFilterChange} />}
          <DateJump now={now} />
        </span>
      </div>

      {total > 0 && (
        <div className="today-box__progress">
          <div className="today-box__head">
            <span className="today-box__count">
              {completed}/{total}
            </span>
            <span className="today-box__standing">{standing(completed, total)}</span>
            {streak > 1 && (
              <span className="today-box__streak" title={`${streak} days in a row`}>
                <Flame size={12} aria-hidden="true" />
                {streak}
                <span className="visually-hidden"> days in a row</span>
              </span>
            )}
          </div>

          <div
            className="today-box__track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completed} of ${total} tasks done today`}
          >
            {total <= MAX_PIPS ? (
              Array.from({ length: total }, (_, i) => (
                <span key={i} className={`today-box__pip${i < completed ? ' is-done' : ''}`} aria-hidden="true" />
              ))
            ) : (
              <span className="today-box__fill" style={{ width: `${percent}%` }} aria-hidden="true" />
            )}
          </div>
        </div>
      )}

      {showTip && (
        <div className="today-box__tip">
          <span className="today-box__icon" aria-hidden="true">
            <Lightbulb size={15} />
          </span>
          <div className="today-box__body">
            <p className="today-box__headline">{suggestion.headline}</p>
            <p className="today-box__action">{suggestion.action}</p>
            {suggestion.kind === 'reschedule' && (
              <button
                type="button"
                className="today-box__move"
                onClick={() => {
                  onApply(suggestion.changes)
                  dismiss()
                }}
              >
                Move it
              </button>
            )}
          </div>
          <button type="button" className="icon-btn today-box__close" onClick={dismiss} aria-label="Dismiss suggestion">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  )
}

export default TodayBox
