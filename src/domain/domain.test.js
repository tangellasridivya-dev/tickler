import { describe, expect, it } from 'vitest'
import { getProgress, makeTask } from './task.js'
import {
  applyTaskFilter,
  getActiveReminders,
  getDaySummary,
  getDueOverview,
  getOwnership,
  getTodayTasks,
  getBoardColumns,
  getTaskRequests,
} from './selectors.js'
import { buildSuggestion, isMovable } from './suggestions.js'
import { createSeedTasks } from '../data/seed.js'

const NOW = new Date(2026, 9, 24, 10, 0) // Sat 24 Oct 2026, 10:00
const at = (h, m = 0, dayOffset = 0) => new Date(2026, 9, 24 + dayOffset, h, m).toISOString()

describe('getDaySummary', () => {
  it('counts only my tasks, never double-counts, and derives progress', () => {
    const tasks = [
      makeTask({ title: 'Overdue yesterday', dueAt: at(18, 0, -1) }),
      makeTask({ title: 'Overdue this morning', dueAt: at(9) }),
      makeTask({ title: 'Later today', dueAt: at(15) }),
      makeTask({ title: 'Tomorrow', dueAt: at(9, 0, 1) }),
      makeTask({ title: 'Done today', dueAt: at(8), status: 'done', completedAt: at(8, 30) }),
      makeTask({ title: 'Done early', dueAt: at(9, 0, 2), status: 'done', completedAt: at(9, 30) }),
      makeTask({ title: 'Done yesterday', dueAt: at(8, 0, -1), status: 'done', completedAt: at(8, 0, -1) }),
      makeTask({ title: 'Delegated', assigneeId: 'arjun', dueAt: at(9) }),
    ]
    expect(getDaySummary(tasks, NOW)).toEqual({
      remaining: 3,
      overdue: 2,
      completed: 2,
      total: 5,
      progress: 2 / 5,
    })
  })

  it('returns null progress when nothing is planned', () => {
    expect(getDaySummary([makeTask({ dueAt: at(9, 0, 3) })], NOW).progress).toBeNull()
  })
})

describe('getDueOverview', () => {
  it('splits open tasks into exclusive buckets and finds the next deadline', () => {
    const tasks = [
      makeTask({ title: 'A', dueAt: at(9) }),
      makeTask({ title: 'B', dueAt: at(14) }),
      makeTask({ title: 'C', dueAt: at(11) }),
      makeTask({ title: 'D', dueAt: at(9, 0, 3) }),
      makeTask({ title: 'E', dueAt: at(9, 0, 30) }),
      makeTask({ title: 'Theirs', assigneeId: 'maya', dueAt: at(10, 30) }),
    ]
    const overview = getDueOverview(tasks, NOW)
    expect(overview).toMatchObject({ overdue: 1, dueToday: 2, upcoming: 1 })
    expect(overview.nextDeadline.title).toBe('C')
  })
})

describe('getTodayTasks', () => {
  it('orders overdue first, then high priority, then by due time', () => {
    const tasks = [
      makeTask({ title: 'Normal soon', dueAt: at(11) }),
      makeTask({ title: 'High later', dueAt: at(16), priority: 'high' }),
      makeTask({ title: 'Overdue', dueAt: at(9) }),
      makeTask({ title: 'Delegated', assigneeId: 'leela', dueAt: at(9) }),
    ]
    expect(getTodayTasks(tasks, NOW).map((t) => t.title)).toEqual(['Overdue', 'High later', 'Normal soon'])
  })
})

describe('ownership', () => {
  it('distinguishes personal, assigned to me and delegated tasks', () => {
    expect(getOwnership(makeTask({})).kind).toBe('personal')
    expect(getOwnership(makeTask({ createdBy: 'maya' })).label).toBe('From Maya')
    expect(getOwnership(makeTask({ assigneeId: 'arjun' })).label).toBe('For Arjun')
    expect(applyTaskFilter([makeTask({ assigneeId: 'arjun', dueAt: at(11) })], 'today', NOW)).toHaveLength(0)
  })
})

describe('getActiveReminders', () => {
  it('returns reminders that have gone off for my open tasks', () => {
    const tasks = [
      makeTask({ title: 'Fired', dueAt: at(10, 10), reminder: '15m' }),
      makeTask({ title: 'Not yet', dueAt: at(12), reminder: '1h' }),
      makeTask({ title: 'Done', dueAt: at(10, 10), reminder: '15m', status: 'done', completedAt: at(9) }),
    ]
    expect(getActiveReminders(tasks, NOW).map((r) => r.task.title)).toEqual(['Fired'])
  })
})

