// Demo household data: everyday tasks families and friends share with each
// other, generated relative to "now" so the Home page always has a realistic
// day to show on first launch. Clear the site's storage to get it back.
import { CURRENT_USER_ID } from './people.js'
import { addDays, atTime, endOfDay, MINUTE, startOfDay } from '../lib/dates.js'
import { makeSubtask, makeTask } from '../domain/task.js'

// Smaller steps for some demo tasks: [title, done].
const DEMO_SUBTASKS = {
  'Pick up milk, bread and vegetables on the way home': [['2 packets of milk', true], ['Brown bread'], ['Tomatoes and onions'], ['Coriander']],
  'Submit the monthly project report': [['Collect numbers from the team', true], ['Write the summary'], ['Share the draft with the team']],
  'Review the household budget for this month': [['Update this month’s expenses'], ['Compare with last month']],
  'Plan the weekend family outing': [['Check with Amma and Nanna'], ['Pick a place'], ['Book a cab']],
  'Clean out the fridge': [['Throw out old leftovers'], ['Wipe the vegetable tray']],
  'Book train tickets for the Diwali trip': [['Check dates with everyone', true], ['Book 3AC for 4 people'], ['Share the PNR in the family group']],
  'Take the car for servicing': [['Book the service slot'], ['Ask them to check the AC']],
}

