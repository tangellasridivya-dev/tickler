// Persistence for tasks. Today this is the browser's localStorage; the async
// interface means it can be swapped for a real API without touching the UI.
import { createSeedTasks, demoAttachments, demoSubtasks } from './seed.js'
import { categoryOf } from '../domain/categories.js'
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

// Earlier versions used different sample people. Tasks saved back then still
// point at them, so map them to today's people (same roles) when loading.
const RENAMED_PEOPLE = { maya: 'karthik', leela: 'lakshmi', ananya: 'padma', vikram: 'venkat' }
const renamed = (id) => RENAMED_PEOPLE[id] ?? id

/** Brings a stored record up to date with the current data model. */
export function upgradeRecord(task) {
  return {
    ...task,
    priority: normalizePriority(task.priority),
    createdBy: renamed(task.createdBy),
    assigneeId: renamed(task.assigneeId),
    category: categoryOf(task),
    // Records from before subtasks existed: sample tasks get their demo steps once.
    subtasks: task.subtasks ?? demoSubtasks(task.title),
    attachments: task.attachments ?? demoAttachments(task.title),
  }
}

function read() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw == null) return null
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Stored tasks are corrupted')
  return parsed.map(upgradeRecord)
}

function write(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export async function fetchTasks() {
  await wait(LATENCY_MS)
  if (simulated('load-error')) throw new Error('Simulated load failure')
  if (simulated('empty')) return []
  const stored = read()
  if (stored) {
    // Save the upgraded records so new fields (like subtask ids) stay stable.
    write(stored)
    return stored
  }
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

/** Removes tasks by id and returns the removed records (for undo). */
export async function deleteTasks(ids) {
  await wait(LATENCY_MS / 2)
  if (simulated('save-error')) throw new Error('Simulated save failure')
  const drop = new Set(ids)
  const all = read() ?? []
  write(all.filter((t) => !drop.has(t.id)))
  return all.filter((t) => drop.has(t.id))
}

/** Puts previously removed task records back (undo for delete). */
export async function restoreTasks(records) {
  await wait(LATENCY_MS / 2)
  const ids = new Set(records.map((t) => t.id))
  write([...(read() ?? []).filter((t) => !ids.has(t.id)), ...records])
  return records
}
