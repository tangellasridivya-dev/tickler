export const MINUTE = 60 * 1000

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function atTime(date, hours, minutes = 0) {
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function isSameDay(a, b) {
  const x = new Date(a)
  const y = new Date(b)
  return (
    x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
  )
}

export function minutesBetween(from, to) {
  return Math.round((new Date(to) - new Date(from)) / MINUTE)
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const longDateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const shortDateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export function formatTime(date) {
  return timeFormat.format(new Date(date))
}

export function formatLongDate(date) {
  return longDateFormat.format(new Date(date))
}

/** "Today", "Yesterday", a day name within a week ("Sunday"), or "Thu, 30 Oct". */
export function formatRelativeDay(date, now) {
  const d = startOfDay(date)
  const today = startOfDay(now)
  const diff = Math.round((d - today) / (24 * 60 * MINUTE))
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff >= 1 && diff < 7) return weekdayFormat.format(d)
  return shortDateFormat.format(d)
}

/** "Today, 3:00 PM" style label. */
export function formatDateTime(date, now) {
  return `${formatRelativeDay(date, now)}, ${formatTime(date)}`
}

/** "45 min", "2 hr", "1 hr 30 min". */
export function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function greetingFor(date) {
  const hour = new Date(date).getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const pad = (n) => String(n).padStart(2, '0')

/** Value for <input type="date"> in local time. */
export function toDateInputValue(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Value for <input type="time"> in local time. */
export function toTimeInputValue(date) {
  const d = new Date(date)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Combines date and time input values into a local Date, or null if invalid. */
export function fromDateTimeInputs(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null
  const [y, mo, d] = dateValue.split('-').map(Number)
  const [h, mi] = timeValue.split(':').map(Number)
  const result = new Date(y, mo - 1, d, h, mi, 0, 0)
  return Number.isNaN(result.getTime()) ? null : result
}

const shortWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const shortMonth = new Intl.DateTimeFormat('en-US', { month: 'short' })

/** "Sat, Oct 24th" */
export function formatShortDate(date) {
  const d = new Date(date)
  const day = d.getDate()
  const suffix =
    day % 100 >= 11 && day % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th'
  return `${shortWeekday.format(d)}, ${shortMonth.format(d)} ${day}${suffix}`
}

/** "Just now", "25 min ago", "3 hr ago", "Yesterday", then "Thu, 30 Oct". */
export function formatTimeAgo(date, now) {
  const minutes = Math.floor((new Date(now) - new Date(date)) / MINUTE)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (isSameDay(date, now)) return `${Math.floor(minutes / 60)} hr ago`
  if (isSameDay(date, addDays(now, -1))) return 'Yesterday'
  return shortDateFormat.format(new Date(date))
}

/** How far away a due time is: "in 45 min", "in 3 hr", "in 2 days", or "1 hr overdue". */
export function formatDueIn(date, now) {
  const minutes = Math.round((new Date(date) - new Date(now)) / MINUTE)
  const span = Math.abs(minutes)
  const text =
    span < 60 ? `${Math.max(1, span)} min` : span < 24 * 60 ? `${Math.round(span / 60)} hr` : `${Math.round(span / (24 * 60))} days`
  return minutes >= 0 ? `in ${text.replace(/^1 days$/, '1 day')}` : `${text.replace(/^1 days$/, '1 day')} overdue`
}
