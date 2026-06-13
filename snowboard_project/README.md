# ❄️ SnowTrip Planner

A full-stack web application for planning ski and snowboard trips. Users browse Alpine resorts, get **real AI-powered** recommendations via Groq LLM, view live weather forecasts, manage trips with privacy controls, discover and join other users' trips, add friends, chat in real-time, and track online status — all in a dark arctic-themed UI.

> BGU Web Development — Full-Stack Assignment (React + Express + MySQL + Socket.IO + Groq AI)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Default Ports](#default-ports)
- [Demo Credentials](#demo-credentials)
- [Features and Pages](#features-and-pages)
- [Real-Time Features (Socket.IO)](#real-time-features-socketio)
- [AI Features (Groq LLM)](#ai-features-groq-llm)
- [Roles and Permissions](#roles-and-permissions)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Create React App |
| Backend | Node.js 18+, Express 5 |
| Database | MySQL 8+ with Sequelize v6 ORM |
| Real-Time | Socket.IO 4 (WebSockets) |
| AI | Groq API — `llama-3.3-70b-versatile` (backend only) |
| Weather | Open-Meteo API (free, no key required) |
| Styling | Custom CSS design system — dark arctic theme |

---

## Folder Structure

```
snowboard_project/
├── client/                        ← React frontend (port 5173)
│   └── src/
│       ├── App.js                 ← Route definitions
│       ├── pages/                 ← Full-page components
│       ├── components/            ← Reusable UI components
│       └── services/
│           ├── api.js             ← Centralised HTTP client
│           └── socket.js          ← Socket.IO singleton
├── server/                        ← Express backend (port 3000)
│   ├── server.js                  ← App entry point
│   ├── socket.js                  ← Socket.IO event handlers
│   ├── controllers/               ← Business logic
│   ├── routes/                    ← Express router definitions
│   ├── db/                        ← Sequelize config, models, migrations, seeders
│   │   ├── index.js               ← DB connection + associations
│   │   ├── config.js              ← Sequelize CLI config
│   │   ├── models/                ← Sequelize model definitions
│   │   ├── migrations/            ← Schema migration files
│   │   └── seeders/               ← Seed data files
│   ├── models/                    ← Static reference data (gear, skill levels)
│   ├── utils/
│   │   └── llm.js                 ← Groq client (backend only)
│   ├── middleware/                ← Auth (RBAC), request logger
│   ├── .env                       ← DB credentials + Groq API key (gitignored)
│   └── .env.example               ← Template with placeholder values
└── README.md
```

---

## Quick Start

You need **two terminals** and a running **MySQL 8+** server.

### 1. Database

```bash
mysql -u root -p
CREATE DATABASE snowtrip_db;
EXIT;
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env          # then fill in your DB credentials and Groq API key
npm run db:migrate            # creates all 8 tables
npm run db:seed               # inserts demo resorts, users, trips, locations
npm start
# → http://localhost:3000
```

### 3. Frontend

```bash
cd client
npm install
npm start
# → http://localhost:5173
```

Open **http://localhost:5173** and log in with the [demo credentials](#demo-credentials).

---

## Environment Variables

### Backend (`server/.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=snowtrip_db
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

# AI — Groq (backend only — never expose to frontend)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Get a free Groq key at https://console.groq.com → API Keys.

> **Security:** The `GROQ_API_KEY` is read only by `server/utils/llm.js` which runs on the backend. It is never sent to or accessible by the frontend.

### Frontend

`client/.env` is committed with `PORT=5173`. No other variables needed.

---

## Database Setup

### npm Scripts

| Script | What it does |
|---|---|
| `npm run db:migrate` | Create all 8 tables from migration files |
| `npm run db:seed` | Insert demo data (users, resorts, trips, locations) |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed |

### Tables

| Table | Description |
|---|---|
| `users` | Registered users |
| `resorts` | Ski/snowboard resorts |
| `trips` | User-created trips (with privacy, maxMembers) |
| `resort_locations` | In-resort POIs (lifts, slopes, restaurants, etc.) |
| `friend_requests` | Sent/pending/accepted/rejected friend requests |
| `friendships` | Confirmed friendships (normalised: user1Id < user2Id) |
| `trip_members` | Join requests and approved memberships |
| `trip_messages` | Group chat messages per trip |

---

## Default Ports

| Service | URL |
|---|---|
| Backend API + Socket.IO | http://localhost:3000 |
| Frontend dev server | http://localhost:5173 |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | roii@example.com | password123 |
| Manager | chacha@example.com | password123 |
| User | lebron@example.com | password123 |

---

## Features and Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password login |
| `/register` | Register | Full registration with sport type and skill level |
| `/dashboard` | Dashboard | Personalised welcome, recent trips, quick links |
| `/plan-trip` | Plan Trip | Dates + skill → AI top-3 resort picks → weather → save trip with privacy + capacity |
| `/trips` | My Trips | All saved trips with resort details and delete |
| `/trips/:id` | Trip Details | Trip overview, member management (approve/reject/remove/leave), weather, AI summary, in-resort locations, resort assistant, group chat |
| `/discover` | Discover Trips | Browse and join public / friends-only trips |
| `/friends` | Friends | Search users, send/accept/reject friend requests, see online status |
| `/resorts` | Resorts | Sortable/searchable resort table |
| `/settings` | Settings | Edit profile preferences |
| `/management` | Management | Admin/manager CRUD for users, resorts, and locations |

---

## Real-Time Features (Socket.IO)

The backend exposes a Socket.IO server on port 3000. The frontend connects automatically when a user logs in.

### Custom Events

| Event | Direction | Description |
|---|---|---|
| `user:online` | server → clients | Broadcast to a user's online friends when they connect |
| `user:offline` | server → clients | Broadcast to a user's online friends when they disconnect |
| `friends:online` | client → server (ack) | Request which of your friends are currently online |
| `chat:join` | client → server | Join a trip's chat room |
| `chat:send` | client → server (ack) | Send a message; persisted to DB, broadcast to room |
| `chat:message` | server → room | New message delivered to all room members |
| `chat:history` | client → server (ack) | Fetch the last 100 messages for a trip |
| `friend:request` | server → client | Real-time notification when someone sends you a friend request |
| `trip:join-request` | server → client | Real-time notification to trip creator when someone requests to join |

### Socket Authentication

The client sends `userId` in the Socket.IO handshake auth object:

```js
io(API_BASE_URL, { auth: { userId } })
```

The server reads `socket.handshake.auth.userId` to identify the connected user.

---

## AI Features (Groq LLM)

All AI calls are made on the **backend only** — the API key is never sent to the browser.

| Endpoint | What the LLM generates |
|---|---|
| `POST /resort-summary` | 2–3 sentence suitability summary for a resort + rider skill match |
| `POST /recommend-resorts` | Natural-language explanations for the top-3 scored resorts |
| `POST /gear-recommendation` | Tailored gear list (6–8 items) and terrain warnings |
| `POST /resort-assistant` | Sport-specific in-resort tips for a chosen location type |

Each endpoint has a **rule-based fallback** — if the Groq API is unavailable the endpoint still returns a valid response, the app never crashes.

---

## Roles and Permissions

| Role | Permissions |
|---|---|
| `user` | Manage own trips, get recommendations, social features |
| `manager` | All user permissions + create/edit resorts and locations, view all users and trips |
| `admin` | All manager permissions + delete any resource |

Role is enforced by `middleware/auth.js` on every protected route and also checked client-side to show/hide UI elements.

---

## Troubleshooting

**"Cannot connect to the server"**
The backend is not running. Run `cd server && npm start` in a separate terminal.

**`SequelizeConnectionError: Access denied`**
Wrong DB credentials in `server/.env`. Double-check `DB_USER` and `DB_PASSWORD`.

**`SequelizeConnectionError: Unknown database`**
Run `CREATE DATABASE snowtrip_db;` in MySQL first, then re-run `npm run db:migrate`.

**AI endpoints return rule-based text instead of LLM responses**
`GROQ_API_KEY` in `server/.env` is missing or is still the placeholder. Get a key at https://console.groq.com.

**CORS error in browser console**
The frontend port does not match the CORS origin in `server/server.js`. The backend hardcodes `http://localhost:5173`.

**Port 3000 already in use**
`lsof -ti:3000 | xargs kill -9`

**Socket.IO not connecting**
Make sure the backend is running and the user is logged in (socket connects on login, disconnects on logout).
