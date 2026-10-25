// A small, varying "well done" for finishing a task.
//
// The same five words every single time stop registering after a day or two —
// the brain tunes out anything perfectly predictable. Rotating the wording
// keeps the acknowledgement feeling like a reaction rather than a receipt,
// which is the cheapest motivation there is. Deliberately mild: this fires
// several times a day, so anything louder would wear thin fast.
const LINES = ['Nice one', 'Sorted', 'One down', 'Good going', 'Done and dusted', 'Nicely done']

// Module-level on purpose: it only needs to avoid saying the same thing twice
// in a row within a session, not to be remembered between visits.
let last = -1

export function praise() {
  let index = Math.floor(Math.random() * LINES.length)
  if (index === last) index = (index + 1) % LINES.length
  last = index
  return LINES[index]
}
