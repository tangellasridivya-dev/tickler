import { useEffect } from 'react'
import Celebration from './components/Celebration.jsx'
import HomePage from './pages/home/HomePage.jsx'
import NewTaskPage from './pages/new-task/NewTaskPage.jsx'
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'
import { useRoute } from './lib/router.js'
import { useDayCleared } from './state/useDayCleared.js'
import { useReminders } from './state/useReminders.js'

function page(path, params) {
  if (path === '/notifications') return <NotificationsPage />
  if (path === '/new') return <NewTaskPage params={params} />
  if (path === '/mine') return <HomePage key="mine" personal />
  return <HomePage key="home" />
}

function App() {
  const { path, params } = useRoute()
  useReminders()
  // Finishing the day deserves the same send-off wherever you happened to be.
  const { celebration, dismiss } = useDayCleared()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <>
      {page(path, params)}
      {celebration && <Celebration count={celebration.count} streak={celebration.streak} onDismiss={dismiss} />}
    </>
  )
}

export default App
