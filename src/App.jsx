import { useEffect } from 'react'
import HomePage from './pages/home/HomePage.jsx'
import NewTaskPage from './pages/new-task/NewTaskPage.jsx'
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'
import { useRoute } from './lib/router.js'
import { useReminders } from './state/useReminders.js'

function App() {
  const { path, params } = useRoute()
  useReminders()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (path === '/notifications') return <NotificationsPage />
  if (path === '/new') return <NewTaskPage params={params} />
  if (path === '/mine') return <HomePage key="mine" personal />
  return <HomePage key="home" />
}

export default App
