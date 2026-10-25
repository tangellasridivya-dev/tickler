// Tickler's suggestion engine. It is deliberately rule-based and transparent:
// every suggestion is derived from the user's own task deadlines, time
// estimates, priorities and the time their day ends. It never changes tasks
// itself; it only proposes changes for the user to review and apply.
import { CURRENT_USER_ID } from '../data/people.js'
import { addDays, atTime, endOfDay, formatDuration, formatTime, minutesBetween } from '../lib/dates.js'
import { isMyWork, isOpen } from './selectors.js'

/** Where the user's working day ends. There are no settings yet, so this is a sensible default. */
export const DEFAULT_DAY_END_HOUR = 21

const PRIORITY_RANK = { normal: 0, high: 1 }
const weekdayName = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

/** Compact durations for the banner: "45m", "2h", "2h 50m". */
function shortDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * A task can be proposed for moving only if the user created it for themselves,
 * marked it flexible, and it isn't high priority. Tasks from other people and
 * firm deadlines are never proposed.
 */
export function isMovable(task) {
  return (
    task.flexible === true &&
    task.createdBy === CURRENT_USER_ID &&
    task.assigneeId === CURRENT_USER_ID &&
    task.priority !== 'high'
  )
}

/**
 * Checks whether the estimated work fits before each deadline.
 * Overdue tasks are treated as "do first": their time counts toward every
 * checkpoint, but they aren't checkpoints themselves (they're already late).
 * Deadlines after the end of the user's day are capped at the day's end.
 * Returns the earliest checkpoint where demand exceeds the time available, or null.
 */
export function findCrunch(tasks, now, dayEnd) {
  const nowMs = now.getTime()
  const effective = (t) => Math.min(new Date(t.dueAt).getTime(), dayEnd.getTime())
  const overdueMinutes = tasks
    .filter((t) => new Date(t.dueAt).getTime() < nowMs)
    .reduce((sum, t) => sum + t.estimateMinutes, 0)
  const checkpoints = tasks
    .filter((t) => new Date(t.dueAt).getTime() >= nowMs)
    .sort((a, b) => effective(a) - effective(b) || PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])

  for (const checkpoint of checkpoints) {
    const deadline = effective(checkpoint)
    const demand =
      overdueMinutes +
      checkpoints.filter((t) => effective(t) <= deadline).reduce((sum, t) => sum + t.estimateMinutes, 0)
    const capacity = Math.max(0, minutesBetween(now, deadline))
    if (demand > capacity) {
      return {
        task: checkpoint,
        deadline: new Date(deadline),
        cappedByDayEnd: deadline === dayEnd.getTime(),
        demand,
        capacity,
        shortfall: demand - capacity,
      }
    }
  }
  return null
}

/** Moves a task to the same time tomorrow (or tomorrow at 9:00 AM if it was already overdue). */
export function proposedDate(task, now) {
  const due = new Date(task.dueAt)
  if (due < now) return atTime(addDays(now, 1), 9)
  return addDays(due, 1)
}

/**
 * Returns a suggestion object or null when there's nothing worth suggesting.
 * {
 *   key,                        stable id used to remember "Not now"
 *   kind: 'reschedule' | 'heads-up',
 *   headline, action,           the two short lines shown on Home
 *   noticed, why, recommendation,   the full explanation
 *   changes: [{ task, from, to }],  proposed moves (reschedule only)
 *   atRiskTask,
 *   basis,                      how the suggestion was worked out
 * }
 */
