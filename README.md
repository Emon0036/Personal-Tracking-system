# Personal OS

Your private, local-first command center for productivity, learning, finance, and your future in AI/ML and software engineering.

## Features

- **Dashboard** — At-a-glance overview of tasks, study time, goals, and money
- **Tasks** — Create, filter, complete, and search tasks with priorities and deadlines
- **Habits** — Daily tracking with streaks, weekly consistency, and 30-day heatmap
- **Time Tracking** — Lightweight focus timer with course/skill linking and session history
- **Courses** — Track university courses with individually checkable topics and auto-calculated progress
- **Skills** — Technical skill levels with progress history over time
- **Projects** — Project lifecycle tracking connected to skills, goals, and tasks
- **Finance** — Income/expense tracking, budgets, and category breakdowns (BDT support)
- **Goals** — Academic, career, financial, and personal goals with interconnected progress
- **Information Hub** — AI/ML, software, competitions, hackathons, study abroad, scholarships from public sources
- **Analytics** — Deterministic charts and summaries that work without AI
- **AI Insights** — Optional AI-powered daily insights and "Ask My Data" queries
- **Backup/Restore** — Export and import all personal data as validated JSON
- **PWA** — Installable, responsive, offline-capable

## Screenshots

<!-- Add screenshots here -->

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for fast bundling
- **Tailwind CSS v4** for styling
- **React Router** for navigation
- **Zustand** for state management
- **IndexedDB** via `idb-keyval` for persistent local storage
- **Recharts** for analytics visualizations
- **Lucide React** for icons

## Architecture

```
React
  └── Zustand store
        └── IndexedDB (local-first, privacy-first)
              └── Backup/Restore JSON
```

Data flows: **React → Zustand → IndexedDB**. All personal data stays in the browser. No server, no cloud database, no authentication.

## Running Locally

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Vercel Deployment

1. Push to GitHub
2. Import the repository in Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

The `vercel.json` config handles rewrites for the SPA and PWA service worker.

## Environment Variables (Optional)

No required environment variables. AI is optional and configured on the **Insights** page:

- `VITE_AI_ENDPOINT` — OpenAI-compatible chat-completions endpoint (HTTPS or localhost)
- `VITE_AI_MODEL` — Model name
- `VITE_AI_API_KEY` — API key (never stored or backed up)

These are only entered in the UI, never committed, and never included in exports.

## Data Backup

- **Export**: Download `personal-os-backup.json` from Settings
- **Import**: Upload a backup file; validates before merging or replacing
- **Clear**: Remove all local data after confirming "CLEAR"

## Roadmap

- **Phase 1**: Foundation, dashboard, tasks, habits, time tracking
- **Phase 2**: Courses, skills, study sessions, projects, goals
- **Phase 3**: Finance, analytics, charts, budget management
- **Phase 4**: Information hub with public sources, competitions, hackathons
- **Phase 5**: AI insights, daily brief, weekly report, "Ask My Data"
- **Phase 6**: PWA polish, offline support, accessibility, performance

## Project Structure

```
src/
├── data/           # Model, validation, storage, Zustand store, tests
├── services/       # Information providers and AI abstraction
├── components/     # Reusable UI components (EntryForm, Shell, StudyChart)
├── pages/          # Route-level pages (Dashboard, CollectionPage, Timer, etc.)
├── lib/            # Analytics and utility functions
├── App.tsx         # Routing and error boundary
├── main.tsx        # Entry point with PWA registration
└── styles.css      # Tailwind + custom CSS
tests/              # Playwright end-to-end tests
scripts/            # Icon generation
public/             # Icons and static assets
```

## License

MIT
