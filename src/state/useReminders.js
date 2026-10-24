import { useEffect, useRef } from 'react'
import { useTasks, useToast, useUI } from './contexts.js'
import { useNow } from './useNow.js'
import { getActiveReminders } from '../domain/selectors.js'
import { formatTime } from '../lib/dates.js'

const CHECKED_KEY = 'tickler.remindersCheckedAt'

function readChecked() {
  try {
    const value = Number(localStorage.getItem(CHECKED_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function saveChecked(ms) {
  try {
    localStorage.setItem(CHECKED_KEY, String(ms))
  } catch {
    // Without storage, reminders still fire for this visit.
  }
}

/** Shows a system notification if the user allowed them (via the service worker when available). */
async function notify(title, body, tag) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const options = { body, tag, icon: '/pwa-192x192.png', badge: '/pwa-64x64.png' }
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) return registration.showNotification(title, options)
  } catch {
    // Fall through to a page notification.
  }
  new Notification(title, options)
}

/**
 * Fires reminders while the app is open (or installed and running in the
 * background): an in-app message plus a system notification if allowed.
 * Only reminders that come due after the last check fire, so opening the app
 * never replays a backlog of old ones. Reminders while the app is fully closed
 * need a push server, which this app doesn't have yet.
 */
export function useReminders() {
  const { status, tasks } = useTasks()
  const toast = useToast()
  const { openTask } = useUI()
  const now = useNow(20_000)
  const fired = useRef(new Set())

  useEffect(() => {
    if (status !== 'ready') return
    const nowMs = now.getTime()
    const since = readChecked() ?? nowMs
    for (const { task, at, key } of getActiveReminders(tasks, now)) {
      const atMs = at.getTime()
      if (atMs <= since || fired.current.has(key)) continue
      fired.current.add(key)
      const body = `${task.title} · due ${formatTime(task.dueAt)}`
      toast.show({ message: `Reminder: ${body}`, action: { label: 'View', onClick: () => openTask(task) } })
      notify('Tickler reminder', body, key)
    }
    saveChecked(nowMs)
  }, [status, tasks, now, toast, openTask])
}
