// Demo household data: everyday tasks families and friends share with each
// other, generated relative to "now" so the Home page always has a realistic
// day to show on first launch. Clear the site's storage to get it back.
import { CURRENT_USER_ID } from './people.js'
import { addDays, atTime, endOfDay, MINUTE, startOfDay } from '../lib/dates.js'
import { makeTask } from '../domain/task.js'

export function createSeedTasks(now = new Date()) {
  const me = CURRENT_USER_ID
  const todayStart = startOfDay(now).getTime()
  const todayEnd = endOfDay(now).getTime() - MINUTE
  // Keep "today" tasks inside today, even late at night or just after midnight.
  const today = (offsetMinutes) =>
    new Date(Math.min(Math.max(now.getTime() + offsetMinutes * MINUTE, todayStart), todayEnd)).toISOString()
  const day = (days, hours, minutes = 0) => atTime(addDays(now, days), hours, minutes).toISOString()
  const doneToday = (offsetMinutes) => ({ status: 'done', completedAt: today(offsetMinutes) })
  const ago = (minutes) => new Date(now.getTime() - minutes * MINUTE).toISOString()
  // A task someone gave me: still a request, or accepted some minutes ago.
  const request = (sentMinutesAgo) => ({ acceptance: 'pending', createdAt: ago(sentMinutesAgo) })
  const accepted = (sentMinutesAgo, acceptedMinutesAgo) => ({
    acceptance: 'accepted',
    createdAt: ago(sentMinutesAgo),
    acceptedAt: ago(acceptedMinutesAgo),
  })

  return [
    // Overdue
    makeTask({
      title: 'Pay the electricity bill',
      dueAt: day(-1, 18),
      priority: 'high',
      reminder: '1h',
      estimateMinutes: 10,
      notes: 'Consumer number is on last month’s bill in the kitchen drawer.',
    }),
    makeTask({
      title: 'Pick up milk, bread and vegetables on the way home',
      createdBy: 'maya',
      ...accepted(300, 280),
      dueAt: today(-60),
      reminder: '15m',
      estimateMinutes: 15,
    }),
    // Later today
    makeTask({
      title: 'Collect clothes from the ironing shop',
      dueAt: today(90),
      reminder: '15m',
      estimateMinutes: 45,
      flexible: true,
      notes: 'Token is in the car glovebox.',
    }),
    makeTask({
      title: 'Book Leela’s dentist appointment',
      createdBy: 'maya',
      ...accepted(180, 170),
      dueAt: today(120),
      estimateMinutes: 10,
    }),
    makeTask({
      title: 'Submit the monthly project report',
      dueAt: today(150),
      priority: 'high',
      reminder: '1h',
      estimateMinutes: 90,
      notes: 'Share the draft with the team before sending.',
    }),
    makeTask({
      title: 'Call the plumber about the kitchen tap',
      createdBy: 'ananya',
      ...request(25),
      dueAt: today(200),
      reminder: '15m',
    }),
    makeTask({ title: 'Call Grandma', dueAt: today(300), estimateMinutes: 30, flexible: true }),
    makeTask({ title: 'Clean out the fridge', dueAt: today(360), estimateMinutes: 90, flexible: true }),
    // Done today
    makeTask({ title: 'Water the plants', dueAt: today(-180), estimateMinutes: 10, ...doneToday(-200) }),
    makeTask({ title: 'Morning walk', dueAt: today(-240), estimateMinutes: 30, ...doneToday(-230) }),
    // Upcoming
    makeTask({
      title: 'Pay the school fees',
      dueAt: day(1, 10),
      priority: 'high',
      reminder: '1d',
      estimateMinutes: 20,
    }),
    makeTask({
      title: 'Review the household budget for this month',
      createdBy: 'rahul',
      ...accepted(1500, 1440),
      dueAt: day(1, 11),
      priority: 'high',
      estimateMinutes: 30,
    }),
    makeTask({
      title: 'Book the gas cylinder refill',
      dueAt: day(2, 16),
      reminder: '1d',
      estimateMinutes: 15,
      flexible: true,
    }),
    makeTask({
      title: 'Pick up Dad’s medicines from the pharmacy',
      createdBy: 'vikram',
      dueAt: day(2, 12),
      ...request(120),
    }),
    makeTask({
      title: 'Bring the board games for Saturday night',
      createdBy: 'priya',
      dueAt: day(1, 18),
      ...request(10),
    }),
    makeTask({ title: 'Plan the weekend family outing', dueAt: day(3, 19), estimateMinutes: 60, flexible: true }),
    // Assigned by me to others
    makeTask({ title: 'Collect the birthday cake from the bakery', createdBy: me, assigneeId: 'arjun', dueAt: today(180) }),
    makeTask({ title: 'Book train tickets for the Diwali trip', createdBy: me, assigneeId: 'leela', dueAt: today(240), progress: 'in-progress' }),
    makeTask({ title: 'Feed the cat', createdBy: me, assigneeId: 'leela', dueAt: today(-120), ...doneToday(-130) }),
    makeTask({ title: 'Send the photos from Sunday’s get-together', createdBy: me, assigneeId: 'priya', dueAt: today(270), progress: 'in-progress' }),
    makeTask({ title: 'Buy a birthday gift for Priya', createdBy: me, assigneeId: 'maya', dueAt: day(1, 17), progress: 'in-progress' }),
    makeTask({ title: 'Take the car for servicing', createdBy: me, assigneeId: 'vikram', dueAt: day(1, 9) }),
    makeTask({
      title: 'Send the meeting notes to the team',
      createdBy: me,
      assigneeId: 'rahul',
      dueAt: day(2, 10),
      priority: 'high',
      acceptance: 'pending',
    }),
  ]
}
