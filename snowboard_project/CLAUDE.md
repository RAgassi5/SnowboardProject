# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Three things must run simultaneously: MySQL, backend, frontend.

**Backend** (port 3000):
```bash
cd server && npm start
```

**Frontend** (port 5173):
```bash
cd client && npm start
```

**Database setup** (first time, or after pulling new migrations):
```bash
cd server && npm run db:migrate && npm run db:seed
```

No lint configuration exists. Tests: `cd client && npm test` runs CRA's Jest, but no tests are written yet.

## Architecture

### Package Layout
`server/` and `client/` are independent npm packages with no shared workspace or monorepo tooling.

### Backend (`server/`)
- **Entry:** `server.js` — mounts middleware, all 9 route groups, socket.io, 404/error handlers
- **Pattern:** MVC — `routes/` define endpoints → `controllers/` handle business logic → `db/models/` are Sequelize models (MySQL)
- **Data layer:** Sequelize v6 + MySQL via `db/index.js`, which builds the connection, requires every model factory in `db/models/`, wires up all associations, and exports them. Schema lives in `db/migrations/`; demo rows are populated by `db/seeders/` (run once via `npm run db:seed`). All models use `underscored: true`.
- **`server/constants/`** holds static, hand-written lookup tables that are *not* database entities — `skillLevels.js` (1–5 skill scale labels), `gearRecommendations.js` and `locationSuggestions.js` (rule-based fallback content used only when the LLM call fails, see below). Don't confuse this with `db/models/` (the real Sequelize models).
- **Modules:** CommonJS (`require`/`module.exports`) throughout; no build step
- **AI features** (`aiController.js`, `dashboardController.js`) call Groq's `llama-3.3-70b-versatile` via `utils/llm.js` (`chat()` / `chatWithHistory()`). **AI calls are backend-only — the API key never reaches the frontend.** Each AI endpoint wraps the LLM call in try/catch and falls back to rule-based content from `server/constants/` if the call fails; the response includes an `aiGenerated: true/false` flag so the frontend can tell real AI output from the fallback.
- **Real-time:** `socket.js` runs a Socket.IO server for live presence (online/offline) and trip chat delivery. `onlineUsers`/`socketUsers` are in-process `Map`s for current connections (not a data store — actual messages persist via the `TripMessage` model).
- **Weather:** `resortController.js` (and a smaller inline helper in `dashboardController.js`) call Open-Meteo (free, no key) via Node 18+ native `fetch`. `GET /resorts/:id/forecast` accepts optional `?startDate=&endDate=` and picks one of three modes automatically:
  - `forecast` — trip starts within 16 days (Open-Meteo free-tier max, `FORECAST_HORIZON = 16`); if the end date exceeds the horizon, only the forecastable portion is returned (`partialForecast: true` in response)
  - `historical` — entire trip is in the past; uses `archive-api.open-meteo.com`
  - `typical` — trip is beyond the forecast horizon; averages the same date range across the 3 prior years from the archive API
  - No date params → returns a plain 7-day forecast
  - Response includes per-day data plus a `summary` object (avg temps, total snowfall/precipitation, avg wind) and a `confidence` field (`high`/`medium`/`low`)
- **Dashboard:** `GET /dashboard` (`dashboardController.js`) aggregates everything for the logged-in user — next upcoming trip, items needing attention (join requests, friend requests, invitations, unread messages), AI packing suggestions, weather watch for upcoming trips, a scored resort spotlight, recent activity, and recent trips — in one call, run in parallelized phases (`Promise.all` / `Promise.allSettled`) to avoid frontend waterfalls.

### Sequelize Associations (key aliases — `db/index.js`)
- `Trip.belongsTo(User, { foreignKey: 'userId', as: 'creator' })` — trip creator
- `Trip.belongsTo(Resort, { foreignKey: 'resortId' })` — no alias
- `TripMember.belongsTo(User, ...)` / `TripMember.belongsTo(Trip, ...)` — no aliases
- `FriendRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' })` and `{ foreignKey: 'receiverId', as: 'receiver' }`
- Trip creators are **not** rows in `TripMember` — only joined members are. Code that unions "my trips" must combine `Trip.findAll({ where: { userId } })` with approved `TripMember` rows to avoid double-counting.

### Frontend (`client/`)
- **Stack:** React 18 + Create React App, React Router v6
- **State:** Component-local `useState` only — no Redux, Zustand, or Context
- **API layer:** All HTTP calls go through `src/services/api.js`. The central `request()` helper automatically attaches auth headers from localStorage and unwraps the server's response envelope.
- **Styling:** Custom CSS design system in `src/index.css` (CSS custom properties, dark arctic theme). Component-specific styles use inline JS style objects.

### Auth Flow
1. Login stores the full user object in `localStorage` under key `snowtrip_user`
2. Every authenticated request sends two headers: `x-user-role` and `x-user-id`
3. Backend `middleware/auth.js` exports a factory `auth(allowedRoles[])` — usage: `router.delete("/:id", auth(["admin"]), handler)`
4. Three roles: `user` (own trips only), `manager` (resort/location management), `admin` (full delete rights)

### Response Envelope
Every API response uses `{ success: boolean, data: any, error: { code, message, details } | null }`. The frontend `api.js` unwraps this automatically and throws on `success: false`.

### CORS
Hardcoded to `http://localhost:5173` in `server.js`. Change there if ports differ.

## Key Files

| File | Purpose |
|---|---|
| `server/server.js` | Express app setup; all route mounts; socket.io init |
| `server/db/index.js` | Sequelize connection, model registration, all associations |
| `server/middleware/auth.js` | RBAC factory middleware |
| `server/constants/` | Static lookup tables (skill labels, AI-fallback gear/location content) — not database data |
| `server/utils/llm.js` | Groq LLM wrapper (`chat`, `chatWithHistory`) — only place AI calls are made |
| `server/socket.js` | Socket.IO server: presence + live chat delivery |
| `client/src/App.js` | All route definitions; `ProtectedRoute` wrapper |
| `client/src/services/api.js` | Single source of truth for all API calls |
| `client/src/index.css` | Global CSS custom properties and utility classes |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| admin | roii@example.com | password123 |
| manager | chacha@example.com | password123 |
| user | lebron@example.com | password123 |

Skill level is a 1–5 integer: 1 = First-Timer, 2 = Novice, 3 = Intermediate, 4 = Expert, 5 = Pro/Freeride (defined in `server/constants/skillLevels.js`).
