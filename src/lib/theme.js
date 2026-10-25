// Light or dark, or whatever the phone is set to. The tokens already carry
// both palettes: no attribute follows the OS, data-theme pins one of them.
const KEY = 'tickler.theme'

export const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

const OS_MEDIA = { light: '(prefers-color-scheme: light)', dark: '(prefers-color-scheme: dark)' }

export function readTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    return THEMES.some((t) => t.id === saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

/**
 * The status bar follows the OS by default; pinning a theme pins it too, or
 * the bar would stay light while the app went dark.
 */
function applyStatusBar(theme) {
  for (const scheme of ['light', 'dark']) {
    const meta = document.querySelector(`meta[name="theme-color"][data-scheme="${scheme}"]`)
    if (!meta) continue
    meta.media = theme === 'system' ? OS_MEDIA[scheme] : theme === scheme ? 'all' : 'not all'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  applyStatusBar(theme)
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // It just won't be remembered next visit.
  }
  applyTheme(theme)
}
