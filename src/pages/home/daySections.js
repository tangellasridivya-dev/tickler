// Helpers behind DaySections.jsx, kept in their own module so the component
// file only exports a component (and fast refresh keeps working).
import { isOpen } from '../../domain/selectors.js'
import { isSameDay } from '../../lib/dates.js'

const weekdayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const dateLabel = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** "Today", "Tomorrow", "Yesterday", or the weekday. */
export function sectionTitle(column, now) {
  if (column.kind === 'later') return 'Later'
  const days = Math.round(
    (new Date(column.date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000,
  )
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return weekdayLabel.format(column.date)
}

/** The date beside the heading — "26 Oct". "Later" spans days, so it has none. */
export function sectionDate(column) {
  return column.kind === 'later' ? null : dateLabel.format(column.date)
}

/**
 * Which day sections to show: today and every later day that has tasks, plus
 * earlier days only if something there is still unfinished. Empty days are skipped.
 */
export function visibleSections(columns) {
  return columns
    .map((column) => (column.kind === 'past' ? { ...column, tasks: column.tasks.filter(isOpen) } : column))
    .filter((column) => column.tasks.length > 0)
}

/** True for the columns that can hold more than one date ("Later", and the oldest past day). */
export function spansDays(column) {
  return column.kind === 'later' || column.tasks.some((t) => !isSameDay(t.dueAt, column.date))
}