describe('buildSuggestion', () => {
  it('suggests moving a flexible normal-priority task when a deadline is at risk', () => {
    const tasks = [
      makeTask({ title: 'Errand', dueAt: at(11), estimateMinutes: 45, flexible: true }),
      makeTask({ title: 'Slides', dueAt: at(12), estimateMinutes: 90, priority: 'high' }),
    ]
    const s = buildSuggestion(tasks, NOW)
    expect(s.kind).toBe('reschedule')
    expect(s.atRiskTask.title).toBe('Slides')
    expect(s.changes.map((c) => c.task.title)).toEqual(['Errand'])
    expect(s.changes[0].to.getDate()).toBe(25)
    expect(s.noticed).toContain('2 hr 15 min')
  })

  it('never proposes tasks from others, firm tasks or high-priority tasks', () => {
    const tasks = [
      makeTask({ title: 'From Maya', createdBy: 'maya', dueAt: at(11), estimateMinutes: 60, flexible: true }),
      makeTask({ title: 'Firm', dueAt: at(11), estimateMinutes: 30 }),
      makeTask({ title: 'High flex', dueAt: at(11), estimateMinutes: 30, flexible: true, priority: 'high' }),
      makeTask({ title: 'Slides', dueAt: at(12), estimateMinutes: 60, priority: 'high' }),
    ]
    expect(tasks.filter(isMovable).map((t) => t.title)).toEqual([])
    const s = buildSuggestion(tasks, NOW)
    expect(s.kind).toBe('heads-up')
    expect(s.changes).toEqual([])
  })

  it('returns nothing when the day fits', () => {
    const tasks = [
      makeTask({ title: 'A', dueAt: at(12), estimateMinutes: 30, flexible: true }),
      makeTask({ title: 'B', dueAt: at(15), estimateMinutes: 60 }),
    ]
    expect(buildSuggestion(tasks, NOW)).toBeNull()
  })

  it('does not change the tasks it is given', () => {
    const tasks = createSeedTasks(NOW)
    const before = JSON.stringify(tasks)
    buildSuggestion(tasks, NOW)
    expect(JSON.stringify(tasks)).toBe(before)
  })

  it('finds the at-risk deadline in the demo data', () => {
    const s = buildSuggestion(createSeedTasks(NOW), NOW)
    expect(s.kind).toBe('reschedule')
    expect(s.atRiskTask.title).toMatch(/project report/i)
    expect(s.changes.map((c) => c.task.title)).toEqual(['Collect clothes from the ironing shop'])
  })
})

describe('board', () => {
  const tasks = [
    makeTask({ title: 'Old overdue', dueAt: at(9, 0, -2) }),
    makeTask({ title: 'Old done', dueAt: at(9, 0, -2), status: 'done', completedAt: at(9, 0, -2) }),
    makeTask({ title: 'Late, done today', dueAt: at(9, 0, -1), status: 'done', completedAt: at(8) }),
    makeTask({ title: 'Today high', dueAt: at(15), priority: 'high' }),
    makeTask({ title: 'Today early', dueAt: at(11) }),
    makeTask({ title: 'Today done', dueAt: at(9), status: 'done', completedAt: at(9) }),
    makeTask({ title: 'Tomorrow', dueAt: at(9, 0, 1) }),
    makeTask({ title: 'Next month', dueAt: at(9, 0, 30) }),
    makeTask({ title: 'For Arjun', assigneeId: 'arjun', dueAt: at(12) }),
    makeTask({ title: 'From Maya', createdBy: 'maya', dueAt: at(13) }),
    makeTask({ title: 'Not mine at all', createdBy: 'maya', assigneeId: 'leela', dueAt: at(13) }),
  ]
  const titles = (col) => col.tasks.map((t) => t.title)

  it('builds overdue, seven day columns and later', () => {
    const cols = getBoardColumns(tasks, NOW, 'to-me')
    expect(cols.map((c) => c.kind)).toEqual(['overdue', 'today', 'day', 'day', 'day', 'day', 'day', 'day', 'later'])
    expect(titles(cols[0])).toEqual(['Old overdue'])
    expect(titles(cols[1])).toEqual(['Today early', 'From Maya', 'Today high', 'Late, done today', 'Today done'])
    expect(cols[1].openCount).toBe(3)
    expect(titles(cols[2])).toEqual(['Tomorrow'])
    expect(titles(cols[8])).toEqual(['Next month'])
  })

  it('filters by scope', () => {
    const today = (scope) => titles(getBoardColumns(tasks, NOW, scope).find((c) => c.kind === 'today'))
    expect(today('to-me')).not.toContain('For Arjun')
    expect(today('to-me')).toContain('From Maya')
    expect(today('by-me')).toEqual(['For Arjun'])
    expect(getBoardColumns(tasks, NOW, 'by-me').some((c) => c.kind === 'overdue')).toBe(false)
  })
})

describe('getProgress', () => {
  it('reports done, in progress or not started', () => {
    expect(getProgress(makeTask({ status: 'done', progress: 'in-progress' }))).toBe('done')
    expect(getProgress(makeTask({ progress: 'in-progress' }))).toBe('in-progress')
    expect(getProgress(makeTask({}))).toBe('not-started')
    expect(getProgress({ status: 'open' })).toBe('not-started')
  })
})

describe('task requests', () => {
  const NOW_ = NOW
  const tasks = [
    makeTask({ title: 'Pending from Maya', createdBy: 'maya', dueAt: at(15), acceptance: 'pending', createdAt: at(9) }),
    makeTask({ title: 'Accepted from Maya', createdBy: 'maya', dueAt: at(16), acceptedAt: at(8) }),
    makeTask({ title: 'Mine', dueAt: at(17) }),
    makeTask({ title: 'For Arjun', assigneeId: 'arjun', dueAt: at(12), acceptance: 'pending' }),
  ]

  it('keeps pending requests off your board and counts until accepted', () => {
    const today = getBoardColumns(tasks, NOW_, 'to-me').find((c) => c.kind === 'today')
    expect(today.tasks.map((t) => t.title)).toEqual(['Accepted from Maya', 'Mine'])
    expect(getDaySummary(tasks, NOW_).remaining).toBe(2)
  })

  it('lists pending and recently accepted requests from others', () => {
    const { pending, accepted } = getTaskRequests(tasks, NOW_)
    expect(pending.map((t) => t.title)).toEqual(['Pending from Maya'])
    expect(accepted.map((t) => t.title)).toEqual(['Accepted from Maya'])
  })

  it('shows tasks you gave others as awaiting acceptance', () => {
    expect(getProgress(tasks[3])).toBe('pending')
  })
})
