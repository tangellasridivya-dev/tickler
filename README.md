# Tickler

A personal and family task assistant, built as a React + Vite PWA.

## Scripts

```bash
npm run dev      # start the dev server
npm test         # run unit tests (Vitest)
npm run lint     # lint with oxlint
npm run build    # production build with service worker
```

On Windows PowerShell, use `npm.cmd` if script execution is disabled.

## Structure

- `src/domain/` – task model, selectors (summary counts, sorting, filters,
  reminders) and the rule-based suggestion engine. Pure functions, unit tested.
- `src/data/` – people, sample data and the task repository (localStorage today,
  async so it can be swapped for an API).
- `src/state/` – task store, toasts and app-wide dialogs.
- `src/pages/home/` – the Home page: greeting, progress line, All / To me / By me
  filters and the date board.
- `src/styles/tokens.css` – Fluent-style design tokens for the light and dark themes.

## Filters

- **To me** (Home): tasks other people gave you that you accepted.
- **By me** (Home): tasks you assigned to other people.
- **My tasks** (side menu, `#/mine`): tasks you made for yourself, with the
  overload suggestion.

## How the numbers are defined

Only tasks you are responsible for count.

- **Left to do**: open tasks due today or earlier (includes overdue).
- **Done today**: tasks completed today, whenever they were due.
- **Overdue**: open tasks whose due time has passed.
- **Progress**: done today ÷ (left to do + done today).

## Suggestions

Tickler checks whether the estimated time of today's tasks fits before each
deadline and before your day ends (9:00 PM by default). If not, it suggests moving
flexible, non-high-priority tasks you created yourself to tomorrow. It never
moves tasks from other people or firm deadlines, and nothing changes until you
apply it.

## Testing states in development

Add a query string to the dev URL:

- `?simulate=load-error` – tasks fail to load
- `?simulate=save-error` – creating or updating a task fails
- `?simulate=empty` – a brand-new user with no tasks

To restore the sample data, clear the site's storage in your browser.

## People and photos

The household and circle live in `src/data/people.js`. Profile pictures are free
portraits from [Unsplash](https://unsplash.com) (Unsplash License); replace each
`photo` with a real picture URL (or a file in `public/`). They are cached for
offline use once seen, and coloured initials show if a photo can't load.

## Task requests and notifications

A task someone gives you starts as a request (`acceptance: 'pending'`). It stays
off your Home board, counts and reminders until you accept it on the
Notifications page (the bell), which lists task requests LinkedIn-style.
Tasks you give others show "Awaiting acceptance" under By me until they accept. The app follows the device's light/dark setting.

## New task: type it as a sentence

The chat-style box at the bottom of Home (and the fuller New task page, `#/new`,
opened from its options button) reads who, when and urgency from what you type,
for example "Ask Maya to pick up milk tomorrow at 6pm urgent". Detection is
rule-based and runs offline (`src/domain/parseTask.js`, with tests); each
detection shows as a chip that can be removed, and person, time and priority
can also be set by hand.

## Brand

"Tickler Teal": teal primary (`#0B7D73` buttons, `#0A7368` text), coral accent
(`#FF7A59`), soft teal-grey neutrals, with matching dark-theme values. All
colours live in `src/styles/tokens.css`.

## Everyday features

- Edit, move to tomorrow and delete (with undo) from a task's card; tasks from
  other people stay theirs to change.
- Repeating tasks (every day / week / month): finishing one adds the next.
- Decline a request from the Notifications page.
- Reminders fire while the app is open or running in the background, as an
  in-app message and, if allowed, a system notification. Reminders while the
  app is fully closed need a push server (not built yet).
- "Remind" on By me tasks opens the share sheet (or WhatsApp) with a ready
  message; nothing is sent automatically.
- The sentence reader understands common Hindi and Telugu words (aaj, kal,
  parso, repu, shaam, sayantram, Amma ko…).

Not built yet: accounts and sync between family members, which need a backend.
