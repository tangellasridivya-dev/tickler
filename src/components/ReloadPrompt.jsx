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
    <div className="reload-prompt" role="status">
      <span>
        {offlineReady ? 'Tickler is ready to work offline.' : 'A new version of Tickler is available.'}
      </span>
      <span className="reload-prompt__actions">
        {needRefresh && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--sm" onClick={close}>
          {needRefresh ? 'Later' : 'OK'}
        </button>
      </span>
    </div>
  )
}

export default ReloadPrompt
