import { currentUser, firstName, getPerson } from '../data/people.js'
import { formatDateTime } from './dates.js'

/**
 * "Remind": opens the device's share sheet (WhatsApp, SMS…) with a friendly
 * reminder the user sends themselves. Without sharing, the text is copied; if
 * that fails too, WhatsApp opens with it ready. Nothing is sent behind the user's back.
 */
export async function sendReminder(task, now, toast) {
  const person = getPerson(task.assigneeId)
  const text = `Hi ${firstName(person)}, a gentle reminder: “${task.title}” is due ${formatDateTime(task.dueAt, now).toLowerCase()}. – ${currentUser().name}`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Tickler reminder', text })
      return
    } catch (error) {
      if (error?.name === 'AbortError') return // the user closed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.show({ message: `Reminder for ${firstName(person)} copied. Paste it in WhatsApp or SMS.` })
  } catch {
    // No sharing or clipboard: open WhatsApp with the message ready; the user picks the contact.
    const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    if (!opened) toast.show({ tone: 'error', message: 'We couldn’t open sharing on this device.' })
  }
}
