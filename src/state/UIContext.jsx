import { useCallback, useMemo, useState } from 'react'
import { UIContext } from './contexts.js'
import TaskDetailsDialog from '../components/TaskDetailsDialog.jsx'

/** App-wide UI any screen can open: the task details dialog. */
export function UIProvider({ children }) {
  const [detailsTaskId, setDetailsTaskId] = useState(null)
  const openTask = useCallback((taskOrId) => setDetailsTaskId(taskOrId?.id ?? taskOrId), [])
  const value = useMemo(() => ({ openTask }), [openTask])

  return (
    <UIContext.Provider value={value}>
      {children}
      <TaskDetailsDialog taskId={detailsTaskId} onClose={() => setDetailsTaskId(null)} />
    </UIContext.Provider>
  )
}
