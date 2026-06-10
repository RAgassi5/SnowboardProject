# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Two terminals required — backend and frontend must run simultaneously.

**Backend** (port 3000):
```bash
cd server && npm start
```

**Frontend** (port 5173):
```bash
cd client && npm start
```

No lint configuration exists. Tests: `cd client && npm test` runs CRA's Jest, but no tests are written yet.

## Architecture

### Package Layout
`server/` and `client/` are independent npm packages with no shared workspace or monorepo tooling.

### Backend (`server/`)
- **Entry:** `server.js` — mounts middleware, all 6 route groups, 404/error handlers
- **Pattern:** MVC — `routes/` define endpoints → `controllers/` handle business logic → `models/` hold data
- **Data layer:** Plain JS arrays in `models/`. No database, no ORM. **All data resets on server restart.**
- **Modules:** CommonJS (`require`/`module.exports`) throughout; no build step
- **"AI" routes** (`aiController.js`) are rule-based lookups against `models/gearRecommendations.js` and `models/locationSuggestions.js`, not an external LLM. Mounted at root `/` in `server.js`.
- **Weather:** `resortController.js` calls Open-Meteo (free, no key) via Node 18+ native `fetch`. `GET /resorts/:id/forecast` accepts optional `?startDate=&endDate=` and picks one of three modes automatically:
  - `forecast` — trip starts within 16 days (Open-Meteo free-tier max, `FORECAST_HORIZON = 16`); if the end date exceeds the horizon, only the forecastable portion is returned (`partialForecast: true` in response)
  - `historical` — entire trip is in the past; uses `archive-api.open-meteo.com`
  - `typical` — trip is beyond the forecast horizon; averages the same date range across the 3 prior years from the archive API
  - No date params → returns a plain 7-day forecast
  - Response includes per-day data plus a `summary` object (avg temps, total snowfall/precipitation, avg wind) and a `confidence` field (`high`/`medium`/`low`)

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
| `server/server.js` | Express app setup; all route mounts |
| `server/middleware/auth.js` | RBAC factory middleware |
| `server/models/` | All seeded data (users, resorts, trips, locations, gear, skill levels) |
| `client/src/App.js` | All route definitions; `ProtectedRoute` wrapper |
| `client/src/services/api.js` | Single source of truth for all API calls |
| `client/src/index.css` | Global CSS custom properties and utility classes |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| admin | roii@example.com | password123 |
| manager | chacha@example.com | password123 |
| user | lebron@example.com | password123 |

Skill level is a 1–5 integer: 1 = First-Timer, 2 = Novice, 3 = Intermediate, 4 = Expert, 5 = Pro/Freeride (defined in `server/models/skillLevels.js`).
