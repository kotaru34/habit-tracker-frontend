# Habit & Goals Tracker Frontend

A single-page React application for tracking daily habits and long-term goals. The UI provides calendar-based progress visualization, reminder prompts, and CRUD flows for habits and goal steps powered by a REST API.

## Table of contents
- [Project overview](#project-overview)
- [Technology stack and rationale](#technology-stack-and-rationale)
- [Application architecture](#application-architecture)
- [Core UI and components](#core-ui-and-components)
- [Data flow and API interactions](#data-flow-and-api-interactions)
- [Authentication, authorization, and sessions](#authentication-authorization-and-sessions)
- [Key user journeys](#key-user-journeys)
- [Styling and UX notes](#styling-and-ux-notes)
- [Environment configuration](#environment-configuration)
- [Local development](#local-development)
- [Production build & preview](#production-build--preview)
- [Linting](#linting)

## Project overview
The app lets users register/login, create recurring habits with reminders, log daily check-ins, and define long-term goals with step-by-step breakdowns. A calendar highlights completion states, while dashboards surface today's habits and goal progress with modal-driven editing experiences.

## Technology stack and rationale
- **React 19** – Component-based UI with hooks for state/effect management and memoization to keep the single-page experience responsive.
- **Vite** – Dev server and bundler providing fast HMR, optimized builds, and first-class support for modern ESM React apps; commands are wired through `vite`, `vite build`, and `vite preview`.
- **Material UI (MUI)** – Prebuilt accessible components (buttons, dialogs, cards, app bar) that accelerate layouting, theming, and consistent spacing. Icons from `@mui/icons-material` supply semantic visuals for actions and statuses.
- **Axios** – Promise-based HTTP client used to communicate with the backend API, including token-based authorization headers and per-request user scoping.
- **React Calendar** – Calendar widget for rendering streak/highlight states and enabling day-level drill-down into habit history.
- **date-fns** – Lightweight date utilities leveraged via dependencies (prepared for formatting/logic alongside calendar usage).
- **ESLint 9** – Linting setup for modern React/JSX with hooks/refresh plugins to keep code quality high during development.

## Application architecture
- **Entry point**: `src/main.jsx` mounts `<App />` with React StrictMode for additional runtime checks.
- **App shell**: `src/App.jsx` bootstraps auth state from `localStorage`, configures Axios default authorization header, and chooses between the auth flow (`<AuthScreen />`) and the main dashboard (`<MainApp />`).
- **Single-route SPA**: Routing is implicit—authentication gates render either the auth screen or the dashboard, keeping navigation simple.
- **Component grouping**: Reusable dialogs (`HabitModal`, `GoalModal`, `GoalDetailsModal`) encapsulate CRUD logic; cards (`GoalCard`) and list views assemble dashboard sections.
- **Environment-driven API base**: The API root is read from `VITE_API_URL`, defaulting to `http://localhost:5000/api` for local backend parity.

## Core UI and components
### AuthScreen
- Presents login/register toggle with email/password (plus username on register) inside a centered card layout.
- Submits to `/auth/login` or `/auth/register` endpoints and surfaces backend validation errors inline.

### MainApp (dashboard)
- **Data loading**: Fetches habits, check-ins, and goals in parallel and tracks them in component state; memoizes date → habit completions map for calendar highlighting.
- **Top bar**: Displays brand title, current user identity, and a logout action via `AppBar`/`Toolbar`.
- **Calendar panel**: Uses `react-calendar` with custom tile highlighting to indicate none/partial/full completion for any past day; clicking a day opens a modal summarizing expected vs completed habits.
- **Goals panel**: Lists long-term goals via `GoalCard`, shows progress bars, status chips, and deadline context; plus a creation button wired to `GoalModal`.
- **Habits for today**: Card grid of habits scheduled for the current day, showing category chips, descriptions, frequencies, reminders, and check-in actions; supports editing/deleting per item.
- **Habits for other days**: Separate grid for habits not scheduled today, visually muted and non-interactive for check-ins.
- **Floating actions & modals**: FAB opens habit creation; modals for habit/goal CRUD and goal details (with steps) are mounted at root level to share API/user props.
- **Reminders**: Client-side timers trigger snackbars highlighting habits at their reminder time and temporarily accent the relevant card.

### HabitModal
- Dialog for creating or editing habits with fields for name, description, category, reminder time, and frequency (daily vs selected weekdays).
- Preloads categories from `/categories` when opened; toggles day checkboxes update the frequency payload before save.
- Persists via POST `/habits` or PUT `/habits/:id`, then refreshes dashboard data on success.

### GoalModal
- Dialog for creating/editing long-term goals with optional description and deadline fields; initializes state when opened.
- Saves via POST `/goals` or PUT `/goals/:id` with loading states to prevent duplicate submissions.

### GoalCard
- Compact card showing goal title, status chip (in progress/completed/overdue), deadline, and step progress bar; clicking opens goal details modal.

### GoalDetailsModal
- Displays goal description, aggregated progress, and an editable list of steps with checkboxes for completion, deletion, and new step creation inline.
- Mutations go through `/goals/:id/steps` and `/goal-steps/:id`, reflecting changes immediately and notifying the dashboard to refresh goal metrics.

## Data flow and API interactions
- **Base URL**: `VITE_API_URL` (fallback `http://localhost:5000/api`). All endpoints are relative to this base.
- **Auth endpoints**: `/auth/login`, `/auth/register` return `{ token, user }` which are persisted in `localStorage` and used to set Axios `Authorization: Bearer <token>` header globally.
- **Habit endpoints**: `GET /habits`, `POST /habits`, `PUT /habits/:id`, `DELETE /habits/:id`; reminder/frequency data included in payloads. User scoping is sent via `user-id` header where required.
- **Check-in endpoints**: `GET /checkins` loads historical completions; `POST /checkins` adds a check-in for a habit on today with `habit_id` and `checkin_date`.
- **Goal endpoints**: `GET /goals`, `POST /goals`, `PUT /goals/:id`, `DELETE /goals/:id`, plus `GET/POST /goals/:id/steps` and `PUT/DELETE /goal-steps/:id` for step management.
- **Error handling**: Errors are surfaced via console logs, inline error text on auth, or alert dialogs for mutation failures; destructive actions prompt `confirm` dialogs for safety.

## Authentication, authorization, and sessions
- **Session storage**: `{ token, user }` is serialized in `localStorage` to persist sessions across refreshes; initial load parses this blob and primes Axios headers before first render to avoid unauthorized requests.
- **Header propagation**: On auth state change, a `Bearer` token is set as Axios default header; clearing auth removes it and deletes storage entry. Many data endpoints also expect `user-id` headers for scoping and are provided alongside the token where needed.
- **Role model**: The UI assumes authenticated users; no role-based branching in the frontend—authorization is delegated to backend token validation and headers.

## Key user journeys
1. **Register or log in**
   - Open app → Auth card appears.
   - Choose *Log in* or *Sign up*, submit credentials → API returns token/user → dashboard loads with persisted session.
2. **Create a habit**
   - Click `+` FAB → Habit modal opens with categories and frequency controls.
   - Set reminder time and days → Save → Habit appears under “Habits for today” if scheduled; reminders schedule a snackbar at the specified time.
3. **Check in for today**
   - On dashboard, press **Check in** on a habit → POST `/checkins` → button locks to “Done”, calendar tile highlights, and today streak updates.
4. **Inspect history**
   - Click any day on the calendar → modal lists which habits were expected and whether they were completed/missed.
5. **Manage goals & steps**
   - Create or edit goals via the panel’s + button; click a goal to open details, add steps, toggle completion, or delete steps/entire goals with confirmation prompts.
6. **Logout**
   - Click **Logout** in the top bar → session cleared from state and storage → redirected to auth screen.

## Styling and UX notes
- MUI theming provides consistent padding, typography, and elevation; gradients and chips differentiate sections (calendar, goals, today/other habits) for quick scanning.
- Calendar tiles are colored with custom CSS classes `.highlight-completed` and `.highlight-partial` for full/partial completion; disabled tiles and scrollbars are also styled for a polished feel.
- Reminders surface as snackbars and temporary card highlights to draw user attention without being intrusive.

## Environment configuration
- Create a `.env` file (or set shell env) with:
  ```bash
  VITE_API_URL="https://your-backend.example.com/api"
  ```
- If omitted, the app defaults to `http://localhost:5000/api` suitable for local backend pairing.

## Local development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server with hot reload:
   ```bash
   npm run dev
   ```
3. Open the URL shown in the terminal (typically `http://localhost:5173`). The frontend will proxy API calls to `VITE_API_URL` or the localhost fallback.

## Production build & preview
- Generate an optimized build:
  ```bash
  npm run build
  ```
- Preview the build locally (serves `dist/`):
  ```bash
  npm run preview
  ```
Use this flow in CI/CD to produce assets for static hosting (e.g., Netlify, Vercel) or to attach to a backend’s static file server.

## Linting
Run ESLint to catch common issues:
```bash
npm run lint
```
The config includes React hooks and refresh plugins to enforce best practices during development.
