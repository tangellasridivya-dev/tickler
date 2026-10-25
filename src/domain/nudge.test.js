import { describe, expect, it } from 'vitest'
import { buildNudge } from './suggestions.js'
import { makeTask } from './task.js'

const NOW = new Date(2026, 9, 26, 10, 0)
const at = (h, m = 0) => new Date(2026, 9, 26, h, m).toISOString()

describe('buildNudge', () => {
  it('says the day is free when nothing is due', () => {
    const nudge = buildNudge([], NOW)
    expect(nudge.tone).toBe('good')
    expect(nudge.text).toContain('free today')
  })

  it('puts anything overdue first, whatever else is on', () => {
    const nudge = buildNudge(
      [
        makeTask({ title: 'Pay the bill', dueAt: at(8) }),
        makeTask({ title: 'Call the plumber', priority: 'high', dueAt: at(11) }),
      ],
      NOW,
    )
    expect(nudge.tone).toBe('urgent')
    expect(nudge.text).toContain('Pay the bill')
    expect(nudge.text).toContain('first')
  })

  it('counts down an important task that is close', () => {
    const nudge = buildNudge([makeTask({ title: 'Submit the report', priority: 'high', dueAt: at(11) })], NOW)
    expect(nudge.tone).toBe('urgent')
    expect(nudge.text).toContain('Submit the report')
    expect(nudge.text).toContain('1 hr')
  })

  it('asks to keep the time free when the important task is still hours off', () => {
    const nudge = buildNudge([makeTask({ title: 'Team review', priority: 'high', dueAt: at(17) })], NOW)
    expect(nudge.tone).toBe('calm')
    expect(nudge.text).toContain('Keep')
    expect(nudge.text).toContain('important')
  })

  it('otherwise names what is next, and how much is left', () => {
    const nudge = buildNudge(
      [makeTask({ title: 'Water the plants', dueAt: at(15) }), makeTask({ title: 'Call Grandma', dueAt: at(18) })],
      NOW,
    )
    expect(nudge.text).toContain('2 tasks left')
    expect(nudge.text).toContain('Water the plants')
  })

  it('shortens a long task name rather than running over two lines', () => {
    const long = 'Pick up milk, bread, vegetables and everything else on the way back home'
    const nudge = buildNudge([makeTask({ title: long, dueAt: at(15) })], NOW)
    expect(nudge.text).toContain('…')
    expect(nudge.text).not.toContain('way back home')
  })
})
