// Pure functions that derive everything the UI shows from the task list.
// Nothing here touches React or storage, so it is easy to test.
import { CURRENT_USER_ID, firstName, getPerson } from '../data/people.js'
import { addDays, endOfDay, isSameDay, MINUTE, startOfDay } from '../lib/dates.js'
import { REMINDERS } from './task.js'
import { CATEGORIES, categoryOf } from './categories.js'

const due = (task) => new Date(task.dueAt).getTime()

/** The current user is responsible for completing this task. */
export const isMine = (task) => task.assigneeId === CURRENT_USER_ID
/** The current user asked someone else to do this task. */
export const isDelegated = (task) =>
  task.createdBy === CURRENT_USER_ID && task.assigneeId !== CURRENT_USER_ID
/**
 * Tasks someone else gives you start as requests (acceptance: 'pending') and only
 * become part of your day once you accept them. Tasks you make for yourself, and
 * older records without the field, count as accepted.
 */
export const isAccepted = (task) =>
  task.createdBy === task.assigneeId || (task.acceptance !== 'pending' && task.acceptance !== 'declined')
/** Your responsibility and accepted: what counts toward your day, board and reminders. */
export const isMyWork = (task) => isMine(task) && isAccepted(task)
export const isOpen = (task) => task.status === 'open'
export const isOverdue = (task, now) => isOpen(task) && due(task) < now.getTime()
export const isCompletedToday = (task, now) =>
  task.status === 'done' && task.completedAt != null && isSameDay(task.completedAt, now)

/**
 * Ownership from the current user's point of view.
 * kind: 'personal' | 'assigned-to-me' | 'delegated' | 'other'
 */
export function getOwnership(task) {
  if (isMine(task)) {
    if (task.createdBy === CURRENT_USER_ID) {
      return { kind: 'personal', label: 'Personal', description: 'You created this for yourself' }
    }
    const from = getPerson(task.createdBy)
    return {
      kind: 'assigned-to-me',
      label: `From ${firstName(from)}`,
      description: `${from.name} assigned this to you`,
    }
  }
  const to = getPerson(task.assigneeId)
  if (isDelegated(task)) {
    return {
      kind: 'delegated',
      label: `For ${firstName(to)}`,
      description: `You assigned this to ${to.name}`,
    }
  }
  return { kind: 'other', label: firstName(to), description: `${to.name} is responsible for this` }
}

const PRIORITY_RANK = { high: 0, normal: 1 }

/**
 * Order for the daily list:
 *   1. Overdue tasks (oldest first)
 *   2. High-priority tasks (soonest first)
 *   3. Everything else (soonest first)
 * Ties break on priority, then title, so the order is stable and predictable.
 */
export function compareForToday(now) {
  const group = (t) => (isOverdue(t, now) ? 0 : t.priority === 'high' ? 1 : 2)
  return (a, b) =>
    group(a) - group(b) ||
    due(a) - due(b) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.title.localeCompare(b.title)
}

/**
 * Metrics for "Your day". Only tasks the current user is responsible for count.
 *   remaining – open, due today or earlier (includes overdue)
 *   overdue   – open, due before now (a subset of remaining)
 *   completed – finished today, whenever they were due
 *   progress  – completed / (remaining + completed); null when nothing is planned
 * A task can only be open or done, so remaining and completed never overlap and
 * no task is counted twice in the progress total.
 */
export function getDaySummary(tasks, now, scope = null) {
  const todayEnd = endOfDay(now).getTime()
  let remaining = 0
  let overdue = 0
  let completed = 0
  for (const task of tasks) {
    if (!isMyWork(task)) continue
    // Optionally limit to one board ("to-me" or "mine") so the ring matches what's on screen.
    if (scope && !inScope(task, scope)) continue
    if (isOpen(task) && due(task) <= todayEnd) {
      remaining += 1
      if (isOverdue(task, now)) overdue += 1
    } else if (isCompletedToday(task, now)) {
      completed += 1
    }
  }
  const total = remaining + completed
  return { remaining, overdue, completed, total, progress: total === 0 ? null : completed / total }
}

export const UPCOMING_DAYS = 7

/**
 * Due-date overview for the current user's open tasks. The three buckets are
 * mutually exclusive: overdue (before now), due later today, upcoming (next 7 days).
 */
