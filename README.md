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

- **To me**: tasks you are responsible for, including ones you made for yourself.
- **By me**: tasks you assigned to other people.

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
placeholder portraits from [randomuser.me](https://randomuser.me); replace each
`photo` with a real picture URL (or a file in `public/`). They are cached for
offline use once seen, and coloured initials show if a photo can't load.

## Task requests and notifications

A task someone gives you starts as a request (`acceptance: 'pending'`). It stays
off your Home board, counts and reminders until you accept it on the
Notifications page (the bell). Tasks you give others show "Awaiting acceptance"
under By me until they accept. The app follows the device's light/dark setting.
