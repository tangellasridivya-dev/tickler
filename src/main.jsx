import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt.jsx'
import { TasksProvider } from './state/TasksContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { UIProvider } from './state/UIContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <TasksProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </TasksProvider>
    </ToastProvider>
    <ReloadPrompt />
  </StrictMode>,
)
