# SnowTrip Planner — Frontend

React single-page application for the SnowTrip Planner. Provides resort browsing, trip planning, weather forecasts, AI-powered recommendations, gear advice, and an admin/manager management panel.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [npm Scripts](#npm-scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Components](#components)
- [API Service Layer](#api-service-layer)
- [Authentication and localStorage](#authentication-and-localstorage)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **React** 18.3.1
- **React Router DOM** 6.28.0 — client-side routing
- **Create React App** 5 — build tooling, dev server
- **react-snowfall** 2.4.0 — decorative snowfall animation
- **Plain CSS** with CSS custom properties (no CSS framework)
- **Native `fetch`** for API calls (no Axios)

---

## Installation and Running

```bash
cd client
npm install
npm start
# → http://localhost:5173
```

The backend must also be running at `http://localhost:3000`. See the root README for full setup instructions.

---

## npm Scripts

| Script | Description |
|---|---|
| `npm start` | Start the development server on port 5173 |
| `npm run build` | Create an optimised production build in `build/` |
| `npm test` | Run the test suite with Jest (no tests written yet) |
| `npm run eject` | Eject from Create React App (irreversible) |

---

## Environment Variables

`client/.env` is committed to the repo with a single variable:

```
PORT=5173
```

This overrides Create React App's default port (3000) to avoid colliding with the backend. If you change this port you must also update the CORS origin in `server/server.js`.

No other environment variables are used. The API base URL is hard-coded in `src/services/api.js`:

```js
export const API_BASE_URL = 'http://localhost:3000';
```

---

## Project Structure

```
client/src/
├── App.js               ← BrowserRouter, all route definitions
├── index.js             ← ReactDOM.createRoot entry point
├── index.css            ← Global design system (dark arctic theme, CSS variables)
├── pages/               ← One component per route
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── PlanTripPage.jsx
│   ├── TripsPage.jsx
│   ├── TripDetailsPage.jsx
│   ├── ResortsPage.jsx
│   ├── SettingsPage.jsx
│   └── ManagementPage.jsx
├── components/          ← Reusable UI components
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProtectedRoute.jsx
│   ├── ResortCard.jsx
│   ├── TripCard.jsx
│   ├── RecommendationCard.jsx
│   ├── GearAdvisorModal.jsx
│   ├── DataTable.jsx
│   ├── ConfirmDialog.jsx
│   ├── ErrorMessage.jsx
│   └── LoadingSpinner.jsx
└── services/
    └── api.js           ← Central API client
```

---

## Pages

| Route | Component | Auth required | Description |
|---|---|---|---|
| `/login` | `LoginPage` | No | Email/password login with demo credential tiles |
| `/register` | `RegisterPage` | No | Registration form with sport type and skill level |
| `/dashboard` | `DashboardPage` | Yes | Welcome hero, recent trips preview, quick links |
| `/plan-trip` | `PlanTripPage` | Yes | AI resort recommendations + weather + trip save |
| `/trips` | `TripsPage` | Yes | All saved trips, delete with confirmation |
| `/trips/:tripId` | `TripDetailsPage` | Yes | Trip overview, weather, AI summary, locations, gear advisor |
| `/resorts` | `ResortsPage` | Yes | Sortable/searchable resort table with summary stats |
| `/settings` | `SettingsPage` | Yes | Profile card, edit name and preferences |
| `/management` | `ManagementPage` | Yes (manager/admin) | CRUD panel for users, resorts, and resort locations |

All protected routes are wrapped in `ProtectedRoute`, which redirects to `/login` if no user is found in `localStorage`.

---

## Components

| Component | Used for |
|---|---|
| `Layout` | Shared shell — Navbar + `<Outlet>` + Footer, snowfall animation |
| `Navbar` | Top navigation, hamburger on mobile, role-aware links |
| `Footer` | Page footer |
| `ProtectedRoute` | Auth guard — redirects unauthenticated users to `/login` |
| `DataTable` | Generic sortable table with configurable columns and empty state |
| `TripCard` | Trip summary card used in TripsPage |
| `ResortCard` | Resort summary card (currently unused in routing, available for reuse) |
| `RecommendationCard` | AI resort recommendation card in PlanTripPage |
| `GearAdvisorModal` | Floating action button + modal for gear recommendations |
| `ConfirmDialog` | Modal confirmation dialog (used for delete actions) |
| `ErrorMessage` | Dismissable inline error banner |
| `LoadingSpinner` | Centered spinner with optional message |

---

## API Service Layer

**File:** `src/services/api.js`

All backend communication goes through a central `request()` helper function. You never call `fetch` directly from a page component.

### How it works

1. Prepends `http://localhost:3000` to every path
2. Attaches `Content-Type: application/json`
3. Reads `x-user-role` and `x-user-id` from `localStorage` and attaches them as headers
4. Unwraps the backend's `{ success, data, error }` envelope — returns only `data` on success
5. Throws a readable `Error` with `error.message` from the backend on failure
6. Catches network failures with a friendly "backend not running" message

### Exported functions

| Function | Endpoint | Description |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | Returns `{ message, user }` |
| `register(payload)` | `POST /auth/register` | Returns `{ message, user }` |
| `getResorts(filters)` | `GET /resorts` | Supports `country` and `difficultyLevel` filters |
| `getResortById(id)` | `GET /resorts/:id` | Single resort |
| `getResortForecast(id)` | `GET /resorts/:id/forecast` | Weather forecast for a resort |
| `getResortLocations(id, type)` | `GET /resorts/:id/locations` | POIs for a resort |
| `createResort(payload, role)` | `POST /resorts` | Admin/manager only |
| `updateResort(id, payload, role)` | `PUT /resorts/:id` | Admin/manager only |
| `deleteResort(id, role)` | `DELETE /resorts/:id` | Admin only |
| `getAllUsers(role)` | `GET /users` | Manager/admin only |
| `getUserById(id)` | `GET /users/:id` | Manager/admin only |
| `getUserTrips(id)` | `GET /users/:id/trips` | Own trips (user) or any (admin) |
| `updateUser(id, payload)` | `PUT /users/:id` | Update profile |
| `deleteUser(id, role)` | `DELETE /users/:id` | Admin only |
| `getAllTrips(role)` | `GET /trips` | Manager/admin only |
| `getTripById(id)` | `GET /trips/:id` | Any logged-in user |
| `createTrip(payload, role)` | `POST /trips` | Any logged-in user |
| `updateTrip(id, payload)` | `PUT /trips/:id` | Any logged-in user |
| `deleteTrip(id)` | `DELETE /trips/:id` | Any logged-in user (own trips) |
| `getAllLocations(role)` | `GET /resort-locations` | Manager/admin only |
| `createLocation(payload, role)` | `POST /resort-locations` | Admin/manager only |
| `updateLocation(id, payload, role)` | `PUT /resort-locations/:id` | Admin/manager only |
| `deleteLocation(id, role)` | `DELETE /resort-locations/:id` | Admin only |
| `recommendResorts(payload, role)` | `POST /recommend-resorts` | AI resort ranking |
| `getGearRecommendation(payload, role)` | `POST /gear-recommendation` | Sport-specific gear list |
| `getResortSummary(payload)` | `POST /resort-summary` | AI suitability summary |
| `getResortAssistant(payload, role)` | `POST /resort-assistant` | In-resort location tips |

---

## Authentication and localStorage

On successful login or registration the user object is stored in `localStorage` under the key `snowtrip_user`:

```json
{
  "userId": 1,
  "firstName": "Roii",
  "lastName": "Agassi",
  "email": "roii@example.com",
  "userRole": "admin",
  "sportType": "snowboard",
  "skillLevel": 5
}
```

`ProtectedRoute` reads this key — if it is absent or unparseable the user is redirected to `/login`. `getStoredUser()` and `getStoredRole()` in `api.js` are the helpers used throughout the app to read this value.

Logging out clears this key and redirects to `/login`.

---

## Troubleshooting

**Blank page — nothing renders**
Open the browser console. A common cause is the backend not running (network error on the first API call). Start the backend with `cd server && npm start`.

**"Cannot connect to the server" error banner**
The API base URL (`http://localhost:3000`) is unreachable. Make sure the backend server is running.

**Stuck on `/login` even after logging in**
`localStorage` may have stale or corrupt data. Open DevTools → Application → Local Storage → delete the `snowtrip_user` key and try again.

**Port 5173 already in use**
Update `client/.env` to a free port and update `server/server.js` line 19 to match.

**`npm install` is very slow or fails**
Delete `node_modules/` and `package-lock.json`, then run `npm install` again:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Management page is blank or shows "Access denied"**
The management panel is visible only to `manager` and `admin` roles. Log in with one of the admin or manager demo accounts.

**Snowfall animation is laggy**
The `react-snowfall` component runs in `Layout.jsx`. It can be disabled in the Settings page (decorative snowfall preference).
