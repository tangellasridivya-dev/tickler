import { describe, expect, it } from 'vitest'
import { parseTask } from './parseTask.js'

const NOW = new Date(2026, 9, 24, 10, 0) // Sat 24 Oct 2026, 10:00
const local = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]

describe('parseTask', () => {
  it('reads person, date, time and urgency from a sentence', () => {
    const r = parseTask('Ask Karthik to pick up milk tomorrow at 6pm urgent', NOW)
    expect(r.assigneeId).toBe('karthik')
    expect(local(r.dueAt)).toEqual([2026, 10, 25, 18, 0])
    expect(r.priority).toBe('high')
    expect(r.title).toBe('Pick up milk')
    expect(r.detected.person.text).toBe('Ask Karthik to')
  })

  it('understands relations, weekdays and parts of the day', () => {
    const r = parseTask('mom call the plumber on monday morning', NOW)
    expect(r.assigneeId).toBe('padma')
    expect(local(r.dueAt)).toEqual([2026, 10, 26, 9, 0])
    expect(r.title).toBe('Call the plumber')
  })

  it('handles dates written with months and 24-hour times', () => {
    expect(local(parseTask('Pay school fees on 30th Oct 17:30', NOW).dueAt)).toEqual([2026, 10, 30, 17, 30])
    expect(local(parseTask('Renew passport Nov 2', NOW).dueAt)).toEqual([2026, 11, 2, 9, 0])
  })

  it('does not treat a possessive as the assignee', () => {
    const r = parseTask("Buy a gift for Karthik's birthday", NOW)
    expect(r.assigneeId).toBeNull()
    expect(r.title).toBe("Buy a gift for Karthik's birthday")
  })

  it('picks a sensible default time and rolls past times to tomorrow', () => {
    expect(local(parseTask('Water the plants', NOW).dueAt)).toEqual([2026, 10, 24, 11, 0])
    expect(local(parseTask('Lock the door at 8am', NOW).dueAt)).toEqual([2026, 10, 25, 8, 0])
    expect(local(parseTask('Dinner tonight', NOW).dueAt)).toEqual([2026, 10, 24, 20, 0])
  })

  it('reads "remind me to" as a task for yourself', () => {
    const r = parseTask('Remind me to call Grandma at 5', NOW)
    expect(r.assigneeId).toBe('me')
    expect(local(r.dueAt)).toEqual([2026, 10, 24, 17, 0])
    expect(r.title).toBe('Call Grandma')
  })

  it('reads repeats: daily, a weekday every week, monthly', () => {
    const daily = parseTask('Water the plants every day at 7am', NOW)
    expect(daily.repeat).toBe('daily')
    expect(daily.title).toBe('Water the plants')
    expect(local(daily.dueAt)).toEqual([2026, 10, 25, 7, 0])
    const weekly = parseTask('Team call every monday at 10am', NOW)
    expect(weekly.repeat).toBe('weekly')
    expect(local(weekly.dueAt)).toEqual([2026, 10, 26, 10, 0])
    expect(weekly.title).toBe('Team call')
    expect(parseTask('Pay the rent monthly on the 1st', NOW).repeat).toBe('monthly')
  })

  it('understands common Hindi and Telugu words', () => {
    const hindi = parseTask('Amma ko call karo kal shaam', NOW)
    expect(hindi.assigneeId).toBe('padma')
    expect(local(hindi.dueAt)).toEqual([2026, 10, 25, 18, 0])
    expect(hindi.title).toBe('Call karo')
    const telugu = parseTask('anna ku cake order repu sayantram', NOW)
    expect(telugu.assigneeId).toBe('arjun')
    expect(local(telugu.dueAt)).toEqual([2026, 10, 25, 18, 0])
    expect(parseTask('Didi gift lao jaldi', NOW)).toMatchObject({ assigneeId: 'lakshmi', priority: 'high' })
  })

  it('respects detections the user dismissed', () => {
    const r = parseTask('Ask Arjun to book tickets tomorrow', NOW, { ignore: { person: true, date: true } })
    expect(r.assigneeId).toBeNull()
    expect(r.detected.date).toBeNull()
    expect(r.title).toBe('Ask Arjun to book tickets tomorrow')
  })
})

describe('formatDueIn', () => {
  it('describes time until or past due', async () => {
    const { formatDueIn } = await import('../lib/dates.js')
    expect(formatDueIn(new Date(2026, 9, 24, 10, 45), NOW)).toBe('in 45 min')
    expect(formatDueIn(new Date(2026, 9, 24, 13, 0), NOW)).toBe('in 3 hr')
    expect(formatDueIn(new Date(2026, 9, 25, 10, 0), NOW)).toBe('in 1 day')
    expect(formatDueIn(new Date(2026, 9, 24, 9, 0), NOW)).toBe('1 hr overdue')
  })
})
