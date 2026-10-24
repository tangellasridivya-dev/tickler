// Persistence for tasks. Today this is the browser's localStorage; the async
// interface means it can be swapped for a real API without touching the UI.
import { createSeedTasks } from './seed.js'
import { makeTask, normalizePriority } from '../domain/task.js'

const STORAGE_KEY = 'tickler.tasks.v1'
const LATENCY_MS = 250

// In development, add ?simulate=load-error, ?simulate=save-error or
// ?simulate=empty to the URL
// to exercise the error states.
function simulated(kind) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('simulate') === kind
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw == null) return null
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Stored tasks are corrupted')
  return parsed.map((t) => ({ ...t, priority: normalizePriority(t.priority) }))
}

function write(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export async function fetchTasks() {
  await wait(LATENCY_MS)
  if (simulated('load-error')) throw new Error('Simulated load failure')
  if (simulated('empty')) return []
  const stored = read()
  if (stored) return stored
  const seeded = createSeedTasks()
  write(seeded)
  return seeded
}

export async function createTask(fields) {
  await wait(LATENCY_MS)
  if (simulated('save-error')) throw new Error('Simulated save failure')
  const task = makeTask(fields)
  write([...(read() ?? []), task])
  return task
}

/** Applies { id, ...changes } patches atomically and returns the updated tasks. */
export async function updateTasks(patches) {
  await wait(LATENCY_MS / 2)
  if (simulated('save-error')) throw new Error('Simulated save failure')
  const byId = new Map(patches.map((p) => [p.id, p]))
  const tasks = (read() ?? []).map((t) => (byId.has(t.id) ? { ...t, ...byId.get(t.id) } : t))
  write(tasks)
  return tasks.filter((t) => byId.has(t.id))
}

export async function resetDemoData() {
  const seeded = createSeedTasks()
  write(seeded)
  return seeded
}
