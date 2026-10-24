// Minimal hash router ("#/new?date=2026-10-25"). Hash routes work on any static
// host and inside the installed PWA without server rewrites.
import { useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

const getHash = () => window.location.hash

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const [path, query = ''] = (hash.replace(/^#/, '') || '/').split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export function hrefFor(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()
  return `#${path}${query ? `?${query}` : ''}`
}

export function navigate(path, params) {
  window.location.hash = hrefFor(path, params)
}

/** Goes back if there is somewhere to go back to, otherwise to the given path. */
export function goBack(fallback = '/') {
  if (window.history.length > 1) window.history.back()
  else navigate(fallback)
}
