import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { TasksContext } from './contexts.js'
import * as repository from '../data/taskRepository.js'

const initialState = { status: 'loading', tasks: [], error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'load-start':
      return { ...state, status: 'loading', error: null }
    case 'load-success':
      return { status: 'ready', tasks: action.tasks, error: null }
    case 'load-failure':
      return { ...state, status: 'error', error: action.error }
    case 'add':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'add-many': {
      const ids = new Set(action.tasks.map((t) => t.id))
      return { ...state, tasks: [...state.tasks.filter((t) => !ids.has(t.id)), ...action.tasks] }
    }
    case 'remove': {
      const ids = new Set(action.ids)
      return { ...state, tasks: state.tasks.filter((t) => !ids.has(t.id)) }
    }
    case 'patch': {
      const byId = new Map(action.patches.map((p) => [p.id, p]))
      return {
        ...state,
        tasks: state.tasks.map((t) => (byId.has(t.id) ? { ...t, ...byId.get(t.id) } : t)),
      }
    }
    default:
      return state
  }
}

export function TasksProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const load = useCallback(async () => {
    dispatch({ type: 'load-start' })
    try {
      dispatch({ type: 'load-success', tasks: await repository.fetchTasks() })
    } catch (error) {
      dispatch({ type: 'load-failure', error })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Updates tasks optimistically, then persists. If saving fails the change is
   * rolled back and the error is re-thrown so the caller can tell the user.
   */
  const patchTasks = useCallback(
    async (patches) => {
      const previous = patches.map(({ id }) => {
        const current = state.tasks.find((t) => t.id === id)
        return Object.fromEntries(Object.keys(patches.find((p) => p.id === id)).map((k) => [k, current?.[k]]))
      })
      dispatch({ type: 'patch', patches })
      try {
        await repository.updateTasks(patches)
      } catch (error) {
        dispatch({ type: 'patch', patches: previous })
        throw error
      }
      return previous
    },
    [state.tasks],
  )

  const setCompleted = useCallback(
    (id, done) =>
      patchTasks([
        { id, status: done ? 'done' : 'open', completedAt: done ? new Date().toISOString() : null },
      ]),
    [patchTasks],
  )

  const createTask = useCallback(async (fields) => {
    const task = await repository.createTask(fields)
    dispatch({ type: 'add', task })
    return task
  }, [])

  /** Removes tasks right away; puts them back if saving fails. Returns the removed records. */
  const deleteTasks = useCallback(
    async (ids) => {
      const removed = state.tasks.filter((t) => ids.includes(t.id))
      dispatch({ type: 'remove', ids })
      try {
        await repository.deleteTasks(ids)
      } catch (error) {
        dispatch({ type: 'add-many', tasks: removed })
        throw error
      }
      return removed
    },
    [state.tasks],
  )

  const restoreTasks = useCallback(async (records) => {
    dispatch({ type: 'add-many', tasks: records })
    await repository.restoreTasks(records)
  }, [])

  const resetDemoData = useCallback(async () => {
    dispatch({ type: 'load-success', tasks: await repository.resetDemoData() })
  }, [])

  const value = useMemo(
    () => ({ ...state, reload: load, setCompleted, patchTasks, createTask, deleteTasks, restoreTasks, resetDemoData }),
    [state, load, setCompleted, patchTasks, createTask, deleteTasks, restoreTasks, resetDemoData],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
