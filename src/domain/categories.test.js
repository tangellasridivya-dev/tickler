import { describe, expect, it } from 'vitest'
import { categorize, categoryOf } from './categories.js'
import { matchesFilter } from './selectors.js'
import { makeTask, subtaskCount, makeSubtask } from './task.js'

describe('categories', () => {
  it('guesses a category from the title', () => {
    expect(categorize('Pay the electricity bill')).toBe('bills')
    expect(categorize('Pay for the groceries')).toBe('bills')
    expect(categorize('Buy milk and bread')).toBe('shopping')
    expect(categorize('Submit the monthly project report')).toBe('work')
    expect(categorize('Call Grandma')).toBe('reminders')
  })

  it('keeps a category someone picked, and fills one in for older records', () => {
    expect(categoryOf({ title: 'Buy milk', category: 'work' })).toBe('work')
    expect(categoryOf({ title: 'Buy milk' })).toBe('shopping')
    expect(makeTask({ title: 'Pay rent' }).category).toBe('bills')
  })
})

describe('board filters', () => {
  const now = new Date(2026, 9, 24, 12)
  const late = makeTask({ title: 'Call the plumber', dueAt: new Date(2026, 9, 24, 9).toISOString() })
  const urgent = makeTask({ title: 'Buy medicines', priority: 'high', dueAt: new Date(2026, 9, 25, 9).toISOString() })

  it('matches categories, overdue and priority', () => {
    expect(matchesFilter(late, 'all', now)).toBe(true)
    expect(matchesFilter(late, 'overdue', now)).toBe(true)
    expect(matchesFilter(urgent, 'overdue', now)).toBe(false)
    expect(matchesFilter(urgent, 'priority', now)).toBe(true)
    expect(matchesFilter(urgent, 'shopping', now)).toBe(true)
    expect(matchesFilter(late, 'shopping', now)).toBe(false)
  })

  it('does not count finished tasks as overdue', () => {
    expect(matchesFilter({ ...late, status: 'done' }, 'overdue', now)).toBe(false)
  })
})

describe('subtasks', () => {
  it('counts done and total', () => {
    const task = makeTask({ title: 'Shop', subtasks: [makeSubtask('Milk', true), makeSubtask('Bread')] })
    expect(subtaskCount(task)).toEqual({ done: 1, total: 2 })
    expect(subtaskCount(makeTask({ title: 'Nothing' }))).toEqual({ done: 0, total: 0 })
  })
})