// Pictures that came with a task, keyed by title. Unsplash again, same as the
// portraits in people.js.
const shot = (id) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=70`
const DEMO_ATTACHMENTS = {
  'Drop the silk saree at the tailor': [
    { id: 'a1', url: shot('1610030469983-98e550d6193c'), alt: 'Photo attached to the task' },
    { id: 'a2', url: shot('1595341888016-a392ef81b7de'), alt: 'Photo attached to the task' },
  ],
  'Collect the birthday cake from the bakery': [
    { id: 'a3', url: shot('1578985545062-69928b1d9587'), alt: 'Photo attached to the task' },
  ],
  'Take the car for servicing': [
    { id: 'a4', url: shot('1486262715619-67b85e0b08d3'), alt: 'Photo attached to the task' },
  ],
}

/** Demo pictures for a sample task's title (empty for anything else). */
export function demoAttachments(title) {
  return DEMO_ATTACHMENTS[title] ?? []
}

/** Demo subtasks for a sample task's title (empty for anything else). */
export function demoSubtasks(title) {
  return (DEMO_SUBTASKS[title] ?? []).map(([text, done]) => makeSubtask(text, !!done))
}

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

  const tasks = [
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
      title: 'Pick up milk, bread and vegetables on the way home', notes: '2 packets of milk, brown bread, tomatoes, onions and coriander from the Ratnadeep near the signal.',
      createdBy: 'karthik',
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
      title: 'Book Lakshmi’s dentist appointment', notes: 'Dr. Reddy’s clinic, Madhapur. Prefer a Saturday morning slot; her number is on the clinic card.',
      createdBy: 'karthik',
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
      title: 'Call the plumber about the kitchen tap', notes: 'Tap is leaking from the base. Ramesh plumber: 98480 12345. Ask him to check the bathroom geyser too.',
      createdBy: 'padma',
      ...request(25),
      dueAt: today(200),
      reminder: '15m',
    }),
    makeTask({ title: 'Call Grandma', notes: 'Ask about her knee and the temple visit. She likes a call after 6 PM.', dueAt: today(300), estimateMinutes: 30, flexible: true }),
    makeTask({ title: 'Clean out the fridge', notes: 'Throw out old chutneys and leftovers; wipe the vegetable tray.', dueAt: today(360), estimateMinutes: 90, flexible: true }),
    makeTask({
      title: 'Drop the silk saree at the tailor',
      createdBy: 'padma',
      ...accepted(240, 230),
      dueAt: today(140),
      notes: 'Blouse stitching for the pink Kanchipuram saree. Lakshmi Tailors, near the temple; measurements are with them.',
    }),
    // Done today
    makeTask({ title: 'Water the plants', notes: 'Balcony tulsi and money plant; skip the cactus.', dueAt: today(-180), estimateMinutes: 10, repeat: 'daily', ...doneToday(-200) }),
    makeTask({ title: 'Morning walk', notes: '30 minutes around KBR Park.', dueAt: today(-240), estimateMinutes: 30, repeat: 'daily', ...doneToday(-230) }),
    // Upcoming
    makeTask({
      title: 'Pay the school fees', notes: 'Term 2 fees for Lakshmi, ₹18,500. Pay on the school app and save the receipt.',
      dueAt: day(1, 10),
      priority: 'high',
      repeat: 'monthly',
      reminder: '1d',
      estimateMinutes: 20,
    }),
    makeTask({
      title: 'Pay the internet bill',
      createdBy: 'karthik',
      ...accepted(600, 590),
      dueAt: day(1, 20),
      notes: 'ACT Fibernet, ₹1,179 for the 300 Mbps plan. Pay with the credit card for the cashback.',
    }),
    makeTask({
      title: 'Book Amma’s eye check-up',
      createdBy: 'venkat',
      ...accepted(1440, 1400),
      dueAt: day(2, 11),
      priority: 'high',
      notes: 'LV Prasad Eye Institute, Banjara Hills. She has been having blurry vision while reading.',
    }),
    makeTask({
      title: 'Review the household budget for this month', notes: 'Compare rent, groceries and EMIs with last month in the shared sheet before our call.',
      createdBy: 'rahul',
      ...accepted(1500, 1440),
      dueAt: day(1, 11),
      priority: 'high',
      estimateMinutes: 30,
    }),
    makeTask({
      title: 'Book the gas cylinder refill', notes: 'HP Gas, IVRS booking via the app. Consumer number is on the blue card.',
      dueAt: day(2, 16),
      reminder: '1d',
      estimateMinutes: 15,
      flexible: true,
    }),
    makeTask({
      title: 'Pick up Dad’s medicines from the pharmacy', notes: 'BP tablets and vitamin D, 1-month supply from Apollo Pharmacy. Prescription photo is on WhatsApp.',
      createdBy: 'venkat',
      dueAt: day(2, 12),
      ...request(120),
    }),
    makeTask({
      title: 'Bring the board games for Saturday night', notes: 'Carrom board and Ludo King cards. Priya is hosting at her place.',
      createdBy: 'priya',
      dueAt: day(1, 18),
      ...request(10),
    }),
    makeTask({ title: 'Plan the weekend family outing', notes: 'Options: Golconda Fort in the morning or Shilparamam in the evening. Check with Amma and Nanna.', dueAt: day(3, 19), estimateMinutes: 60, flexible: true }),
    // Assigned by me to others
    makeTask({ title: 'Collect the birthday cake from the bakery', notes: '1 kg chocolate truffle from Karachi Bakery, already paid. Order number 4521.', createdBy: me, assigneeId: 'arjun', dueAt: today(180) }),
    makeTask({ title: 'Book train tickets for the Diwali trip', notes: 'Hyderabad to Vijayawada, 3AC for 4 people. Book on IRCTC as soon as tatkal opens.', createdBy: me, assigneeId: 'lakshmi', dueAt: today(240), progress: 'in-progress' }),
    makeTask({ title: 'Feed the cat', notes: 'Half a cup of dry food and fresh water.', createdBy: me, assigneeId: 'lakshmi', dueAt: today(-120), ...doneToday(-130) }),
    makeTask({ title: 'Send the photos from Sunday’s get-together', notes: 'Share the Google Photos album link in the family group.', createdBy: me, assigneeId: 'priya', dueAt: today(270), progress: 'in-progress' }),
    makeTask({ title: 'Buy a birthday gift for Priya', notes: 'She mentioned wanting a handloom saree or a good book. Budget about ₹2,500.', createdBy: me, assigneeId: 'karthik', dueAt: day(1, 17), progress: 'in-progress' }),
    makeTask({ title: 'Take the car for servicing', notes: 'Maruti service centre, Kukatpally. 20,000 km service; also check the AC.', createdBy: me, assigneeId: 'venkat', dueAt: day(1, 9) }),
    makeTask({
      title: 'Send the meeting notes to the team', notes: 'Summary of Friday’s sprint review with the action items and owners.',
      createdBy: me,
      assigneeId: 'rahul',
      dueAt: day(2, 10),
      priority: 'high',
      acceptance: 'declined',
    }),
  ]
  return tasks.map((task) => ({
    ...task,
    subtasks: demoSubtasks(task.title),
    attachments: demoAttachments(task.title),
  }))
}
