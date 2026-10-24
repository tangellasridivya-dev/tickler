// Reads a task typed as a sentence ("Ask Karthik to pick up milk tomorrow at 6pm")
// and pulls out who it's for, when it's due and whether it's urgent. Rule-based
// and offline, so it works instantly; the same shape could later be filled by an
// AI model. Every detection records the exact text it came from, so the UI can
// show it and the user can undo it.
import { CURRENT_USER_ID, PEOPLE } from '../data/people.js'
import { addDays, atTime, isSameDay, MINUTE, startOfDay } from '../lib/dates.js'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
// English plus common Hindi and Telugu words people mix in ("kal shaam", "repu sayantram").
const PARTS_OF_DAY = {
  morning: 9, subah: 9, poddunna: 9, podduna: 9,
  noon: 12,
  afternoon: 14, dopahar: 14, madhyanam: 14,
  evening: 18, shaam: 18, sham: 18, sayantram: 18,
  tonight: 20, night: 20, raat: 20, ratri: 20,
}
const PART_WORDS = Object.keys(PARTS_OF_DAY).join('|')
const URGENT = /\b(urgent(?:ly)?|asap|important|high priority|top priority|jaldi|turant)\b|!{2,}/i
const REPEAT_RULES = [
  [new RegExp(`\\bevery\\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\\b`, 'i'), 'weekly'],
  [/\b(?:every\s*day|everyday|daily|har\s+din|roz|prathi\s+roju)\b/i, 'daily'],
  [/\b(?:every\s*week|weekly|har\s+hafte)\b/i, 'weekly'],
  [/\b(?:every\s*month|monthly|har\s+mahine)\b/i, 'monthly'],
]

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Names and relation words ("mom", "my sister") that point at each person. */
function personAliases() {
  const aliases = []
  for (const p of PEOPLE) {
    if (p.id === CURRENT_USER_ID) continue
    aliases.push([p.name.toLowerCase(), p.id])
    const relation = p.relation.toLowerCase()
    aliases.push([`my ${relation}`, p.id])
    // Bare relation words are only safe for parents ("ask mom to…"); "friend" alone is too vague.
    if (relation === 'mom') aliases.push(['mom', p.id], ['mum', p.id], ['mother', p.id], ['amma', p.id], ['mummy', p.id])
    if (relation === 'dad') aliases.push(['dad', p.id], ['father', p.id], ['papa', p.id], ['nanna', p.id])
    if (relation === 'sister') aliases.push(['didi', p.id], ['behen', p.id], ['akka', p.id], ['chelli', p.id])
    if (relation === 'brother') aliases.push(['bhai', p.id], ['bhaiya', p.id], ['anna', p.id], ['tammudu', p.id])
  }
  // Longest first so "my sister" wins over "sister".
  return aliases.sort((a, b) => b[0].length - a[0].length)
}

