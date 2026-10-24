import { CURRENT_USER_ID } from '../data/people.js'
import { categorize } from './categories.js'

/**
 * Task record shape (stored as plain JSON):
 * {
 *   id: string,
 *   title: string,
 *   notes: string,
 *   createdBy: personId,          // who created / assigned the task
 *   assigneeId: personId,         // who is responsible for completing it
 *   dueAt: ISO string,
 *   reminder: 'none' | 'at-time' | '15m' | '1h' | '1d',
 *   priority: 'normal' | 'high',
 *   estimateMinutes: number | null,
 *   flexible: boolean,            // true = may be suggested for rescheduling
 *   status: 'open' | 'done',
 *   progress: 'not-started' | 'in-progress',  // how far the assignee has got while open
 *   acceptance: 'pending' | 'accepted' | 'declined', // tasks from someone else start as a request
 *   repeat: 'none' | 'daily' | 'weekly' | 'monthly',
 *   category: 'reminders' | 'shopping' | 'work' | 'bills',
 *   subtasks: [{ id, title, done }], // smaller steps; ticked off by the assignee
 *   acceptedAt: ISO string | null,
 *   completedAt: ISO string | null,
 *   createdAt: ISO string,
 * }
 */

export const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]

/** Older records used none / low / medium; everything that isn't high is now normal. */
export const normalizePriority = (priority) => (priority === 'high' ? 'high' : 'normal')

export const REMINDERS = [
  { value: 'none', label: 'No reminder', offsetMinutes: null },
  { value: 'at-time', label: 'At due time', offsetMinutes: 0 },
  { value: '15m', label: '15 minutes before', offsetMinutes: 15 },
  { value: '1h', label: '1 hour before', offsetMinutes: 60 },
  { value: '1d', label: '1 day before', offsetMinutes: 24 * 60 },
]


function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function makeTask(fields) {
  const now = new Date().toISOString()
  return {
    id: newId(),
    title: '',
    notes: '',
    createdBy: CURRENT_USER_ID,
    assigneeId: CURRENT_USER_ID,
    dueAt: now,
    reminder: 'none',
    priority: 'normal',
    estimateMinutes: null,
    flexible: false,
    status: 'open',
    progress: 'not-started',
    acceptance: 'accepted',
    acceptedAt: null,
    repeat: 'none',
    completedAt: null,
    createdAt: now,
    subtasks: [],
    ...fields,
    category: fields.category ?? categorize(fields.title),
  }
}

export function makeSubtask(title, done = false) {
  return { id: newId(), title, done }
}

/** { done, total } for a task's subtasks (total 0 when it has none). */
export function subtaskCount(task) {
  const list = task.subtasks ?? []
  return { done: list.filter((s) => s.done).length, total: list.length }
}

export function priorityLabel(priority) {
  return PRIORITIES.find((p) => p.value === priority)?.label ?? 'Normal'
}

export function reminderLabel(reminder) {
  return REMINDERS.find((r) => r.value === reminder)?.label ?? 'No reminder'
}

export const PROGRESS = {
  pending: { label: 'Awaiting acceptance' },
  declined: { label: 'Declined' },
  'not-started': { label: 'Not started' },
  'in-progress': { label: 'In progress' },
  done: { label: 'Done' },
}

/** Where a task stands: done once completed, waiting until accepted, otherwise what the assignee reported. */
export function getProgress(task) {
  if (task.status === 'done') return 'done'
  if (task.acceptance === 'declined') return 'declined'
  if (task.acceptance === 'pending') return 'pending'
  return task.progress === 'in-progress' ? 'in-progress' : 'not-started'
}

export const REPEATS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
]

export function repeatLabel(repeat) {
  return REPEATS.find((r) => r.value === repeat)?.label ?? 'Does not repeat'
}

/** The next due date for a repeating task, or null if it doesn't repeat. */
export function nextOccurrence(task) {
  const due = new Date(task.dueAt)
  if (task.repeat === 'daily') due.setDate(due.getDate() + 1)
  else if (task.repeat === 'weekly') due.setDate(due.getDate() + 7)
  else if (task.repeat === 'monthly') {
    // Same day next month, clamped so the 31st becomes the 30th (or 28th/29th), not the 1st.
    const day = due.getDate()
    due.setDate(1)
    due.setMonth(due.getMonth() + 1)
    const lastDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate()
    due.setDate(Math.min(day, lastDay))
  } else return null
  return due
}
