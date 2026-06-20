# SnowTrip Planner — Backend API

Node.js + Express REST API with Socket.IO real-time layer and Groq LLM AI features. Persists all data to MySQL via Sequelize ORM.

---

## Table of Contents

- [Quick Start](#quick-start)
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
  - [Trip Members](#trip-members)
  - [Resort Locations](#resort-locations)
  - [Social — Friends](#social--friends)
  - [AI Features](#ai-features)
  - [Dashboard](#dashboard)
- [Postman Collection](#postman-collection)
- [Socket.IO Events](#socketio-events)
- [Database Models](#database-models)
- [Error Codes](#error-codes)
- [Migration Instructions](#migration-instructions)

---

## Quick Start

```bash
cd server
npm install
cp .env.example .env      # fill in DB credentials + Groq key
npm run db:migrate        # create tables
npm run db:seed           # insert demo data
npm start                 # → http://localhost:3000
```

---

## npm Scripts

| Script | Description |
|---|---|
| `npm start` | Start the server |
| `npm run db:migrate` | Run all pending Sequelize migrations |
| `npm run db:seed` | Run all seeders (demo data) |
| `npm run db:reset` | Undo all migrations → migrate → seed (full reset) |

---

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=snowtrip_db
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

GROQ_API_KEY=gsk_your_groq_api_key_here
```

`GROQ_API_KEY` is read only by `utils/llm.js` on the server. It is never sent to the frontend.

---

## Project Structure

```
server/
├── server.js                  ← Express app: middleware, route mounts, error handler
├── socket.js                  ← Socket.IO: event handlers, online-user tracking
├── package.json
├── .env                       ← Secrets (gitignored)
├── .env.example               ← Placeholder template
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── resortController.js
│   ├── tripController.js
│   ├── resortLocationController.js
│   ├── aiController.js        ← AI endpoints incl. gear chat (real Groq LLM + rule-based fallback)
│   ├── friendController.js    ← Friend requests and friendships
│   ├── tripMemberController.js← Trip discovery, join, approve, leave
│   └── dashboardController.js ← Aggregated dashboard data for the logged-in user
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js          ← Also mounts social sub-routes
│   ├── resortRoutes.js
│   ├── tripRoutes.js          ← Also mounts discover + member sub-routes
│   ├── resortLocationRoutes.js
│   ├── aiRoutes.js
│   ├── socialRoutes.js        ← Friend request CRUD
│   ├── tripMemberRoutes.js    ← Approve / reject / remove members
│   └── dashboardRoutes.js
├── db/
│   ├── index.js               ← Sequelize instance + model registration + associations
│   ├── config.js              ← Sequelize CLI config (reads .env)
│   ├── models/                ← Model definitions (User, Resort, Trip, …)
│   ├── migrations/            ← One migration per table
│   └── seeders/               ← Demo data seeders
├── constants/                  ← Static lookup tables (skill levels, AI-fallback gear/location content) — not database data
├── utils/
│   └── llm.js                 ← Groq SDK client singleton
└── middleware/
    ├── auth.js                ← RBAC factory: auth(['user','admin'])
    └── logger.js              ← HTTP request logger
```

---

## Universal Response Format

Every endpoint returns the same JSON envelope:

**Success**
```json
{
  "success": true,
  "data": { "...": "..." },
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
x-user-role: user
x-user-id: 3
```

`x-user-role` is checked by `middleware/auth.js`. `x-user-id` is used for ownership checks.

| Action | Required role |
|---|---|
| Public read (resorts, forecast, locations) | none |
| Login / register | none |
| Social features, trips, recommendations | user, manager, admin |
| View all users and trips | manager, admin |
| Create / edit resorts and locations | manager, admin |
| Delete any resource | admin |

---

## Skill Level Scale

| Level | Label |
|---|---|
| 1 | First-Timer |
| 2 | Novice (Green / Easy Blue) |
| 3 | Intermediate (Confident on Red/Blue) |
| 4 | Expert (Advanced / Black Diamonds) |
| 5 | Pro/Freeride (Off-piste / Extreme) |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register a new user |
| POST | `/auth/login` | none | Login |

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
Response `201` — `data: { message, user: { userId, firstName, lastName, email, sportType, skillLevel, userRole } }`

**POST /auth/login**
```json
{ "email": "roii@example.com", "password": "password123" }
```
Response `200` — same shape as register.

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | manager, admin | All users |
| GET | `/users/search?q=<name\|email>` | any | Search users (excludes self) |
| GET | `/users/:id` | manager, admin | Single user |
| GET | `/users/:id/trips` | any | User's created trips |
| GET | `/users/:id/joined-trips` | any | Trips the user has been approved to join |
| GET | `/users/:id/friends` | any | User's friend list |
| GET | `/users/:id/friend-requests/received` | any | Incoming pending requests |
| GET | `/users/:id/friend-requests/sent` | any | Outgoing pending requests |
| GET | `/users/:id/invitations` | any | Pending trip invitations sent to this user |
| GET | `/users/:id/unread-counts` | any | Unread chat message counts per trip |
| POST | `/users` | manager, admin | Create user |
| PUT | `/users/:id` | manager, admin | Update user |
| DELETE | `/users/:id` | admin | Delete user |

> `GET /users/search` must appear in the route file **before** `GET /users/:id` to avoid Express treating "search" as an id.

---

### Resorts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/resorts` | none | All resorts (optional `?country=` `?difficultyLevel=`) |
| GET | `/resorts/:id` | none | Single resort |
| GET | `/resorts/:id/locations` | none | In-resort POIs (optional `?type=lift\|slope\|…`) |
| GET | `/resorts/:id/forecast` | none | Weather (optional `?startDate=&endDate=`) |
| POST | `/resorts` | manager, admin | Create resort |
| PUT | `/resorts/:id` | manager, admin | Update resort |
| DELETE | `/resorts/:id` | admin | Delete resort |

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

`terrainType` values: `groomed` · `powder` · `park` · `mixed` · `backcountry`

**Forecast modes** (auto-selected based on dates):
- `forecast` — trip starts within 16 days (live Open-Meteo forecast)
- `historical` — trip is in the past (archive API)
- `typical` — trip is beyond 16 days (3-year average for the same date range)

---

### Trips

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/trips` | manager, admin | All trips |
| GET | `/trips/discover` | any | Public + friends-only trips (excludes own) |
| GET | `/trips/:id` | any | Single trip |
| GET | `/trips/:id/members` | any | Members of a trip |
| POST | `/trips` | any | Create trip |
| POST | `/trips/:id/join` | any | Request to join a trip |
| POST | `/trips/:id/invite` | any (trip creator) | Invite a friend to join a trip |
| PUT | `/trips/:id` | any | Update trip |
| DELETE | `/trips/:id` | user=own only, admin=any | Delete trip |

> `GET /trips/discover` must appear **before** `GET /trips/:id` in the route file.

**POST /trips body:**
```json
{
  "userId": 1,
  "resortId": 2,
  "startDate": "2026-12-20",
  "endDate": "2026-12-27",
  "skillLevel": 3,
  "sportType": "snowboard",
  "privacy": "public",
  "maxMembers": 8
}
```

`privacy` values: `public` · `friends-only` · `private`

`maxMembers`: integer or `null` (no limit)

**GET /trips/discover** optional query params: `?sportType=ski` `?skillLevel=3`

---

### Trip Members

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/trip-members/:id/approve` | any | Creator approves a pending request |
| PUT | `/trip-members/:id/reject` | any | Creator rejects a pending request |
| DELETE | `/trip-members/:id` | any | Creator removes a member OR member leaves/cancels |

Ownership is enforced server-side via `x-user-id`.

---

### Resort Locations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/resort-locations` | manager, admin | All locations |
| GET | `/resort-locations/:id` | any | Single location |
| POST | `/resort-locations` | manager, admin | Create location |
| PUT | `/resort-locations/:id` | manager, admin | Update location |
| DELETE | `/resort-locations/:id` | admin | Delete location |

**POST/PUT body:**
```json
{
  "resortId": 1,
  "name": "Main Gondola",
  "type": "lift",
  "description": "Main gondola from village to mid-mountain"
}
```

`type` values: `lift` · `slope` · `restaurant` · `park` · `rental`

---

### Social — Friends

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/friend-requests` | any | Send friend request |
| PUT | `/friend-requests/:id/accept` | any | Accept (receiver only) |
| PUT | `/friend-requests/:id/reject` | any | Reject (receiver only) |
| DELETE | `/friendships/:id` | any | Remove a friendship |

**POST /friend-requests body:**
```json
{ "receiverId": 3 }
```

`senderId` is read from the `x-user-id` header — do not pass it in the body.

**Duplicate-request handling:**

| Scenario | Response |
|---|---|
| Same direction, pending | `409 FRIEND_REQUEST_ALREADY_EXISTS` |
| Same direction, rejected (re-request) | `201` — row updated to pending |
| Same direction, accepted (post-unfriend re-request) | `201` — row updated to pending |
| Reverse direction already pending | `409 FRIEND_REQUEST_ALREADY_EXISTS` (details include the existing requestId) |
| Already friends | `409 ALREADY_FRIENDS` |
| Self-request | `400 VALIDATION_ERROR` |

---

### AI Features

All AI calls happen **on the backend only**. The Groq API key is never sent to the browser. Each endpoint has a rule-based fallback if the LLM is unavailable.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resort-summary` | none | LLM suitability summary for resort + skill match |
| POST | `/recommend-resorts` | any | Top-3 scored resorts + LLM explanations |
| POST | `/gear-recommendation` | any | LLM tailored gear list + terrain warnings |
| POST | `/resort-assistant` | any | LLM sport-specific tips for a location type |
| POST | `/gear-chat` | any | Multi-turn conversational gear advisor for a trip |
| GET | `/gear-chat/:tripId` | any | Saved gear-chat history for current user + trip |
| DELETE | `/gear-chat/:tripId` | any | Clear saved gear-chat history for current user + trip |

**POST /resort-summary**
```json
{ "resortId": 1, "skillLevel": 3 }
```
Response `data`: `{ resortId, resortName, resortDifficultyLevel, resortDifficultyLabel, skillLevel, skillLevelLabel, summary }`

**POST /recommend-resorts**
```json
{
  "startDate": "2026-12-20",
  "endDate": "2026-12-27",
  "skillLevel": 3,
  "sportType": "snowboard"
}
```
Response `data`: `{ startDate, endDate, skillLevel, skillLevelLabel, sportType, recommendations: [{ rank, resortId, resortName, country, difficultyLevel, difficultyLabel, snowboardFriendly, explanation }] }`

**POST /gear-recommendation**
```json
{ "resortId": 1, "skillLevel": 4, "sportType": "snowboard" }
```
Response `data`: `{ resortId, resortName, snowboardFriendly, sportType, skillLevel, skillLevelLabel, suggestedGear: string[], aiGenerated: boolean, warning? }`

**POST /resort-assistant**
```json
{ "resortId": 1, "locationType": "slope", "sportType": "snowboard" }
```
`locationType` values: `lift` · `slope` · `restaurant` · `park` · `rental`

Response `data`: `{ resortId, resortName, sportType, locationType, generalTip, aiGenerated: boolean, inResortSpots: [{ locationId, name, description }] }`

> `aiGenerated` is `true` when the Groq LLM call succeeded, `false` when the response is rule-based fallback content from `server/constants/`. The frontend shows a small "AI advisor unavailable, showing standard recommendations" notice whenever `aiGenerated` is `false`, so fallback content is never silently presented as real AI output.

**POST /gear-chat**
```json
{
  "message": "What boots should I bring for icy conditions?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }],
  "context": { "tripId": 5, "resort": {}, "trip": {}, "rider": {}, "forecast": {} }
}
```
Response `data`: `{ reply: string }` — also persists the user message and the reply to `gear_chat_messages`.

**GET /gear-chat/:tripId**
Response `data`: `[{ role: 'user' | 'assistant', content: string }]` — conversation history for the current user (from `x-user-id`) and this trip.

**DELETE /gear-chat/:tripId**
Deletes all saved gear-chat messages for the current user + trip. Response `data`: `{ deleted: true }`.

---

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | any | Aggregated dashboard data for the logged-in user |

**GET /dashboard**

Returns everything the Dashboard page needs in a single call, computed in parallelized phases (`Promise.all` / `Promise.allSettled`) to avoid frontend waterfalls:

Response `data`: `{ nextTrip, attentionItems, aiSuggestions, conditionsWatch, resortSpotlight, recentActivity, recentTrips }`

- `nextTrip` — the user's soonest upcoming trip, or `null`
- `attentionItems` — pending join requests, friend requests, trip invitations, and unread chat messages that need the user's action
- `aiSuggestions` — AI-generated packing/prep suggestions for the next trip (Groq, with fallback)
- `conditionsWatch` — weather snapshot for upcoming trips
- `resortSpotlight` — a scored resort recommendation
- `recentActivity` — recent social/trip activity feed
- `recentTrips` — the user's most recently created/joined trips

---

## Postman Collection

A ready-to-import Postman collection covering every route group documented above (Auth, Users, Resorts, Trips, Trip Members, Resort Locations, Social — Friends, AI Features, Dashboard) is checked into this repo at:

```
server/docs/SnowTrip-Planner.postman_collection.json
```

Import it directly into Postman. It defines four collection variables: `baseUrl` (defaults to `http://localhost:3000`), and `adminId` / `managerId` / `userId`, pre-filled to match the seeded demo accounts (see root `README.md` → Demo Credentials).

---

## Socket.IO Events

Connect to `http://localhost:3000` with auth:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { auth: { userId: 3 } });
```

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `friends:online` | — (ack: `{ onlineFriendIds }`) | Get currently online friend IDs |
| `chat:join` | `{ tripId }` | Join a trip chat room |
| `chat:send` | `{ tripId, content }` (ack: `{ success }`) | Send a chat message |
| `chat:history` | `{ tripId }` (ack: `{ messages }`) | Fetch last 100 messages |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `user:online` | `{ userId }` | A friend came online |
| `user:offline` | `{ userId }` | A friend went offline |
| `chat:message` | `{ messageId, tripId, userId, firstName, lastName, content, createdAt }` | New message in a trip room |
| `chat:unread-update` | `{ tripId, count }` | Updated unread-message count for a trip, sent to a specific user's socket on join-clear or on a new message to a participant not currently viewing the chat |
| `friend:request` | `{ requestId, senderId, firstName, lastName }` | Sent to the receiver if online, when a friend request is sent or re-sent (`friendController.js`, not `socket.js`) |
| `trip:join-request` | `{ memberId, tripId, userId, firstName, lastName }` | Sent to the trip creator if online, when someone requests to join their trip (`tripMemberController.js`, not `socket.js`) |
| `trip:invitation` | `{ memberId, tripId, inviterFirstName, inviterLastName }` | Sent to an invited user if online, when a trip creator invites them (`tripMemberController.js`'s `inviteFriend()`, not `socket.js`) |

> **Note:** `friend:request`, `trip:join-request`, and `trip:invitation` are not registered in `socket.js`'s connection handler — they are emitted directly from `friendController.js` and `tripMemberController.js` via `getIO()` / `getUserSocketId()` (imported from `../socket`), at the point the underlying REST request succeeds. `friend:request` is consumed by `Navbar.jsx`, `ProfilePanel.jsx`, and `FriendsPage.jsx` to refresh their friend-request state. `trip:join-request` is consumed by `Navbar.jsx` (combined request badge), `DashboardPage.jsx` (Requires Attention card), and `TripDetailsPage.jsx` (pending member list, when the creator is viewing that trip) to refresh their join-request state live. **`trip:invitation` currently has no frontend listener** — the invitation is still visible to the invitee via `TripsPage.jsx`'s REST fetch (`getUserInvitations`) on page load, it just isn't live-pushed yet.

---

## Database Models

| Table | Key fields |
|---|---|
| `users` | id, firstName, lastName, email, password, sportType ENUM, skillLevel INT, userRole ENUM |
| `resorts` | id, name, country, elevation, terrainType ENUM, difficultyLevel INT, snowboardFriendly BOOL, latitude DECIMAL, longitude DECIMAL |
| `trips` | id, userId FK, resortId FK, title, startDate, endDate, skillLevel, sportType, privacy ENUM, maxMembers INT |
| `resort_locations` | id, resortId FK, name, type ENUM, description |
| `friend_requests` | id, senderId FK, receiverId FK, status ENUM — UNIQUE(senderId, receiverId) |
| `friendships` | id, user1Id FK, user2Id FK — UNIQUE(user1Id, user2Id) — enforce user1Id < user2Id |
| `trip_members` | id, tripId FK, userId FK, status ENUM — UNIQUE(tripId, userId) |
| `trip_messages` | id, tripId FK, userId FK, content TEXT |
| `trip_read_status` | id, userId FK, tripId FK, lastReadAt — UNIQUE(userId, tripId) |
| `gear_chat_messages` | id, tripId FK, userId FK, role ENUM('user','assistant'), content TEXT |

Sequelize uses `underscored: true` — camelCase JS fields map to snake_case DB columns automatically.

---

## Error Codes

| Code | HTTP | Trigger |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing or invalid field |
| `UNAUTHORIZED` | 401 | Missing x-user-id header |
| `FORBIDDEN` | 403 | Role not permitted or not resource owner |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (generic) |
| `ALREADY_FRIENDS` | 409 | Friendship already exists |
| `FRIEND_REQUEST_ALREADY_EXISTS` | 409 | Duplicate friend request |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled exception |

---

## Migration Instructions

### First-time setup

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE snowtrip_db;"

# 2. Copy and fill in env
cp .env.example .env
# Edit DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, GROQ_API_KEY

# 3. Run migrations (creates all 10 tables in dependency order)
npm run db:migrate

# 4. Seed demo data
npm run db:seed

# 5. Start server
npm start
```

### Resetting the database

```bash
npm run db:reset    # undoes all migrations, re-migrates, re-seeds
```

### Running a single migration

```bash
npx sequelize-cli db:migrate --to 20260612000003-create-trips.js
```

### Undoing the last migration

```bash
npx sequelize-cli db:migrate:undo
```

### Migration file order

Migrations run in filename (timestamp) order. Foreign key dependencies are:

```
users → trips (userId)
resorts → trips (resortId)
users + resorts → trips
resorts → resort_locations
users → friend_requests (senderId, receiverId)
users → friendships (user1Id, user2Id)
trips + users → trip_members
trips + users → trip_messages
trips + users → trip_read_status
trips + users → gear_chat_messages
```
