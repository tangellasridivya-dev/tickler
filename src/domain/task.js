import { CURRENT_USER_ID } from '../data/people.js'

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
 *   acceptance: 'pending' | 'accepted',     // tasks from someone else start as a request
 *   acceptedAt: ISO string | null,
| 'in-progress',  // how far the assignee has got while open
| 'done',
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

export const ESTIMATES = [null, 10, 15, 30, 45, 60, 90, 120, 180]

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
    completedAt: null,
    createdAt: now,
    ...fields,
  }
}

export function priorityLabel(priority) {
  return PRIORITIES.find((p) => p.value === priority)?.label ?? 'Normal'
}

export function reminderLabel(reminder) {
  return REMINDERS.find((r) => r.value === reminder)?.label ?? 'No reminder'
}

export const PROGRESS = {
  pending: { label: 'Awaiting acceptance' },
  'not-started': { label: 'Not started' },
  'in-progress': { label: 'In progress' },
  done: { label: 'Done' },
}

/** Where a task stands: done once completed, waiting until accepted, otherwise what the assignee reported. */
export function getProgress(task) {
  if (task.status === 'done') return 'done'
  if (task.acceptance === 'pending') return 'pending'
  return task.progress === 'in-progress' ? 'in-progress' : 'not-started'
}
