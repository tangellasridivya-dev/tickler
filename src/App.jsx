import { useEffect } from 'react'
import HomePage from './pages/home/HomePage.jsx'
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'
import { useRoute } from './lib/router.js'

function App() {
  const path = useRoute()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return path === '/notifications' ? <NotificationsPage /> : <HomePage />
}

export default App
