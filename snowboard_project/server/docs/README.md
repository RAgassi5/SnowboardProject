# SkiPlanner Backend API — v3

A Node.js + Express REST API for planning ski/snowboard trips.  
Uses in-memory mock data — no database required.

---

## Getting Started

### Prerequisites
- Node.js v18+ installed

### Installation

```bash
cd snowboard_project
npm install
```

### Running the Server

```bash
npm start
```

The server starts at: **http://localhost:3000**

> Data resets on every server restart (by design — no persistence).

---

## Skill Level Scale

All `skillLevel` fields now use a **5-point integer scale**:

| Level | Label | Description |
|-------|-------|-------------|
| `1` | First-Timer | Nursery slopes only |
| `2` | Novice | Green / Easy Blue runs |
| `3` | Intermediate | Confident on Red / Blue |
| `4` | Expert | Advanced / Black Diamonds |
| `5` | Pro/Freeride | Off-piste / Extreme terrain |

> `skillLevel` is sent as an **integer** (not a string) in all request bodies.

---

## Role-Based Access Control

Send the `x-user-role` header with every request that requires authentication.

| Method / Endpoint | Allowed Roles |
|-------------------|---------------|
| `POST /auth/register` | none required |
| `POST /auth/login` | none required |
| `POST /resort-summary` | none required |
| GET — public discovery (`/resorts`, `/resorts/:id`, `/resorts/:id/locations`, `/resorts/:id/forecast`) | none required |
| GET — own trip history (`/users/:id/trips`) | user, manager, admin |
| GET — sensitive lists (`/users`, `/users/:id`, `/trips`, `/resort-locations`) | manager, admin |
| `POST /recommend-resorts` | user, manager, admin |
| `POST /gear-recommendation` | user, manager, admin |
| `POST /resort-assistant` | user, manager, admin |
| POST (create resources) | manager, admin |
| PUT (update resources) | manager, admin |
| DELETE | admin only |

**Example header:** `x-user-role: admin`

---

## Universal Response Format

**Success:**
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## API Reference

### AUTHENTICATION

> No `x-user-role` header required for any auth route.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | none |
| POST | `/auth/login` | Login and retrieve user info | none |

---

**POST /auth/register — Request Body:**
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
> `sportType` values: `"ski"`, `"snowboard"`  
> `skillLevel` values: `1` (First-Timer) → `5` (Pro/Freeride) — integer required

**Response (201):**
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
      "createDate": "2025-02-10T10:00:00.000Z",
      "updateDate": "2025-02-10T10:00:00.000Z",
      "userRole": "user"
    }
  },
  "error": null
}
```

---

**POST /auth/login — Request Body:**
```json
{
  "email": "roii@example.com",
  "password": "password123"
}
```

**Response (200):**
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

---

### USERS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Get all users | admin, manager |
| GET | `/users/:id` | Get user by ID | admin, manager |
| GET | `/users/:id/trips` | Get all trips for a user | user, manager, admin |
| POST | `/users` | Create a new user | admin, manager |
| PUT | `/users/:id` | Update a user | admin, manager |
| DELETE | `/users/:id` | Delete a user | admin only |

**POST/PUT Body:**
```json
{
  "firstName": "Roii",
  "lastName": "Agassi",
  "userRole": "admin"
}
```
> `userRole` values: `"admin"`, `"manager"`, `"user"`

---

### RESORTS

Resort objects now include a `snowboardFriendly` boolean indicating whether the resort has minimal flat cat-tracks and is well-suited for snowboarders.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/resorts` | Get all resorts | none |
| GET | `/resorts?country=Switzerland` | Filter by country | none |
| GET | `/resorts?difficultyLevel=3` | Filter by difficulty | none |
| GET | `/resorts/:id` | Get resort by ID | none |
| GET | `/resorts/:id/locations` | Get locations for a resort | none |
| GET | `/resorts/:id/locations?type=lift` | Filter locations by type | none |
| GET | `/resorts/:id/forecast` | Get mock weather forecast | none |
| POST | `/resorts` | Create a new resort | admin, manager |
| PUT | `/resorts/:id` | Update a resort | admin, manager |
| DELETE | `/resorts/:id` | Delete a resort | admin only |

