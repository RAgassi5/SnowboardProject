# SnowTrip Planner — Backend

Node.js + Express REST API for the SnowTrip Planner application. Serves resort data, user management, trip planning, AI-powered recommendations, and weather forecasts. All data is held in-memory — no database is required.

> Full API reference with request/response examples is in [`docs/README.md`](docs/README.md).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [npm Scripts](#npm-scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Route Summary](#api-route-summary)
- [Universal Response Format](#universal-response-format)
- [Role-Based Access Control](#role-based-access-control)
- [Data Models](#data-models)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **Node.js** 18+ (required — uses native `fetch` for weather API calls)
- **Express** 5.2.1
- **No database** — all data lives in `models/` as JavaScript arrays
- **No ORM, no build step** — plain CommonJS modules

---

## Installation and Running

```bash
cd server
npm install
npm start
# → Server running on http://localhost:3000
```

The server port is hard-coded to `3000` in `server.js`.

---

## npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Start the server |
| `npm run dev` | `node server.js` | Alias for start (no hot-reload) |
| `npm test` | — | No tests configured |

There is no `nodemon` or hot-reload. Restart the server manually after code changes.

---

## Environment Variables

**None required.** The backend has no `.env` file and no external service keys.

The only configurable value is the port, which is hard-coded on line 65 of `server.js`:

```js
const PORT = 3000;
```

---

## Project Structure

```
server/
├── server.js              ← Express app: middleware, CORS, route mounting, error handler
├── package.json
├── controllers/           ← Business logic, one file per resource group
│   ├── authController.js
│   ├── userController.js
│   ├── resortController.js
│   ├── tripController.js
│   ├── resortLocationController.js
│   └── aiController.js
├── routes/                ← Express Router definitions, one file per resource group
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── resortRoutes.js
│   ├── tripRoutes.js
│   ├── resortLocationRoutes.js
│   └── aiRoutes.js
├── models/                ← In-memory data arrays (reset on restart)
│   ├── users.js
│   ├── resorts.js
│   ├── trips.js
│   ├── resortLocations.js
│   ├── weatherLogs.js
│   ├── skillLevels.js
│   ├── gearRecommendations.js
│   └── locationSuggestions.js
├── middleware/
│   ├── auth.js            ← Role-based access control (reads x-user-role header)
│   └── logger.js          ← HTTP request logger (method, URL, status, duration)
└── docs/
    └── README.md          ← Full API reference
```

---

## API Route Summary

Routes are mounted in `server.js` with these prefixes:

| Prefix | Router file | Description |
|---|---|---|
| `/auth` | `authRoutes.js` | Login and registration |
| `/users` | `userRoutes.js` | User CRUD, user trips |
| `/resorts` | `resortRoutes.js` | Resort CRUD, forecast, in-resort locations |
| `/trips` | `tripRoutes.js` | Trip CRUD |
| `/resort-locations` | `resortLocationRoutes.js` | Resort location (POI) CRUD |
| `/` (root) | `aiRoutes.js` | Resort recommendations, gear advice, resort assistant |

### Key Endpoints

```
POST   /auth/login
POST   /auth/register

GET    /resorts
GET    /resorts/:id
GET    /resorts/:id/forecast
GET    /resorts/:id/locations
POST   /resorts
PUT    /resorts/:id
DELETE /resorts/:id

GET    /trips/:id
POST   /trips
PUT    /trips/:id
DELETE /trips/:id

GET    /users
GET    /users/:id
GET    /users/:id/trips
POST   /users
PUT    /users/:id
DELETE /users/:id

GET    /resort-locations
POST   /resort-locations
PUT    /resort-locations/:id
DELETE /resort-locations/:id

POST   /recommend-resorts
POST   /gear-recommendation
POST   /resort-summary
POST   /resort-assistant
```

For full request/response details see [`docs/README.md`](docs/README.md).

---

## Universal Response Format

Every endpoint returns the same JSON envelope:

**Success**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Error**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resort with id 99 not found.",
    "details": {}
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Resource created (POST) |
| 400 | Validation error / missing required field |
| 403 | Role not permitted |
| 404 | Resource not found |
| 422 | Unprocessable — data present but logically invalid |
| 500 | Unexpected server error |

### Error Codes

| Code | Trigger |
|---|---|
| `VALIDATION_ERROR` | Missing or invalid request field |
| `NOT_FOUND` | Resource does not exist |
| `FORBIDDEN` | Role not permitted to perform the action |
| `NO_COORDINATES` | Resort missing latitude/longitude for weather |
| `INTERNAL_SERVER_ERROR` | Unhandled exception |

---

## Role-Based Access Control

Every protected endpoint reads the `x-user-role` header. The `auth` middleware in `middleware/auth.js` compares it against the allowed roles array and returns `403` if the role is not permitted.

Send both headers on every authenticated request:

```
x-user-role: admin
x-user-id: 1
```

`x-user-id` is used for ownership checks (e.g., a `user` can only delete their own trips).

### Role Permission Summary

| Action | Roles |
|---|---|
| Public read (resorts, forecast, locations) | none required |
| Login / register | none required |
| Create trips, get recommendations | user, manager, admin |
| View all users and trips | manager, admin |
| Create / edit resorts and locations | manager, admin |
| Delete any resource | admin only |

---

## Data Models

All data is stored as JavaScript arrays in `models/`. Changes persist only until the server restarts.

| Model file | Records | Notes |
|---|---|---|
| `users.js` | 5 | Skill levels 1–5, mixed ski/snowboard |
| `resorts.js` | 5 | Europe: CH, FR, AT, IT. All have `latitude`/`longitude` |
| `trips.js` | 4 | Across multiple users and resorts |
| `resortLocations.js` | 8 | Lifts, slopes, restaurants, parks, rentals |
| `weatherLogs.js` | 15 | 3 historical entries per resort |
| `skillLevels.js` | 5 | Label/description lookup |
| `gearRecommendations.js` | — | Gear lists by sport and skill level |
| `locationSuggestions.js` | — | AI tip templates by location type and sport |

---

## Troubleshooting

**`Cannot find module '../models/weatherLogs'`**
The `weatherLogs.js` file has been deleted. Restore it or update `resortController.js` to remove the import.

**`Error: listen EADDRINUSE :3000`**
Port 3000 is already in use. Find and stop the existing process:
```bash
lsof -i :3000       # macOS/Linux
# then kill <PID>
```

**CORS errors from the browser**
The frontend is running on a port other than 5173. Update the `Access-Control-Allow-Origin` header in `server.js` (line 19) to match.

**All data is gone after restart**
Expected — in-memory storage only. Re-register or use the seeded demo credentials.

**Weather endpoint returns a 500 error**
The server is making an outbound request to `archive-api.open-meteo.com`. Check your internet connection. No API key is needed.
