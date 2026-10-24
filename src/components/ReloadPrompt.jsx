import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="reload-prompt" role="alert">
      <span>
        {offlineReady ? 'App ready to work offline.' : 'New version available.'}
      </span>
      {needRefresh && (
        <button onClick={() => updateServiceWorker(true)}>Reload</button>
      )}
      <button onClick={close}>Close</button>
    </div>
  )
}

export default ReloadPrompt