export function buildSuggestion(tasks, now, { dayEndHour = DEFAULT_DAY_END_HOUR } = {}) {
  const dayEnd = atTime(now, dayEndHour)
  if (now >= dayEnd) return null

  const todayEnd = endOfDay(now).getTime()
  const todays = tasks.filter((t) => isMyWork(t) && isOpen(t) && new Date(t.dueAt).getTime() <= todayEnd)
  const estimated = todays.filter((t) => Number(t.estimateMinutes) > 0)
  const unestimated = todays.length - estimated.length
  if (estimated.length < 2) return null

  const crunch = findCrunch(estimated, now, dayEnd)
  if (!crunch) return null

  // Greedily move the least important flexible tasks that sit before the crunch
  // (moving later tasks wouldn't free time for it) until the work fits.
  let remaining = estimated
  let current = crunch
  const moved = []
  while (current) {
    const deadline = current.deadline.getTime()
    const candidate = remaining
      .filter((t) => isMovable(t) && t.id !== crunch.task.id)
      .filter((t) => Math.min(new Date(t.dueAt).getTime(), dayEnd.getTime()) <= deadline)
      .sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.estimateMinutes - a.estimateMinutes,
      )[0]
    if (!candidate) break
    moved.push(candidate)
    remaining = remaining.filter((t) => t.id !== candidate.id)
    current = findCrunch(remaining, now, dayEnd)
  }

  const atRisk = crunch.task
  const by = crunch.cappedByDayEnd ? `before your day ends at ${formatTime(dayEnd)}` : `by ${formatTime(crunch.deadline)}`
  const noticed = `You have about ${formatDuration(crunch.demand)} of tasks to finish ${by}, but only ${formatDuration(crunch.capacity)} left until then.`
  const why =
    atRisk.priority === 'high'
      ? `“${atRisk.title}” is high priority and may not get done in time.`
      : `“${atRisk.title}” may not get done in time.`
  const basis = [
    `Based on the time estimates of ${estimated.length} tasks due today and your day ending at ${formatTime(dayEnd)}.`,
    unestimated > 0 &&
      `${unestimated} ${unestimated === 1 ? 'task has' : 'tasks have'} no time estimate and ${unestimated === 1 ? 'isn’t' : 'aren’t'} counted.`,
    'Only flexible tasks you created yourself are ever suggested for moving. Nothing changes until you apply it.',
  ]
    .filter(Boolean)
    .join(' ')

  // The two lines the Home banner shows: what's wrong, then what would help.
  const shortBy = crunch.cappedByDayEnd ? `before ${formatTime(dayEnd)}` : `by ${formatTime(crunch.deadline)}`
  const headline = `Tight day: ${shortDuration(crunch.demand)} of tasks due ${shortBy}, only ${shortDuration(crunch.capacity)} left`

  if (moved.length === 0) {
    return {
      key: `${now.toDateString()}|heads-up|${atRisk.id}`,
      kind: 'heads-up',
      headline,
      action: `“${atRisk.title}” may slip. Start it soon or ask for help.`,
      noticed,
      why,
      recommendation:
        'None of the tasks before it are flexible, so Tickler won’t suggest moving them. It may help to start on it soon or ask someone for help.',
      changes: [],
      atRiskTask: atRisk,
      basis,
    }
  }

  const freed = moved.reduce((sum, t) => sum + t.estimateMinutes, 0)
  const what = moved.length === 1 ? `“${moved[0].title}”` : `${moved.length} flexible tasks`
  const changes = moved.map((task) => ({ task, from: new Date(task.dueAt), to: proposedDate(task, now) }))
  const toDay = weekdayName.format(changes[0].to)
  const action =
    moved.length === 1
      ? `Move ${what} (${shortDuration(freed)}, flexible) to ${toDay}?`
      : `Move ${what} (${shortDuration(freed)}) to ${toDay}?`
  return {
    key: `${now.toDateString()}|reschedule|${atRisk.id}|${moved.map((t) => t.id).sort().join(',')}`,
    kind: 'reschedule',
    headline,
    action,
    noticed,
    why,
    recommendation:
      `You could move ${what} to tomorrow to free up ${formatDuration(freed)}.` +
      (current ? ' Your day will still be tight, but this helps.' : ''),
    changes,
    atRiskTask: atRisk,
    basis,
  }
}

/* ---------- The one line under the progress bar ---------- */

// How Tickler addresses the person using it. One place to change it.
const ADDRESS = 'Ma’am'
const SHORT_TITLE = 34

const shortTitle = (task) =>
  task.title.length > SHORT_TITLE ? `${task.title.slice(0, SHORT_TITLE - 1).trimEnd()}…` : task.title

/**
 * A single line about where the day stands, picked by what matters most right
 * now: anything overdue first, then what's urgent and close, then a tight day,
 * then simply what's next. Returns null only while there is nothing to say.
 *
 * { key, text, tone: 'urgent' | 'good' | 'calm', changes? } — `changes` is set
 * only when the line proposes a move the user can apply.
 */
export function buildNudge(tasks, now, options) {
  const todayEnd = endOfDay(now).getTime()
  const open = tasks
    .filter((t) => isMyWork(t) && isOpen(t) && new Date(t.dueAt).getTime() <= todayEnd)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

  if (open.length === 0) {
    return { key: `${now.toDateString()}|free`, tone: 'good', text: `${ADDRESS}, you’re free today. Yay!` }
  }

  const overdue = open.filter((t) => new Date(t.dueAt) < now)
  const urgent = overdue.find((t) => t.priority === 'high') ?? overdue[0]
  if (urgent) {
    return {
      key: `${now.toDateString()}|overdue|${urgent.id}`,
      tone: 'urgent',
      text: `${ADDRESS}, “${shortTitle(urgent)}” was due at ${formatTime(urgent.dueAt)}. Please do it first.`,
    }
  }

  const ahead = open.filter((t) => new Date(t.dueAt) >= now)
  const important = ahead.find((t) => t.priority === 'high')
  if (important) {
    const left = minutesBetween(now, new Date(important.dueAt))
    // Close enough to need doing now, or far enough off to just keep clear.
    return left <= 120
      ? {
          key: `${now.toDateString()}|soon|${important.id}`,
          tone: 'urgent',
          text: `${ADDRESS}, please do “${shortTitle(important)}” first — only ${formatDuration(left)} left.`,
        }
      : {
          key: `${now.toDateString()}|important|${important.id}`,
          tone: 'calm',
          text: `${ADDRESS}, “${shortTitle(important)}” is important today. Keep ${formatTime(important.dueAt)} free.`,
        }
  }

  const crunch = buildSuggestion(tasks, now, options)
  if (crunch?.kind === 'reschedule') {
    return {
      key: crunch.key,
      tone: 'calm',
      text: `${ADDRESS}, it’s a tight day. Move “${shortTitle(crunch.changes[0].task)}” to tomorrow?`,
      changes: crunch.changes,
    }
  }

  const next = ahead[0]
  if (!next) return null
  return {
    key: `${now.toDateString()}|next|${next.id}`,
    tone: 'calm',
    text:
      open.length === 1
        ? `${ADDRESS}, just one left today — “${shortTitle(next)}” at ${formatTime(next.dueAt)}.`
        : `${ADDRESS}, ${open.length} tasks left. Next is “${shortTitle(next)}” at ${formatTime(next.dueAt)}.`,
  }
}