function findPerson(text) {
  for (const [alias, id] of personAliases()) {
    const name = escape(alias)
    // "ask/tell/remind Karthik to", "@Karthik", "for Karthik", "Karthik to", or the bare name.
    const patterns = [
      new RegExp(`\\b(?:ask|tell|remind|get|have)\\s+${name}\\b(?:\\s+to\\b)?`, 'i'),
      new RegExp(`@${name}\\b`, 'i'),
      new RegExp(`\\bfor\\s+${name}\\b(?=\\s*(?:to\\b|$|,|\\.))`, 'i'),
      // Hindi/Telugu: "Amma ko …", "Karthik ki …", "anna ku …"
      new RegExp(`\\b${name}\\s+(?:ko|ku|ki|ni|tho)\\b`, 'i'),
      new RegExp(`^\\s*${name}\\b(?:\\s*,|\\s+(?:to|should|please|can you|could you)\\b)?`, 'i'),
      // Bare name, but not a possessive: "Karthik's birthday" is about Karthik, not for her.
      new RegExp(`\\b${name}\\b(?!['’]s)`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return { personId: id, match: match[0], index: match.index }
    }
  }
  const self = text.match(/\b(?:remind me to|i need to|i have to|i must)\b/i)
  if (self) return { personId: CURRENT_USER_ID, match: self[0], index: self.index, self: true }
  return null
}

/** The coming weekday; naming today's weekday means a week from now. */
function nextWeekday(now, weekday) {
  const diff = (weekday - now.getDay() + 7) % 7 || 7
  return startOfDay(addDays(now, diff))
}

function findDate(text, now) {
  const rules = [
    [/\b(?:day after tomorrow|parso|ellundi)\b/i, () => startOfDay(addDays(now, 2))],
    // "kal" can mean yesterday too, but for a new task it's always tomorrow.
    [/\b(?:tomorrow|tmrw|tmr|kal|repu)\b/i, () => startOfDay(addDays(now, 1))],
    [/\b(?:today|tonight|aaj|ivala|ivaala|eeroju|ee roju)\b/i, () => startOfDay(now)],
    [/\bin (\d{1,2}) days?\b/i, (m) => startOfDay(addDays(now, Number(m[1])))],
    [/\bnext week\b/i, () => startOfDay(addDays(now, 7))],
    [
      new RegExp(`\\b(?:on\\s+)?(next|this)?\\s*(${WEEKDAYS.join('|')})\\b`, 'i'),
      (m) => nextWeekday(now, WEEKDAYS.indexOf(m[2].toLowerCase())),
    ],
    [
      new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join('|')})[a-z]*\\b`, 'i'),
      (m) => monthDay(now, MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), Number(m[1])),
    ],
    [
      new RegExp(`\\b(?:on\\s+)?(${MONTHS.join('|')})[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'),
      (m) => monthDay(now, MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()), Number(m[2])),
    ],
    [/\bon (?:the )?(\d{1,2})(?:st|nd|rd|th)\b/i, (m) => monthDay(now, now.getMonth(), Number(m[1]), true)],
  ]
  for (const [pattern, toDate] of rules) {
    const match = text.match(pattern)
    if (!match) continue
    const date = toDate(match)
    if (date && !Number.isNaN(date.getTime())) return { date, match: match[0], index: match.index }
  }
  return null
}

/** A day in a month; rolls to next year (or next month) if that day has passed. */
function monthDay(now, month, day, rollMonth = false) {
  if (day < 1 || day > 31) return null
  let date = new Date(now.getFullYear(), month, day)
  if (date < startOfDay(now)) {
    date = rollMonth ? new Date(now.getFullYear(), month + 1, day) : new Date(now.getFullYear() + 1, month, day)
  }
  return date
}

