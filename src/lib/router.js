// Minimal hash router ("#/notifications"). Hash routes work on any static host
// and inside the installed PWA without server rewrites.
import { useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

const getPath = () => window.location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  return useSyncExternalStore(subscribe, getPath, () => '/')
}

export const hrefFor = (path) => `#${path}`

/** Goes back if there is somewhere to go back to, otherwise to the given path. */
export function goBack(fallback = '/') {
  if (window.history.length > 1) window.history.back()
  else window.location.hash = hrefFor(fallback)
}