**POST/PUT Body:**
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
> `difficultyLevel` values: `1` → `5` (integer, matches skill level scale)  
> `snowboardFriendly`: `true` if the resort has minimal flat sections problematic for snowboarders

**Resort Difficulty Reference:**

| Resort | Level | Label | Snowboard Friendly |
|--------|-------|-------|--------------------|
| Zermatt | 4 | Expert | ✅ |
| Verbier | 5 | Pro/Freeride | ✅ |
| Les Deux Alpes | 3 | Intermediate | ✅ |
| Mayrhofen | 3 | Intermediate | ✅ |
| Livigno | 2 | Novice | ❌ (long cat-tracks) |

---

### TRIPS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/trips` | Get all trips (global list) | admin, manager |
| GET | `/trips/:id` | Get trip by ID | user, manager, admin |
| POST | `/trips` | Create a new trip | user, admin, manager |
| PUT | `/trips/:id` | Update a trip | user, admin, manager |
| DELETE | `/trips/:id` | Delete a trip | admin only |

**POST/PUT Body:**
```json
{
  "userId": 1,
  "resortId": 2,
  "startDate": "2025-02-10",
  "endDate": "2025-02-15"
}
```
> Dates must be valid ISO date strings. `startDate` must be strictly before `endDate`.

---

### RESORT LOCATIONS (Points of Interest)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/resort-locations` | Get all locations (global list) | admin, manager |
| GET | `/resort-locations/:id` | Get location by ID | user, manager, admin |
| POST | `/resort-locations` | Create a location | admin, manager |
| PUT | `/resort-locations/:id` | Update a location | admin, manager |
| DELETE | `/resort-locations/:id` | Delete a location | admin only |

**POST/PUT Body:**
```json
{
  "resortId": 1,
  "name": "Main Gondola",
  "type": "lift",
  "description": "Main gondola from village to mid-mountain"
}
```
> `type` values: `"lift"`, `"restaurant"`, `"slope"`, `"rental"`, `"park"`

---

### AI ROUTES