function findTime(text) {
  const clock = text.match(/\b(?:at|by|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i)
  if (clock) {
    let hours = Number(clock[1]) % 12
    if (clock[3].toLowerCase().startsWith('p')) hours += 12
    return { hours, minutes: Number(clock[2] ?? 0), match: clock[0].trim(), index: clock.index + clock[0].indexOf(clock[0].trim()) }
  }
  const h24 = text.match(/\b(?:at|by)?\s*([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (h24) {
    return { hours: Number(h24[1]), minutes: Number(h24[2]), match: h24[0].trim(), index: h24.index + h24[0].indexOf(h24[0].trim()) }
  }
  const bare = text.match(/\b(?:at|by)\s+(\d{1,2})\b(?!\s*(?:days?|st|nd|rd|th))/i)
  if (bare) {
    const n = Number(bare[1])
    if (n >= 1 && n <= 12) {
      // "at 5" most often means the afternoon/evening; before 7 we assume PM.
      const hours = n < 7 ? n + 12 : n
      return { hours, minutes: 0, match: bare[0], index: bare.index }
    }
  }
  const part = text.match(new RegExp(`\\b(?:in the |this |tomorrow )?(${PART_WORDS})\\b`, 'i'))
  if (part) {
    const word = part[1].toLowerCase()
    // "tonight" is also a date word; keep it for the date and only use its time.
    const match = word === 'tonight' ? null : part[0].replace(/^tomorrow /i, '')
    return { hours: PARTS_OF_DAY[word], minutes: 0, match, index: match ? part.index + part[0].indexOf(match) : -1 }
  }
  return null
}

/** Removes detected phrases and tidies leftover joining words and punctuation. */
function cleanTitle(text, spans) {
  let title = text
  for (const s of [...spans].filter((s) => s && s.match).sort((a, b) => b.index - a.index)) {
    title = title.slice(0, s.index) + ' ' + title.slice(s.index + s.match.length)
  }
  title = title
    .replace(URGENT, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(?:on|at|by|for)\s*(?=[,.]|$)/gi, '')
    .replace(/^[\s,.:;-]*(?:to|please|pls)\b\s*/i, '')
    .replace(/[\s,:;-]+$/g, '')
    .replace(/\s+([,.])/g, '$1')
    .trim()
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : ''
}

/** Next whole hour today, or 9:00 AM tomorrow if it's late. */
export function defaultDueTime(now) {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  if (next.getHours() >= 22 || !isSameDay(next, now)) return atTime(addDays(now, 1), 9)
  return next
}

/**
 * Parses a typed task.
 * options.ignore: { person?, date?, time?, priority?, repeat? } – detections the user dismissed.
 * Returns { title, assigneeId, dueAt, priority, repeat, detected: { person, date, time, priority, repeat } }
 * where each detected entry is null or { text } (plus personId / date / hours…).
 */
/** "every day", "every Monday", "weekly", "monthly"… → { repeat, weekday?, match, index } */
function findRepeat(text) {
  for (const [pattern, repeat] of REPEAT_RULES) {
    const match = text.match(pattern)
    if (match) {
      const weekday = match[1] ? WEEKDAYS.indexOf(match[1].toLowerCase()) : null
      return { repeat, weekday, match: match[0], index: match.index }
    }
  }
  return null
}

export function parseTask(text, now = new Date(), { ignore = {} } = {}) {
  const repeat = ignore.repeat ? null : findRepeat(text)
  // Blank out the repeat phrase (keeping positions) so "every Monday" isn't
  // read a second time as a one-off date.
  const rest = repeat
    ? text.slice(0, repeat.index) + ' '.repeat(repeat.match.length) + text.slice(repeat.index + repeat.match.length)
    : text
  const person = ignore.person ? null : findPerson(rest)
  let date = ignore.date ? null : findDate(rest, now)
  if (!date && repeat?.weekday != null) date = { date: nextWeekday(now, repeat.weekday), match: null, index: -1 }
  const time = ignore.time ? null : findTime(rest)
  const urgent = ignore.priority ? null : text.match(URGENT)

  let due
  if (date && time) due = atTime(date.date, time.hours, time.minutes)
  else if (date) {
    const tonight = /tonight/i.test(date.match ?? '')
    due = atTime(date.date, tonight ? 20 : 9)
  } else if (time) {
    due = atTime(now, time.hours, time.minutes)
    if (due.getTime() < now.getTime() - MINUTE) due = addDays(due, 1)
  } else due = defaultDueTime(now)

  return {
    title: cleanTitle(text, [person, date, time, repeat]),
    assigneeId: person?.personId ?? null,
    dueAt: due,
    priority: urgent ? 'high' : null,
    repeat: repeat?.repeat ?? 'none',
    detected: {
      person: person && { text: person.match.trim(), personId: person.personId, self: !!person.self },
      // A date implied by "every Monday" has no text of its own; it shows with the repeat.
      date: date?.match ? { text: date.match.trim(), date: date.date } : null,
      time: time && time.match ? { text: time.match, hours: time.hours, minutes: time.minutes } : null,
      priority: urgent && { text: urgent[0] },
      repeat: repeat && { text: repeat.match.trim(), repeat: repeat.repeat },
    },
  }
}
