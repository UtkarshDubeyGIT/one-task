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

### Persistence & future sync

State lives in `localStorage` today, but every read/write goes through the
Zustand store's actions and a single storage adapter in `lib/store.ts`. Adding
cloud sync later means swapping that adapter and wrapping the actions in API
calls — the components never touch storage directly.

## License

MIT — yours to do whatever with.