All AI routes except `/resort-summary` require a valid `x-user-role` header for logged-in personalization.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/resort-summary` | AI summary matching a resort to your skill level | none |
| POST | `/recommend-resorts` | Top 3 sport-specific resort recommendations | user, manager, admin |
| POST | `/gear-recommendation` | Sport & skill specific gear list | user, manager, admin |
| POST | `/resort-assistant` | Sport-tailored in-resort spot suggestions | user, manager, admin |

---

**POST /resort-summary**

No auth required. Compares the resort's difficulty level against the user's skill level and returns a natural-language summary.

```json
{
  "resortId": 2,
  "skillLevel": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resortId": 2,
    "resortName": "Verbier",
    "resortDifficultyLevel": 5,
    "resortDifficultyLabel": "Pro/Freeride (Off-piste/Extreme terrain)",
    "skillLevel": 3,
    "skillLevelLabel": "Intermediate (Confident on Red/Blue)",
    "summary": "Not recommended. Verbier is a Level 5 (Pro/Freeride (Off-piste/Extreme terrain)) resort and may be significantly too challenging for a Level 3 (Intermediate (Confident on Red/Blue)) rider. Consider a lower-rated resort first."
  },
  "error": null
}
```

---

**POST /recommend-resorts** — `x-user-role: user`

Returns the top 3 resorts scored by difficulty match, elevation, and sport-specific attributes (snowboard friendliness, backcountry access for level-5 riders).

```json
{
  "startDate": "2025-02-10",
  "endDate": "2025-02-17",
  "skillLevel": 5,
  "sportType": "snowboard"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "startDate": "2025-02-10",
    "endDate": "2025-02-17",
    "skillLevel": 5,
    "skillLevelLabel": "Pro/Freeride (Off-piste/Extreme terrain)",
    "sportType": "snowboard",
    "recommendations": [
      {
        "rank": 1,
        "resortId": 2,
        "resortName": "Verbier",
        "country": "Switzerland",
        "difficultyLevel": 5,
        "difficultyLabel": "Pro/Freeride (Off-piste/Extreme terrain)",
        "snowboardFriendly": true,
        "explanation": "Verbier in Switzerland is a Level 5 (Pro/Freeride) resort — ideal for your Pro/Freeride level. With legendary backcountry access and famous powder bowls at 3300m, it offers everything an elite snowboarder needs from 2025-02-10 to 2025-02-17."
      }
    ]
  },
  "error": null
}
```

---

**POST /gear-recommendation** — `x-user-role: user`

Returns a sport-specific and skill-level-specific gear list. Accepts `"ski"` or `"snowboard"` as `sportType`. Includes a warning if the resort is not snowboard-friendly.

```json
{
  "resortId": 5,
  "skillLevel": 2,
  "sportType": "snowboard"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resortId": 5,
    "resortName": "Livigno",
    "snowboardFriendly": false,
    "sportType": "snowboard",
    "skillLevel": 2,
    "skillLevelLabel": "Novice (Green/Easy Blue)",
    "suggestedGear": [
      "Beginner all-mountain snowboard (soft-medium flex)",
      "Strap bindings with easy highback adjustment",
      "Polarized goggles with anti-fog lens",
      "Moisture-wicking base layer",
      "Insulated waterproof jacket & pants",
      "Helmet"
    ],
    "warning": "Note: Livigno has long flat cat-tracks between sectors which can be challenging for snowboarders. Consider this when planning your route."
  },
  "error": null
}
```

**Ski example request:**
```json
{
  "resortId": 1,
  "skillLevel": 4,
  "sportType": "ski"
}
```

**Ski response (200):**
```json
{
  "success": true,
  "data": {
    "resortId": 1,
    "resortName": "Zermatt",
    "snowboardFriendly": true,
    "sportType": "ski",
    "skillLevel": 4,
    "skillLevelLabel": "Expert (Advanced/Black Diamonds)",
    "suggestedGear": [
      "Performance carving / freeride skis",
      "Stiff race-oriented ski boots",
      "Carbon composite poles",
      "Photochromic polarized goggles",
      "Technical Gore-Tex outerwear",
      "High-performance MIPS helmet",
      "Avalanche awareness kit for off-piste use"
    ]
  },
  "error": null
}
```

---

**POST /resort-assistant** — `x-user-role: user`

Returns sport-tailored in-resort suggestions. Snowboarders receive tips about snow parks and how to handle lifts; skiers receive tips about slalom runs and ski-in/ski-out restaurants.

```json
{
  "resortId": 4,
  "locationType": "park",
  "sportType": "snowboard"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resortId": 4,
    "resortName": "Mayrhofen",
    "sportType": "snowboard",
    "locationType": "park",
    "generalTip": "The snowpark is your playground — start on the beginner line (small kickers, butter boxes) and work your way up to rails, hips, and the halfpipe.",
    "inResortSpots": [
      {
        "locationId": 6,
        "name": "Mayrhofen Rental Shop",
        "description": "Full-service ski and snowboard rental shop at the base of the mountain"
      }
    ]
  },
  "error": null
}
```

**locationType tip comparison (ski vs snowboard):**

| `locationType` | Snowboard tip focus | Ski tip focus |
|----------------|--------------------|-|
| `slope` | Wide groomed blues, avoid flat cat-tracks | Red pistes, slalom / GS carving runs |
| `lift` | Gondolas & quads (avoid T-bars) | All lift types, peak-hour planning |
| `restaurant` | Wide sun terrace, après vibe | Ski-in/ski-out, south-facing terrace |
| `park` | Beginner line → rails → halfpipe | Small kickers → superpipe |
| `rental` | Soft boots, board length for weight | DIN settings, stiff boot fit |

---

## Mock Data Summary

| Resource | Count | Notes |
|----------|-------|-------|
| Users | 5 | skill levels span 1–5; mixed ski/snowboard |
| Resorts | 5 | Difficulty levels 2–5; `snowboardFriendly` flag added |
| Trips | 4 | Spanning multiple users and resorts |
| Resort Locations | 8 | Across 4 resorts, covering all location types |
| Weather Logs | 15 | 3 daily entries per resort |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Validation error / missing required fields |
| 403 | Forbidden — role not permitted |
| 404 | Resource not found by ID |
| 500 | Unexpected server error |

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Missing or invalid request field |
| `NOT_FOUND` | Resource does not exist |
| `FORBIDDEN` | Role not permitted to perform action |
| `INTERNAL_SERVER_ERROR` | Unhandled server exception |
