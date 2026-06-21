# Deadline — a deadline-first task manager

Finish today's work and instantly know what to do next. Break big tasks into
**daily milestones**, map them across your week, and let the app surface the
next thing by its **assigned day** — not by when you created it.

Built because Todoist doesn't give you a visual map of self-imposed deadlines.

---

## Features

- **Milestone breakdown** — every task has a deadline and breaks into daily
  milestones, each assigned to a specific day. A deterministic
  **Distribute** helper spreads N milestones evenly from today to the deadline
  (no AI — just date math).
- **What's next** — the home view. Shows what's due today; once today is clear,
  it surfaces the next pending milestone, ordered by assigned day → deadline.
  Overdue items float to the top.
- **Timeline** — 14 day-cards you can page through by week. Horizontal on
  desktop, stacked on mobile. Gaps and clusters are obvious at a glance.
- **Board** — a Kanban bucketed by deadline (Overdue / Today / This week /
  Upcoming / Done), not arbitrary columns.
- **Weekly planning** — a Sunday flow: scan the week's deadlines, spot tasks
  that aren't broken down yet, and distribute milestones into days.
- **Areas** — Study, Intern Work, Personal Projects (editable, color-coded).
  Filter every view by area.
- **Labels** — `feat` / `chore` / `explore`, filterable.
- **Progress** — per-task progress rings everywhere.
- **Keyboard** — press <kbd>N</kbd> to add a task. Dark mode by default.

## Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** with a Linear-inspired dark theme
- **Zustand** for state, persisted to **localStorage**
- **Motion** (Framer Motion) for animation
- **shadcn/ui**-style primitives + **[unlumen UI](https://ui.unlumen.com)**
  animated components (`kbd`, `glowing-badge`, `count-up`)

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

> The app ships with realistic sample data (including a
> *Sarvam AI + Twilio + LiveKit* build). Open **Areas & data** in the sidebar to
> reset or clear it.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — framework
   auto-detects as Next.js, no env vars needed.
3. Deploy. (Or run `npx vercel` from this folder.)

## Project structure

```
app/                  Routes: / (what's next), /timeline, /board, /planning
components/
  ui/                 shadcn-style primitives (button, card, dialog, …)
  unlumen/            unlumen UI components (kbd, glowing-badge, count-up)
  *.tsx               Views & widgets (whats-next, timeline-view, …)
lib/
  types.ts            Area / Task / Milestone / Label models
  store.ts            Zustand store + localStorage persistence layer
  selectors.ts        "What's next", kanban buckets, progress (pure functions)
  date.ts             All deadline math (ISO date-only strings)
  seed.ts             Sample data, anchored to today
  colors.ts           Area/label color maps
```

### Notes on components

The base primitives in `components/ui` are written in the shadcn style
(Tailwind + `cva`) but kept dependency-light for a clean first build. The
project is fully shadcn-compatible — `components.json` is configured (including
the **`@unlumen-ui`** registry), so once dependencies are installed you can pull
official components via the CLI:

```bash
npx shadcn@latest add button dialog        # official shadcn primitives
npx shadcn@latest add @unlumen-ui/command-menu   # more unlumen components
```

### Persistence & cloud sync

State is cached in `localStorage` and, when a database is configured, synced to
a small Vercel KV (Upstash Redis) store as a single JSON snapshot — so your
tasks follow you across devices. With no database, the app runs
localStorage-only and the sidebar shows **"Local only"**.

**Enable cloud sync (optional, ~4 clicks):**

1. Vercel dashboard → your project → **Storage** → **Create Database** →
   **Upstash for Redis** (KV).
2. Connect it to the project — Vercel injects `KV_REST_API_URL` /
   `KV_REST_API_TOKEN` (Upstash `UPSTASH_REDIS_REST_*` names also work).
3. **Redeploy.** The sidebar dot turns **Synced**, and your data now loads from
   the cloud on any device.

Sync is last-write-wins — built for one person across devices, not simultaneous
multi-device editing. It's a single shared store with **no login**, so protect
the deployment with Vercel password protection (or add app auth) if it holds
anything sensitive.

Server read/write lives in `app/api/state/route.ts`; the client bridge is
`components/sync-manager.tsx`.

### Passcode lock (optional)

Set an `APP_PASSCODE` env var in Vercel to require a passcode. The app then
shows an unlock screen and gates the data API; entering the passcode sets a
long-lived httpOnly cookie so **each device stays unlocked for a year**.
Optionally set `APP_AUTH_SECRET` to salt the device token. With no
`APP_PASSCODE`, the app stays open. Lock a device any time from the sidebar
lock button. Auth lives in `lib/auth.ts` + `app/api/auth/route.ts`.

### Install as an app (PWA)

Installable on phone, tablet, and desktop (web manifest + a service worker in
`public/sw.js`, registered by `components/pwa-register.tsx`):

- **Desktop / Android (Chrome, Edge):** click **Install app** in the sidebar,
  or use the browser's install icon in the address bar.
- **iPhone / iPad (Safari):** Share → **Add to Home Screen**.

Installed, it opens in its own window (no browser chrome) and the UI shell
works offline.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV / Upstash Redis — enables cloud sync |
| `APP_PASSCODE` | Require a passcode to use the app |
| `APP_AUTH_SECRET` | Optional salt for the device token |

## License

MIT — yours to do whatever with.
