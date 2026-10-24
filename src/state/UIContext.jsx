import { useCallback, useMemo, useState } from 'react'
import { UIContext } from './contexts.js'
import CreateTaskDialog from '../components/CreateTaskDialog.jsx'
import TaskDetailsDialog from '../components/TaskDetailsDialog.jsx'

/** App-wide dialogs (create task, task details) that any screen can open. */
export function UIProvider({ children }) {
  const [createPreset, setCreatePreset] = useState(null)
  const [detailsTaskId, setDetailsTaskId] = useState(null)

  const openCreate = useCallback((preset = {}) => setCreatePreset(preset), [])
  const openTask = useCallback((taskOrId) => setDetailsTaskId(taskOrId?.id ?? taskOrId), [])

  const value = useMemo(() => ({ openCreate, openTask }), [openCreate, openTask])

  return (
    <UIContext.Provider value={value}>
      {children}
      <CreateTaskDialog
        open={createPreset != null}
        preset={createPreset ?? {}}
        onClose={() => setCreatePreset(null)}
        onCreated={(task) => setDetailsTaskId(task.id)}
      />
      <TaskDetailsDialog taskId={detailsTaskId} onClose={() => setDetailsTaskId(null)} />
    </UIContext.Provider>
  )
}
