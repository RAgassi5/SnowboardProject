# SnowTrip Planner — Backend API

Node.js + Express REST API for the SnowTrip Planner application. Serves resort data, user management, trip planning, AI-powered recommendations, and weather forecasts. All data is held in-memory — no database is required.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [npm Scripts](#npm-scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Universal Response Format](#universal-response-format)
- [Role-Based Access Control](#role-based-access-control)
- [Skill Level Scale](#skill-level-scale)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Resorts](#resorts)
  - [Trips](#trips)
  - [Resort Locations](#resort-locations)
  - [AI Routes](#ai-routes)
- [Data Models](#data-models)
- [HTTP Status Codes and Error Codes](#http-status-codes-and-error-codes)
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

The port is hard-coded to `3000` in `server.js`. Data resets on every restart by design.

---

## npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Start the server |
| `npm run dev` | `node server.js` | Alias for start (no hot-reload) |

There is no `nodemon` or hot-reload. Restart the server manually after code changes.

---

## Environment Variables

None required. The backend has no `.env` file and no external service keys.

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
├── routes/                ← Express Router definitions
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
└── middleware/
    ├── auth.js            ← Role-based access control (reads x-user-role header)
    └── logger.js          ← HTTP request logger (method, URL, status, duration)
```

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

---

## Role-Based Access Control

Send both headers on every authenticated request:

```
x-user-role: admin
x-user-id: 1
```

`x-user-role` is checked by the `auth` middleware against the allowed roles for each route. `x-user-id` is used for ownership checks (e.g. a `user` can only delete their own trips).

| Action | Roles |
|---|---|
| Public read (resorts, forecast, locations) | none required |
| Login / register | none required |
| Create trips, get recommendations | user, manager, admin |
| View all users and trips | manager, admin |
| Create / edit resorts and locations | manager, admin |
| Delete any resource | admin only |

---

## Skill Level Scale

All `skillLevel` fields use a **5-point integer scale**:

| Level | Label | Description |
|---|---|---|
| `1` | First-Timer | Nursery slopes only |
| `2` | Novice | Green / Easy Blue runs |
| `3` | Intermediate | Confident on Red / Blue |
| `4` | Expert | Advanced / Black Diamonds |
| `5` | Pro/Freeride | Off-piste / Extreme terrain |

> Send `skillLevel` as an **integer**, not a string.

---

## API Reference

### Auth

> No `x-user-role` header required.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and retrieve user info |

**POST /auth/register**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "sportType": "snowboard",
  "skillLevel": 3
}
```

Response `201`:
```json
{
  "success": true,
  "data": {
    "message": "Registration successful.",
    "user": {
      "userId": 6,
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "sportType": "snowboard",
      "skillLevel": 3,
      "userRole": "user"
    }
  },
  "error": null
}
```

**POST /auth/login**
```json
{ "email": "roii@example.com", "password": "password123" }
```

Response `200`:
```json
{
  "success": true,
  "data": {
    "message": "Login successful.",
    "user": {
      "userId": 1,
      "firstName": "Roii",
      "lastName": "Agassi",
      "email": "roii@example.com",
      "sportType": "snowboard",
      "skillLevel": 5,
      "userRole": "admin"
    }
  },
  "error": null
}
```

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | roii@example.com | password123 |
| Manager | chacha@example.com | password123 |
| User | lebron@example.com | password123 |

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | manager, admin | Get all users |
| GET | `/users/:id` | manager, admin | Get user by ID |
| GET | `/users/:id/trips` | user, manager, admin | Get trips for a user |
| POST | `/users` | manager, admin | Create a user |
| PUT | `/users/:id` | manager, admin | Update a user |
| DELETE | `/users/:id` | admin | Delete a user |

**POST/PUT body:**
```json
{
  "firstName": "Roii",
  "lastName": "Agassi",
  "userRole": "admin"
}
```

> `userRole` values: `"admin"`, `"manager"`, `"user"`

---

### Resorts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/resorts` | none | Get all resorts |
| GET | `/resorts?country=Switzerland` | none | Filter by country |
| GET | `/resorts?difficultyLevel=3` | none | Filter by difficulty |
| GET | `/resorts/:id` | none | Get resort by ID |
| GET | `/resorts/:id/locations` | none | Get in-resort locations |
| GET | `/resorts/:id/locations?type=lift` | none | Filter locations by type |
| GET | `/resorts/:id/forecast` | none | Get weather forecast |
| POST | `/resorts` | manager, admin | Create a resort |
| PUT | `/resorts/:id` | manager, admin | Update a resort |
| DELETE | `/resorts/:id` | admin | Delete a resort |

**POST/PUT body:**
```json
{
  "name": "Zermatt",
  "country": "Switzerland",
  "elevation": 3883,
  "terrainType": "mixed",
  "difficultyLevel": 4,
  "snowboardFriendly": true,
  "latitude": 46.0207,
  "longitude": 7.7491
}
```

> `terrainType` values: `"groomed"`, `"powder"`, `"park"`, `"mixed"`, `"backcountry"`

**Seeded resorts:**

| Resort | Country | Level | Snowboard Friendly |
|---|---|---|---|
| Zermatt | Switzerland | 4 — Expert | ✅ |
| Verbier | Switzerland | 5 — Pro/Freeride | ✅ |
| Les Deux Alpes | France | 3 — Intermediate | ✅ |
| Mayrhofen | Austria | 3 — Intermediate | ✅ |
| Livigno | Italy | 2 — Novice | ❌ (long cat-tracks) |

---

### Trips

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/trips` | manager, admin | Get all trips |
| GET | `/trips/:id` | user, manager, admin | Get trip by ID |
| POST | `/trips` | user, manager, admin | Create a trip |
| PUT | `/trips/:id` | user, manager, admin | Update a trip |
| DELETE | `/trips/:id` | admin | Delete a trip |

**POST/PUT body:**
```json
{
  "userId": 1,
  "resortId": 2,
  "startDate": "2025-02-10",
  "endDate": "2025-02-15"
}
```

> Dates must be ISO strings (`YYYY-MM-DD`). `startDate` must be strictly before `endDate`.

---

### Resort Locations

Points of interest within a resort (lifts, slopes, restaurants, parks, rentals).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/resort-locations` | manager, admin | Get all locations |
| GET | `/resort-locations/:id` | user, manager, admin | Get location by ID |
| POST | `/resort-locations` | manager, admin | Create a location |
| PUT | `/resort-locations/:id` | manager, admin | Update a location |
| DELETE | `/resort-locations/:id` | admin | Delete a location |

**POST/PUT body:**
```json
{
  "resortId": 1,
  "name": "Main Gondola",
  "type": "lift",
  "description": "Main gondola from village to mid-mountain"
}
```

> `type` values: `"lift"`, `"slope"`, `"restaurant"`, `"park"`, `"rental"`

---

### AI Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resort-summary` | none | AI suitability summary for a resort/skill match |
| POST | `/recommend-resorts` | user, manager, admin | Top 3 resort recommendations |
| POST | `/gear-recommendation` | user, manager, admin | Sport-specific gear list |
| POST | `/resort-assistant` | user, manager, admin | In-resort location tips by sport |

**POST /resort-summary**
```json
{ "resortId": 2, "skillLevel": 3 }
```

**POST /recommend-resorts**
```json
{
  "startDate": "2025-02-10",
  "endDate": "2025-02-17",
  "skillLevel": 5,
  "sportType": "snowboard"
}
```

Response includes a ranked `recommendations` array with `rank`, `resortId`, `resortName`, `country`, `difficultyLevel`, `snowboardFriendly`, and a natural-language `explanation`.

**POST /gear-recommendation**
```json
{
  "resortId": 5,
  "skillLevel": 2,
  "sportType": "snowboard"
}
```

Returns a `suggestedGear` array and an optional `warning` if the resort is not snowboard-friendly.

**POST /resort-assistant**
```json
{
  "resortId": 4,
  "locationType": "park",
  "sportType": "snowboard"
}
```

Returns a `generalTip` and an `inResortSpots` array of matched locations.

> `locationType` values: `"lift"`, `"slope"`, `"restaurant"`, `"park"`, `"rental"`

---

## Data Models

| File | Records | Notes |
|---|---|---|
| `users.js` | 5 | Skill levels 1–5, mixed ski/snowboard |
| `resorts.js` | 5 | All have `latitude` and `longitude` |
| `trips.js` | 4 | Across multiple users and resorts |
| `resortLocations.js` | 8 | Across 4 resorts, all location types covered |
| `weatherLogs.js` | 15 | 3 historical entries per resort |
| `skillLevels.js` | 5 | Label/description lookup table |
| `gearRecommendations.js` | — | Gear lists keyed by sport and skill level |
| `locationSuggestions.js` | — | AI tip templates by location type and sport |

---

## HTTP Status Codes and Error Codes

| Code | Meaning |
|---|---|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Validation error / missing required field |
| 403 | Role not permitted |
| 404 | Resource not found |
| 422 | Unprocessable — data present but logically invalid |
| 500 | Unexpected server error |

| Error Code | Trigger |
|---|---|
| `VALIDATION_ERROR` | Missing or invalid request field |
| `NOT_FOUND` | Resource does not exist |
| `FORBIDDEN` | Role not permitted for this action |
| `NO_COORDINATES` | Resort missing latitude/longitude (weather endpoint) |
| `INTERNAL_SERVER_ERROR` | Unhandled exception |

---

## Troubleshooting

**`Error: listen EADDRINUSE :3000`**
Port 3000 is already in use. Find and stop the process: `lsof -i :3000` then `kill <PID>`.

**CORS errors from the browser**
The frontend is running on a port other than 5173. Update the `Access-Control-Allow-Origin` value in `server.js` line 19.

**All data resets on restart**
Expected — in-memory only. Use the seeded demo credentials or re-register.

**Weather endpoint returns 500**
The server makes an outbound request to Open-Meteo. Check your internet connection. No API key is needed.
