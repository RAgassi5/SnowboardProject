# ❄️ SnowTrip Planner

A full-stack web application for planning ski and snowboard trips. Users browse Alpine resorts, get AI-powered resort and gear recommendations, view weather forecasts, manage trips, and explore in-resort locations.

> BGU Web Development — Full-Stack Assignment (React + Express)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Default Ports](#default-ports)
- [How Frontend and Backend Communicate](#how-frontend-and-backend-communicate)
- [Demo Credentials](#demo-credentials)
- [Features and Pages](#features-and-pages)
- [Roles](#roles)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Create React App |
| Backend | Node.js 18+, Express 5 |
| Data | In-memory (no database — resets on server restart) |
| Styling | Plain CSS with CSS custom properties |
| HTTP | Native `fetch` API |

---

## Folder Structure

```
snowboard_project/
├── client/                  ← React frontend (port 5173)
│   ├── public/
│   ├── src/
│   │   ├── App.js           ← Router and route definitions
│   │   ├── index.js         ← ReactDOM entry point
│   │   ├── index.css        ← Global design system (dark arctic theme)
│   │   ├── pages/           ← Full-page components (one per route)
│   │   ├── components/      ← Reusable UI components
│   │   └── services/
│   │       └── api.js       ← Centralized API client
│   ├── .env                 ← PORT=5173
│   └── package.json
├── server/                  ← Express backend (port 3000)
│   ├── controllers/         ← Route handler logic
│   ├── routes/              ← Express router definitions
│   ├── models/              ← In-memory data arrays
│   ├── middleware/          ← Auth (RBAC) and request logger
│   ├── docs/
│   │   └── README.md        ← Full API reference with request/response examples
│   └── server.js            ← Express app entry point
├── .gitignore
└── README.md                ← This file
```

---

## Quick Start

You need **two terminals** running simultaneously.

### 1. Backend

```bash
cd server
npm install
npm start
# → http://localhost:3000
```

### 2. Frontend

```bash
cd client
npm install
npm start
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser. Use the [demo credentials](#demo-credentials) to log in.

---

## Environment Variables

### Backend

No `.env` file required. The port is hard-coded to `3000` in `server/server.js`.

### Frontend

`client/.env` — already committed in the repo:

```
PORT=5173
```

This sets the Create React App dev server port to 5173. If you change it, you must also update the CORS origin in `server/server.js` (line 19) to match.

---

## Default Ports

| Service | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend dev server | http://localhost:5173 |

---

## How Frontend and Backend Communicate

All API calls go through `client/src/services/api.js`, which:

- Sets the base URL to `http://localhost:3000`
- Attaches `Content-Type: application/json` on every request
- Attaches `x-user-role` and `x-user-id` headers automatically from `localStorage`
- Unwraps the backend's universal `{ success, data, error }` response envelope
- Throws readable `Error` objects on failure
- Returns a "backend not running" message if the network request fails entirely

The backend allows CORS only from `http://localhost:5173`. Both services must be running simultaneously for the app to work.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | roii@example.com | password123 |
| Manager | chacha@example.com | password123 |
| User | lebron@example.com | password123 |

All data resets when the backend server is restarted.

---

## Features and Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email/password login, demo credential tiles |
| `/register` | Register | Full registration form with validation |
| `/dashboard` | Dashboard | Personalised welcome, recent trips, quick links |
| `/plan-trip` | Plan Trip | Dates + skill level → AI top-3 resort picks → weather + save trip |
| `/trips` | My Trips | All saved trips with resort details and delete |
| `/trips/:id` | Trip Details | Trip overview, weather forecast, AI summary, in-resort locations, gear advisor |
| `/resorts` | Resorts | Sortable/searchable resort table with summary stats |
| `/settings` | Settings | Profile card, edit name and preferences |
| `/management` | Management | Admin/manager CRUD panel for users, resorts, and locations |

---

## Roles

The app uses three roles stored in `localStorage` and sent as the `x-user-role` header on every API call.

| Role | Permissions |
|---|---|
| `user` | View resorts, manage own trips, get recommendations |
| `manager` | All user permissions + create/edit resorts and locations, view all users and trips |
| `admin` | All manager permissions + delete any resource (users, resorts, trips, locations) |

The `/management` page is visible only to `manager` and `admin` roles. Role is enforced on both the frontend (route guard) and the backend (middleware).

---

## Troubleshooting

**"Cannot connect to the server"**
The backend is not running. Run `cd server && npm start` in a separate terminal.

**Blank page or 404 after refresh**
This is normal with Create React App's client-side routing. Always navigate from the app's root (`http://localhost:5173`), not by refreshing a deep URL.

**CORS error in browser console**
The frontend port does not match the CORS origin in `server/server.js`. The backend hard-codes `http://localhost:5173`. If your frontend runs on a different port, update line 19 in `server/server.js`.

**Port 5173 already in use**
Another process is occupying port 5173. Either stop it or update `client/.env` to a free port and update `server/server.js` to match.

**`npm install` fails**
Make sure you are running `npm install` inside the correct directory (`server/` or `client/`), not at the root. There is no root-level `package.json`.

**Data disappears after backend restart**
By design. All data lives in-memory in the `server/models/` arrays. Nothing is persisted to disk.

**Weather forecast shows an error**
The weather endpoint calls the Open-Meteo API. If the network is unavailable, the forecast section will show an error message. No API key is required.
