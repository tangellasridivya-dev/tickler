import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt.jsx'
import { TasksProvider } from './state/TasksContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { UIProvider } from './state/UIContext.jsx'

// Development runs without a service worker. Remove any left from earlier dev
// sessions so the browser never serves a stale copy of the app.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}

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