export function getDueOverview(tasks, now) {
  const nowMs = now.getTime()
  const todayEnd = endOfDay(now).getTime()
  const upcomingEnd = endOfDay(addDays(now, UPCOMING_DAYS)).getTime()
  const open = tasks.filter((t) => isMyWork(t) && isOpen(t))
  const overdue = open.filter((t) => due(t) < nowMs)
  const dueToday = open.filter((t) => due(t) >= nowMs && due(t) <= todayEnd)
  const upcoming = open.filter((t) => due(t) > todayEnd && due(t) <= upcomingEnd)
  const nextDeadline = open
    .filter((t) => due(t) >= nowMs)
    .sort((a, b) => due(a) - due(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0]
  return {
    overdue: overdue.length,
    dueToday: dueToday.length,
    upcoming: upcoming.length,
    nextDeadline: nextDeadline ?? null,
  }
}

/** Open tasks the current user must do, due today or earlier, in priority order. */
export function getTodayTasks(tasks, now) {
  const todayEnd = endOfDay(now).getTime()
  return tasks.filter((t) => isMyWork(t) && isOpen(t) && due(t) <= todayEnd).sort(compareForToday(now))
}

export function getCompletedToday(tasks, now) {
  return tasks
    .filter((t) => isMyWork(t) && isCompletedToday(t, now))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
}

/**
 * Tasks the user assigned to others that are relevant now: open ones due within
 * the upcoming window (or overdue), plus ones finished today so the user sees progress.
 */
export function getDelegatedTasks(tasks, now) {
  const upcomingEnd = endOfDay(addDays(now, UPCOMING_DAYS)).getTime()
  return tasks
    .filter(
      (t) => isDelegated(t) && ((isOpen(t) && due(t) <= upcomingEnd) || isCompletedToday(t, now)),
    )
    .sort((a, b) => (isOpen(b) - isOpen(a)) || due(a) - due(b))
}

/* ---------- Filtered task views (used by the Tasks page) ---------- */

export const TASK_FILTERS = [
  { id: 'today', label: 'Today', empty: 'Nothing due today.' },
  { id: 'overdue', label: 'Overdue', empty: 'Nothing overdue. You’re on track.' },
  { id: 'due-today', label: 'Due later today', empty: 'Nothing else due today.' },
  { id: 'upcoming', label: 'Upcoming', empty: 'Nothing due in the next 7 days.' },
  { id: 'completed-today', label: 'Done today', empty: 'Nothing finished yet today.' },
  { id: 'delegated', label: 'Assigned by you', empty: 'You haven’t assigned anything to others.' },
  { id: 'all', label: 'All my tasks', empty: 'You have no open tasks.' },
]

export function getFilterDefinition(id) {
  return TASK_FILTERS.find((f) => f.id === id) ?? TASK_FILTERS[0]
}

export function applyTaskFilter(tasks, filterId, now) {
  const nowMs = now.getTime()
  const todayEnd = endOfDay(now).getTime()
  const upcomingEnd = endOfDay(addDays(now, UPCOMING_DAYS)).getTime()
  const mineOpen = tasks.filter((t) => isMyWork(t) && isOpen(t))
  const byDue = (a, b) => due(a) - due(b)
  switch (filterId) {
    case 'overdue':
      return mineOpen.filter((t) => due(t) < nowMs).sort(byDue)
    case 'due-today':
      return mineOpen.filter((t) => due(t) >= nowMs && due(t) <= todayEnd).sort(compareForToday(now))
    case 'upcoming':
      return mineOpen.filter((t) => due(t) > todayEnd && due(t) <= upcomingEnd).sort(byDue)
    case 'completed-today':
      return getCompletedToday(tasks, now)
    case 'delegated':
      return tasks.filter(isDelegated).sort((a, b) => (isOpen(b) - isOpen(a)) || byDue(a, b))
    case 'all':
      return mineOpen.sort(byDue)
    case 'today':
    default:
      return getTodayTasks(tasks, now)
  }
}

export function searchTasks(tasks, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return tasks
    .filter((t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
    .sort((a, b) => (isOpen(b) - isOpen(a)) || due(a) - due(b))
}

/* ---------- Reminders ---------- */

export function getReminderTime(task) {
  const option = REMINDERS.find((r) => r.value === task.reminder)
  if (!option || option.offsetMinutes == null) return null
  return new Date(due(task) - option.offsetMinutes * MINUTE)
}

/** Reminders that have gone off for open tasks the user is responsible for, newest first. */
export function getActiveReminders(tasks, now) {
  return tasks
    .filter((t) => isMyWork(t) && isOpen(t))
    .map((task) => ({ task, at: getReminderTime(task) }))
    .filter((r) => r.at && r.at.getTime() <= now.getTime())
    .map((r) => ({ ...r, key: `${r.task.id}@${r.at.toISOString()}` }))
    .sort((a, b) => b.at - a.at)
}

/* ---------- Home board: scope filters and date columns ---------- */

/** A task you made for yourself (shown on the My tasks page, not on Home). */
export const isPersonal = (task) => task.createdBy === CURRENT_USER_ID && task.assigneeId === CURRENT_USER_ID

/**
 * Which tasks a board shows:
 *   to-me – tasks other people gave you that you've accepted (Home)
 *   by-me – tasks you gave other people (Home)
 *   mine  – tasks you made for yourself (My tasks page)
 */
export const SCOPES = [
  { id: 'to-me', label: 'To me' },
  { id: 'by-me', label: 'By me' },
]

export function inScope(task, scope) {
  if (scope === 'by-me') return isDelegated(task)
  if (scope === 'mine') return isPersonal(task)
  return isMyWork(task) && !isPersonal(task)
}

export const BOARD_DAYS = 7
export const PAST_DAYS = 7

/**
 * Splits tasks into date columns for the horizontally scrolling board, one per
 * day: the PAST_DAYS days before today, today, and BOARD_DAYS - 1 days after,
 * plus "later" for open tasks beyond that (only if there are any).
 * Past days work just like future ones: each shows the tasks due that day,
 * open (overdue) or done. Open tasks older than the first past day go into it,
 * so nothing unfinished ever drops off the board.
 * Within a column: open before done, then by due time, then high priority first.
 */
export function getBoardColumns(tasks, now, scope = 'to-me') {
  const days = Array.from({ length: PAST_DAYS + BOARD_DAYS }, (_, i) =>
    startOfDay(addDays(now, i - PAST_DAYS)),
  )
  const boardStart = days[0].getTime()
  const boardEnd = endOfDay(days[days.length - 1]).getTime()

  const later = []
  const byDay = days.map(() => [])

  for (const task of tasks) {
    if (!inScope(task, scope)) continue
    const dueMs = due(task)
    if (dueMs < boardStart) {
      if (isOpen(task)) byDay[0].push(task)
    } else if (dueMs > boardEnd) {
      if (isOpen(task)) later.push(task)
    } else {
      // Match by calendar date rather than dividing milliseconds, which breaks across DST changes.
      byDay[days.findIndex((d) => isSameDay(d, dueMs))].push(task)
    }
  }

  const order = (a, b) =>
    (isOpen(b) - isOpen(a)) ||
    due(a) - due(b) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.title.localeCompare(b.title)

  const column = (id, kind, date, list) => ({
    id,
    kind,
    date,
    tasks: list.sort(order),
    openCount: list.filter(isOpen).length,
  })

  const kindOf = (i) => (i < PAST_DAYS ? 'past' : i === PAST_DAYS ? 'today' : 'day')
  return [
    ...days.map((d, i) => column(`day-${i - PAST_DAYS}`, kindOf(i), d, byDay[i])),
    ...(later.length ? [column('later', 'later', null, later)] : []),
  ]
}

/* ---------- Task requests (notifications) ---------- */

/**
 * Tasks other people have given you, for the Notifications page: requests still
 * waiting for you to accept, then ones you accepted in the last week. Newest first.
 */
export function getTaskRequests(tasks, now) {
  const weekAgo = addDays(now, -7).getTime()
  const fromOthers = tasks.filter((t) => isMine(t) && t.createdBy !== CURRENT_USER_ID)
  const newest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  const pending = fromOthers.filter((t) => t.acceptance === 'pending' && isOpen(t)).sort(newest)
  const accepted = fromOthers
    .filter((t) => t.acceptedAt && new Date(t.acceptedAt).getTime() >= weekAgo)
    .sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt))
  return { pending, accepted }
}

/**
 * Every request from someone else — pending, accepted or declined — as a flat
 * timeline for the Task requests page, newest-sent first regardless of what
 * happened to it since (accepting or declining a task doesn't move it).
 */
export function getRequestTimeline(tasks) {
  const fromOthers = tasks.filter((t) => isMine(t) && t.createdBy !== CURRENT_USER_ID)
  return fromOthers
    .map((task) => {
      const status = task.acceptance === 'declined' ? 'declined' : task.acceptance === 'pending' ? 'pending' : 'accepted'
      return { task, status, at: new Date(task.createdAt) }
    })
    .sort((a, b) => b.at - a.at)
}

/* ---------- Board filters (All, categories, Overdue, Priority) ---------- */

export const BOARD_FILTERS = [
  { id: 'all', label: 'All' },
  ...CATEGORIES,
  { id: 'overdue', label: 'Overdue' },
  { id: 'priority', label: 'Priority' },
]

export function matchesFilter(task, filterId, now) {
  if (filterId === 'overdue') return isOverdue(task, now)
  if (filterId === 'priority') return task.priority === 'high'
  if (CATEGORIES.some((c) => c.id === filterId)) return categoryOf(task) === filterId
  return true
}
