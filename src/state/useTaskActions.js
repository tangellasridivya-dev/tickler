import { useCallback } from 'react'
import { useTasks, useToast } from './contexts.js'
import { makeSubtask, nextOccurrence } from '../domain/task.js'
import { addDays, atTime } from '../lib/dates.js'

const ERROR = 'We couldn’t update that task. Please try again.'

/** Same time tomorrow, or 9:00 AM tomorrow if it's already overdue. */
function tomorrowFor(task, now = new Date()) {
  const due = new Date(task.dueAt)
  return due < now ? atTime(addDays(now, 1), 9) : addDays(due, 1)
}

/** Task actions with user feedback (toasts, undo, error messages) wired in. */
export function useTaskActions() {
  const { tasks, setCompleted, patchTasks, createTask, deleteTasks, restoreTasks } = useTasks()
  const toast = useToast()

  /**
   * Marks a task done or not done. Finishing a repeating task also creates its
   * next occurrence; un-finishing it removes that occurrence again if untouched.
   */
  const toggleComplete = useCallback(
    async (task, done) => {
      try {
        await setCompleted(task.id, done)
        let spawned = null
        const nextDue = done && !task.spawnedId ? nextOccurrence(task) : null
        if (nextDue) {
          // The next round keeps the task's settings but starts fresh.
          const { title, notes, createdBy, assigneeId, reminder, priority, estimateMinutes, flexible, repeat, category } = task
          spawned = await createTask({
            title,
            notes,
            createdBy,
            assigneeId,
            reminder,
            priority,
            estimateMinutes,
            flexible,
            repeat,
            category,
            subtasks: (task.subtasks ?? []).map((s) => makeSubtask(s.title)),
            acceptance: 'accepted',
            dueAt: nextDue.toISOString(),
          })
          await patchTasks([{ id: task.id, spawnedId: spawned.id }])
        }
        if (!done && task.spawnedId) {
          const next = tasks.find((t) => t.id === task.spawnedId)
          if (next && next.status === 'open') await deleteTasks([next.id])
          await patchTasks([{ id: task.id, spawnedId: null }])
        }
        toast.show({
          message: done
            ? spawned
              ? `Done. Next one added for ${nextDue.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`
              : `Marked “${task.title}” as done`
            : `Moved “${task.title}” back to your list`,
          action: done
            ? {
                label: 'Undo',
                onClick: async () => {
                  try {
                    await setCompleted(task.id, false)
                    if (spawned) {
                      await deleteTasks([spawned.id])
                      await patchTasks([{ id: task.id, spawnedId: null }])
                    }
                  } catch {
                    toast.show({ tone: 'error', message: ERROR })
                  }
                },
              }
            : undefined,
        })
      } catch {
        toast.show({ tone: 'error', message: ERROR })
      }
    },
    [tasks, setCompleted, patchTasks, createTask, deleteTasks, toast],
  )

  /** changes: [{ task, to: Date }] */
  const rescheduleTasks = useCallback(
    async (changes) => {
      const previous = await patchTasks(changes.map((c) => ({ id: c.task.id, dueAt: c.to.toISOString() })))
      const count = changes.length
      toast.show({
        message: count === 1 ? `Moved “${changes[0].task.title}” to tomorrow` : `Moved ${count} tasks to tomorrow`,
        action: { label: 'Undo', onClick: () => patchTasks(previous).catch(() => {}) },
      })
    },
    [patchTasks, toast],
  )

  /** Moves one task to tomorrow (same time, or 9:00 AM if it's overdue). */
  const snoozeTask = useCallback(
    async (task) => {
      try {
        await rescheduleTasks([{ task, to: tomorrowFor(task) }])
      } catch {
        toast.show({ tone: 'error', message: ERROR })
      }
    },
    [rescheduleTasks, toast],
  )

  /** Saves edits to a task: { title, dueAt, priority, repeat, notes, category, subtasks }. */
  const updateTask = useCallback(
    async (task, changes) => {
      try {
        await patchTasks([{ id: task.id, ...changes }])
        toast.show({ message: 'Changes saved' })
        return true
      } catch {
        toast.show({ tone: 'error', message: 'We couldn’t save your changes. Please try again.' })
        return false
      }
    },
    [patchTasks, toast],
  )

  const deleteTask = useCallback(
    async (task) => {
      try {
        const removed = await deleteTasks([task.id])
        toast.show({
          message: `Deleted “${task.title}”`,
          action: { label: 'Undo', onClick: () => restoreTasks(removed).catch(() => {}) },
        })
      } catch {
        toast.show({ tone: 'error', message: 'We couldn’t delete that task. Please try again.' })
      }
    },
    [deleteTasks, restoreTasks, toast],
  )

  /** Ticks a subtask off (or back on). Quiet: the checkbox itself is the feedback. */
  const toggleSubtask = useCallback(
    async (task, subtaskId) => {
      const subtasks = (task.subtasks ?? []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s))
      try {
        await patchTasks([{ id: task.id, subtasks }])
      } catch {
        toast.show({ tone: 'error', message: ERROR })
      }
    },
    [patchTasks, toast],
  )

  /** Accepts a task someone gave you, so it joins your day. */
  const acceptTask = useCallback(
    async (task) => {
      try {
        await patchTasks([{ id: task.id, acceptance: 'accepted', acceptedAt: new Date().toISOString() }])
        toast.show({ message: `Added “${task.title}” to your tasks` })
      } catch {
        toast.show({ tone: 'error', message: 'We couldn’t accept that task. Please try again.' })
      }
    },
    [patchTasks, toast],
  )

  /** Declines a request; the person who sent it sees it as declined. */
  const declineTask = useCallback(
    async (task) => {
      try {
        const previous = await patchTasks([
          { id: task.id, acceptance: 'declined', declinedAt: new Date().toISOString() },
        ])
        toast.show({
          message: `Declined “${task.title}”`,
          action: { label: 'Undo', onClick: () => patchTasks(previous).catch(() => {}) },
        })
      } catch {
        toast.show({ tone: 'error', message: 'We couldn’t decline that task. Please try again.' })
      }
    },
    [patchTasks, toast],
  )

  return {
    toggleComplete,
    toggleSubtask,
    rescheduleTasks,
    snoozeTask,
    updateTask,
    deleteTask,
    acceptTask,
    declineTask,
  }
}
