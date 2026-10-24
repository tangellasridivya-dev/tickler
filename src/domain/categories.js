// Task categories. Each task belongs to one; new tasks get one from the words in
// their title (rule-based, so "Pay the gas bill" is Bills and "Buy milk" is
// Shopping), and anything that doesn't match is a Reminder. People can change it.

export const CATEGORIES = [
  { id: 'reminders', label: 'Reminders' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'work', label: 'Work' },
  { id: 'bills', label: 'Bills' },
]

// Checked in order: "Pay for the groceries" is a bill, not shopping.
const RULES = [
  ['bills', /\b(pay|paid|bills?|fees?|emi|rent|recharge|premium|tax(es)?|invoice|subscription|bhar(na|o)?|kattu)\b/i],
  ['work', /\b(report|meeting|project|team|office|client|presentation|deadline|submit|sprint|budget|email|slides)\b/i],
  [
    'shopping',
    /\b(buy|pick up|groceries|grocery|milk|bread|vegetables|fruits?|order|shop|shopping|purchase|bring|collect|kharid\w*|konu|saaman)\b/i,
  ],
]

/** The category a title suggests; 'reminders' when nothing matches. */
export function categorize(title = '') {
  return RULES.find(([, pattern]) => pattern.test(title))?.[0] ?? 'reminders'
}

export function categoryOf(task) {
  return CATEGORIES.some((c) => c.id === task.category) ? task.category : categorize(task.title)
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'Reminders'
}
