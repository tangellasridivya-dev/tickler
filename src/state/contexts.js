import { createContext, useContext } from 'react'

// Contexts and their hooks live apart from the provider components so React
// Fast Refresh can hot-reload the providers.
export const TasksContext = createContext(null)
export const ToastContext = createContext(null)
export const UIContext = createContext(null)

function useRequired(context, name, provider) {
  const value = useContext(context)
  if (!value) throw new Error(`${name} must be used inside <${provider}>`)
  return value
}

export const useTasks = () => useRequired(TasksContext, 'useTasks', 'TasksProvider')
export const useToast = () => useRequired(ToastContext, 'useToast', 'ToastProvider')
export const useUI = () => useRequired(UIContext, 'useUI', 'UIProvider')
