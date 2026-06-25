# ❄️ SnowTrip Planner

A full-stack web application for planning ski and snowboard trips. Browse Alpine resorts, get AI-powered recommendations, view live weather forecasts, manage trips with privacy controls, discover and join other users' trips, add friends, and chat in real time — all wrapped in a dark arctic-themed UI.

> BGU Web Development — Full-Stack Assignment
> Roi Agassi

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Pages & Features](#pages--features)
- [API Endpoints](#api-endpoints)
- [Real-Time (Socket.IO)](#real-time-socketio)
- [AI Features (Groq LLM)](#ai-features-groq-llm)
- [Weather Integration](#weather-integration)
- [Roles & Permissions](#roles--permissions)
- [Demo Credentials](#demo-credentials)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

---

## Overview

SnowTrip Planner lets skiers and snowboarders:

- **Plan a trip** — enter dates and skill level, receive AI-ranked resort recommendations with weather forecasts, then save the trip with privacy and capacity settings.
- **Manage trips** — view all your trips, approve/reject join requests, invite friends, and chat with members in a live group chat.
- **Discover trips** — browse public and friends-only trips and request to join.
- **Connect socially** — search for users, send friend requests, see who is online, and exchange direct messages.
- **Track gear** — use a multi-turn AI gear advisor to build a packing list tailored to the resort and forecast.
- **Dashboard** — a single-screen command center aggregating your next trip, pending requests, weather alerts, AI packing suggestions, and recent activity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · React Router 6 · Create React App |
| Backend | Node.js 18+ · Express 5 |
| Database | MySQL 8+ · Sequelize v6 ORM |
| Real-Time | Socket.IO 4 (WebSockets) |
| AI | Groq API — `llama-3.3-70b-versatile` (backend-only) |
| Weather | Open-Meteo API (free, no key required) |
| Styling | Custom CSS design system — dark arctic theme |

---

## Project Structure

```
SnowboardProject/
└── snowboard_project/
    ├── client/                        React frontend (port 5173)
    │   └── src/
    │       ├── App.js                 Route definitions & ProtectedRoute
    │       ├── index.css              Global design system (CSS custom properties)
    │       ├── pages/                 Full-page route components
    │       ├── components/            Reusable UI components
    │       └── services/
    │           ├── api.js             Centralised HTTP client (auto-attaches auth headers)
    │           └── socket.js          Socket.IO singleton
    └── server/                        Express backend (port 3000)
        ├── server.js                  App entry point — middleware, routes, Socket.IO
        ├── socket.js                  Socket.IO event handlers
        ├── controllers/               Business logic (one file per domain)
        ├── routes/                    Express router definitions
        ├── middleware/
        │   └── auth.js                RBAC factory — auth(['admin', 'manager'])
        ├── db/
        │   ├── index.js               Sequelize connection, model imports, associations
        │   ├── models/                Sequelize model definitions
        │   ├── migrations/            Schema migration files
        │   └── seeders/               Demo data seeders
        ├── constants/                 Static lookup tables (skill labels, AI fallback content)
        └── utils/
            └── llm.js                 Groq LLM wrapper (chat / chatWithHistory)
```

---

## Quick Start

You need **MySQL 8+** running and **two terminals** open.

### 1. Create the database

```bash
mysql -u root -p
CREATE DATABASE snowtrip_db;
EXIT;
```

### 2. Start the backend

```bash
cd snowboard_project/server
npm install
cp .env.example .env          # fill in your DB credentials and Groq API key
npm run db:migrate            # creates all tables
npm run db:seed               # inserts demo resorts, users, trips, and locations
npm start
# Listening on http://localhost:3000
```

### 3. Start the frontend

```bash
cd snowboard_project/client
npm install
npm start
# Dev server at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and log in with the [demo credentials](#demo-credentials).

---

## Environment Variables

### `server/.env`

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=snowtrip_db
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

# AI — Groq (never expose to the frontend)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Get a free Groq key at [console.groq.com](https://console.groq.com) → API Keys.

### `client/.env`

```env
PORT=5173
```

No other client-side variables are required. The Groq API key is **backend-only** and never sent to the browser.

---

## Database

### npm scripts (run inside `server/`)

| Script | Effect |
|---|---|
| `npm run db:migrate` | Create all tables from migration files |
| `npm run db:seed` | Insert demo users, resorts, trips, and locations |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed |

### Schema

| Table | Description |
|---|---|
| `users` | Registered users (role: user / manager / admin) |
| `resorts` | Ski/snowboard resorts with elevation, terrain, and difficulty |
| `resort_locations` | In-resort POIs — lifts, slopes, restaurants, parks, rentals |
| `trips` | User-created trips (privacy, maxMembers, sport, dates) |
| `trip_members` | Join requests and confirmed memberships |
| `trip_messages` | Group chat messages per trip |
| `trip_read_status` | Per-user last-read timestamp (drives unread badges) |
| `friend_requests` | Pending / accepted / rejected friend requests |
| `friendships` | Confirmed friendships (normalised: user1Id < user2Id) |
| `gear_chat_messages` | Persisted multi-turn AI gear-chat history per user+trip |

---

## Pages & Features

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password sign-in |
| `/register` | Register | Account creation with sport type and skill level |
| `/dashboard` | Dashboard | Command center — next trip, attention items, AI packing tips, weather watch, resort spotlight, activity feed |
| `/plan-trip` | Plan Trip | Dates + skill level → AI resort picks → weather → save with privacy & capacity |
| `/trips` | My Trips | All your created/joined trips with resort info and actions |
| `/trips/:id` | Trip Details | Overview, member management, weather, AI summary, in-resort locations, AI resort assistant, group chat |
| `/discover` | Discover Trips | Browse and request to join public/friends-only trips |
| `/friends` | Friends | Search users, manage friend requests, see online presence |
| `/resorts` | Resorts | Sortable and searchable resort directory |
| `/resorts/:id` | Resort Details | Full resort profile with forecast and locations |
| `/settings` | Settings | Profile editing and trip preference preferences |
| `/management` | Management | Admin/manager CRUD for users, resorts, and locations |

---

## API Endpoints

All responses use the envelope `{ success, data, error }`. The frontend `api.js` unwraps this automatically.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Log in |
| POST | `/auth/register` | Register a new account |

### Resorts
| Method | Path | Description |
|---|---|---|
| GET | `/resorts` | List resorts (filterable by country, difficulty) |
| GET | `/resorts/:id` | Single resort |
| GET | `/resorts/:id/forecast` | Weather forecast (forecast / historical / typical average) |
| GET | `/resorts/:id/locations` | Locations for a resort |
| POST | `/resorts` | Create resort (manager/admin) |
| PUT | `/resorts/:id` | Update resort (manager/admin) |
| DELETE | `/resorts/:id` | Delete resort (admin) |

### Trips
| Method | Path | Description |
|---|---|---|
| GET | `/trips` | My trips |
| POST | `/trips` | Create a trip |
| GET | `/trips/:id` | Single trip |
| PUT | `/trips/:id` | Update trip |
| DELETE | `/trips/:id` | Delete trip |
| GET | `/trips/discover` | Public/friends-only trips |

### Trip Members
| Method | Path | Description |
|---|---|---|
| POST | `/trip-members/:tripId/request` | Request to join |
| POST | `/trip-members/:tripId/invite` | Invite a friend |
| PUT | `/trip-members/:tripId/:memberId` | Approve or reject request |
| DELETE | `/trip-members/:tripId/:memberId` | Remove member / leave trip |

### Social
| Method | Path | Description |
|---|---|---|
| GET | `/social/users` | Search users |
| POST | `/social/friend-request` | Send friend request |
| PUT | `/social/friend-request/:id` | Accept or reject |
| GET | `/social/friends` | My friends list |
| GET | `/social/invitations` | My trip invitations |

### AI
| Method | Path | Description |
|---|---|---|
| POST | `/recommend-resorts` | Top-3 AI resort recommendations |
| POST | `/resort-summary` | AI suitability summary for one resort |
| POST | `/gear-recommendation` | AI gear list for a trip |
| POST | `/resort-assistant` | In-resort location tips |
| POST | `/gear-chat` | Multi-turn conversational gear advisor |
| GET | `/gear-chat/:tripId` | Load gear-chat history |
| DELETE | `/gear-chat/:tripId` | Clear gear-chat history |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Aggregated dashboard data |
| GET | `/users` | All users (manager/admin) |
| PUT | `/users/:id` | Update user (admin) |

---

## Real-Time (Socket.IO)

The frontend connects automatically on login. The server runs Socket.IO on the same port 3000 as the REST API.

### Auth handshake

```js
io(API_BASE_URL, { auth: { userId } })
```

### Events

| Event | Direction | Description |
|---|---|---|
| `user:online` | server → clients | Notify a user's friends they came online |
| `user:offline` | server → clients | Notify a user's friends they went offline |
| `friends:online` | client → server (ack) | Get which friends are currently online |
| `chat:join` | client → server | Join a trip's chat room |
| `chat:send` | client → server (ack) | Send a message (persisted + broadcast) |
| `chat:message` | server → room | New message delivered to the room |
| `chat:history` | client → server (ack) | Fetch last 100 messages for a trip |
| `chat:unread-update` | server → client | Push updated unread count for a trip |
| `friend:request` | server → client | Live notification of an incoming friend request |
| `trip:join-request` | server → client | Live notification to a trip creator of a new join request |
| `trip:invitation` | server → client | Live notification to an invited user |

---

## AI Features (Groq LLM)

All LLM calls run on the backend. The API key is never exposed to the browser.

Each endpoint wraps the LLM call in `try/catch` and falls back to rule-based content from `server/constants/` if the Groq API is unavailable, so the endpoint always returns a usable response. Responses include an `aiGenerated: true/false` flag so the UI can show a notice when fallback content is displayed.

---

## Weather Integration

Weather data comes from **Open-Meteo** (free, no API key needed), called from `server/controllers/resortController.js`.

`GET /resorts/:id/forecast` automatically selects one of three modes:

| Mode | When | Source |
|---|---|---|
| `forecast` | Trip starts within 16 days | Open-Meteo forecast API |
| `historical` | Entire trip is in the past | Open-Meteo archive API |
| `typical` | Trip is beyond the 16-day horizon | Average of the same dates across the 3 prior years |

The response includes per-day data plus a `summary` object (avg temps, total snowfall, avg wind) and a `confidence` field (`high` / `medium` / `low`). If the end date exceeds the forecast horizon, the response includes `partialForecast: true`.

---

## Roles & Permissions

| Role | Capabilities |
|---|---|
| `user` | Own trips, recommendations, social features, gear advisor |
| `manager` | All user permissions + create/edit resorts and locations, view all users and trips |
| `admin` | All manager permissions + delete any resource |

Enforced server-side by `middleware/auth.js` and checked client-side to show or hide UI controls.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | roii@example.com | password123 |
| Manager | chacha@example.com | password123 |
| User | lebron@example.com | password123 |

Skill levels run 1–5: **1** First-Timer · **2** Novice · **3** Intermediate · **4** Expert · **5** Pro/Freeride.

---

## Troubleshooting

**"Cannot connect to the server"** — The backend is not running. Open a terminal and run `cd snowboard_project/server && npm start`.

**`SequelizeConnectionError: Access denied`** — Wrong credentials in `server/.env`. Check `DB_USER` and `DB_PASSWORD`.

**`SequelizeConnectionError: Unknown database`** — The `snowtrip_db` database does not exist. Run `CREATE DATABASE snowtrip_db;` in MySQL, then `npm run db:migrate`.

**AI endpoints return generic text instead of LLM responses** — `GROQ_API_KEY` in `server/.env` is missing or still the placeholder. Get a key at [console.groq.com](https://console.groq.com).

**CORS error in browser** — The frontend port does not match the hardcoded origin in `server/server.js` (`http://localhost:5173`). Make sure the client runs on port 5173.

**Port 3000 already in use** — `lsof -ti:3000 | xargs kill -9`

**Socket.IO not connecting** — The backend must be running and a user must be logged in (the socket connects on login and disconnects on logout).

---

## Known Limitations

This is a university learning project, not a production system.

- **Passwords are stored in plaintext** — do not reuse a real password when creating a demo account.
- **No cryptographic auth** — role and user ID are sent as plain HTTP headers and trusted by the backend without verification. A malicious client could spoof them.
- **No automated test suite** — all testing is manual.
- **No pagination** on list endpoints — acceptable at seed-data scale.
- **No rate limiting** on AI endpoints.
- **Weather forecasts cap at 16 days** (Open-Meteo free-tier limit). Trips further out use a 3-year historical average.
