import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { getDaySummary } from '../../domain/selectors.js'
import { buildNudge } from '../../domain/suggestions.js'
import { currentStreak } from '../../lib/streak.js'
import './TodayBox.css'

/**
 * Today in one strip: a bar filling left to right with the count small beside
 * it, and under that a single line on where the day stands — what's overdue,
 * what's urgent and close, or that there's nothing left at all. Only the line
 * that proposes a move carries a button, and nothing moves until it's tapped.
 */
function TodayBox({ tasks, now, onApply }) {
  const summary = useMemo(() => getDaySummary(tasks, now), [tasks, now])
  const nudge = useMemo(() => buildNudge(tasks, now), [tasks, now])
  const streak = useMemo(() => currentStreak(now), [now])
  const { completed, total } = summary
  if (total === 0 && !nudge) return null

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const complete = total > 0 && completed === total

  return (
    <aside className={`today-box${complete ? ' is-complete' : ''}`} aria-label="Today at a glance">
      {total > 0 && (
        <div className="today-box__row">
          <div
            className="today-box__track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completed} of ${total} tasks done today`}
          >
            <span className="today-box__fill" style={{ width: `${percent}%` }} aria-hidden="true" />
          </div>
          <span className="today-box__count">
            {completed}/{total}
          </span>
          {streak > 1 && (
            <span className="today-box__streak" title={`${streak} days in a row`}>
              <Flame size={11} aria-hidden="true" />
              {streak}
              <span className="visually-hidden"> days in a row</span>
            </span>
          )}
        </div>
      )}

      {nudge && (
        <p className={`today-box__nudge today-box__nudge--${nudge.tone}`}>
          {nudge.text}
          {nudge.changes && (
            <button type="button" className="today-box__move" onClick={() => onApply(nudge.changes)}>
              Move it
            </button>
          )}
        </p>
      )}
    </aside>
  )
}

export default TodayBox
