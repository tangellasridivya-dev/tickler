import { useCallback } from 'react'
import { useTasks, useToast } from './contexts.js'

/** Task actions with user feedback (toasts, undo, error messages) wired in. */
export function useTaskActions() {
  const { setCompleted, patchTasks } = useTasks()
  const toast = useToast()

  const toggleComplete = useCallback(
    async (task, done) => {
      try {
        await setCompleted(task.id, done)
        toast.show({
          message: done ? `Marked “${task.title}” as done` : `Moved “${task.title}” back to your list`,
          action: done
            ? { label: 'Undo', onClick: () => setCompleted(task.id, false).catch(() => {}) }
            : undefined,
        })
      } catch {
        toast.show({ tone: 'error', message: 'We couldn’t update that task. Please try again.' })
      }
    },
    [setCompleted, toast],
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

  return { toggleComplete, rescheduleTasks, acceptTask }
}
