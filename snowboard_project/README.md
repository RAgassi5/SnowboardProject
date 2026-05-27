# ❄️ SnowTrip Planner — Fullstack Final Project

> A ski & snowboard trip planning application.  
> **BGU Web Development — Assignment 3 (React Frontend)**

---

## 🚀 Quick Start

Open **two terminals**:

```bash
# Terminal 1 — Backend (Express)
cd snowboard_project
node server.js
# → Running on http://localhost:3000

# Terminal 2 — Frontend (React)
cd snowboard_project/client
npm start
# → Running on http://localhost:3001
```

Then open **http://localhost:3001** and log in.

---

## 🔑 Demo Credentials

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | roii@example.com        | password123 |
| Manager | chacha@example.com      | password123 |
| User    | lebron@example.com      | password123 |

---

## 📂 Project Structure

```
snowboard_project/
├── server.js                    ← Express entry point (port 3000)
├── routes/                      ← Route definitions
├── controllers/                 ← Business logic + error handling
├── middleware/
│   └── auth.js                  ← x-user-role header guard
├── models/                      ← In-memory mock data
└── client/                      ← React frontend (Assignment 3)
    ├── public/
    │   └── index.html           ← Google Fonts, meta tags
    └── src/
        ├── index.js             ← React entry point
        ├── index.css            ← Global design system (winter theme)
        ├── App.js               ← Router + protected routes
        ├── services/
        │   └── api.js           ← All API calls + response unwrapping
        ├── components/
        │   ├── Layout.jsx       ← Navbar + Footer wrapper
        │   ├── Navbar.jsx       ← Sticky nav, user display, logout
        │   ├── Footer.jsx       ← 3-column footer
        │   ├── ProtectedRoute.jsx ← Auth guard (localStorage)
        │   ├── ResortCard.jsx   ← Reusable resort card (3+ uses)
        │   ├── DataTable.jsx    ← Reusable sortable table
        │   ├── LoadingSpinner.jsx ← Reusable spinner
        │   └── ErrorMessage.jsx ← Reusable error alert
        └── pages/
            ├── LoginPage.jsx    ← /login
            ├── DashboardPage.jsx ← /dashboard
            ├── ResortsPage.jsx  ← /resorts
            ├── RecommendPage.jsx ← /recommendations
            ├── GearPage.jsx     ← /gear
            └── SettingsPage.jsx ← /settings
```

---

## 🗺️ Pages & Features

### `/login` — Login
- Email + password fields with full validation
- Show/hide password toggle
- POST `/auth/login` → stores user in `localStorage`
- Demo credential tiles for quick testing
- Redirects to `/dashboard` on success

### `/dashboard` — Dashboard
- Personalised hero welcome (uses logged-in user's name)
- Fetches all resorts from `GET /resorts`
- Renders each resort as a **ResortCard** (country flag, elevation, terrain, difficulty badge, snowboard-friendly status)
- Client-side filters: country + difficulty level
- Quick Links section: Recommendations / Gear / Settings

### `/resorts` — Resorts Table
- Fetches `GET /resorts` and renders via **DataTable**
- Live search by name or country
- Clickable column headers for ascending/descending sort
- Summary stats: total resorts, countries, board-friendly count, avg elevation

### `/recommendations` — Recommendations
- Form: start date, end date, skill level, sport type
- Full client-side validation
- POST `/recommend-resorts` with `x-user-role` header
- Displays top 3 results as **ResortCard** with rank badge + explanation

### `/gear` — Gear Recommendations
- Form: resort (dropdown), skill level, sport type
- POST `/gear-recommendation` with `x-user-role` header
- Resort summary banner + snowboard warning (if applicable)
- Interactive gear checklist — click items to check them off

### `/settings` — Profile & Settings
- Avatar card with role-colour coding (⭐ admin · 🔑 manager · 👤 user)
- Read-only account info: sport, skill level, member since
- Edit form: first name, last name, role → PUT `/users/:id`
- Permission warning shown for non-admin/manager users (API restriction)
- Sign out button

---

## 🔧 API Service Layer (`src/services/api.js`)

All API calls go through a central `request()` helper that:
- Attaches `Content-Type: application/json` and `x-user-role` headers automatically
- Unwraps the backend's universal `{ success, data, error }` envelope
- Throws `Error` objects with the backend's `error.message` on failure
- Catches network errors with a friendly "backend not running" message

---

## 🎨 Design System (`src/index.css`)

- **Theme:** Deep arctic night — dark navy backgrounds, electric blue accent (#4f8ef7), teal secondary (#38d9c0)
- **Typography:** Inter (body) + Outfit (headings/display)
- **Components:** `.card`, `.btn`, `.form-input`, `.badge`, `.alert`, `.data-table`, `.spinner`
- **Responsive:** Mobile hamburger menu below 900px, single-column grids below 768px

---

## 🔒 Authentication & Role-Based Access

- Login sets `localStorage.snowtrip_user = { userId, firstName, email, userRole, … }`
- **ProtectedRoute** reads this value — redirects to `/login` if missing
- `x-user-role` header is sent automatically from `getStoredRole()` on every API call
- Roles: `user` · `manager` · `admin`

---

## ✅ Assignment Requirements Checklist

| Requirement | Status |
|-------------|--------|
| React.js frontend | ✅ |
| React Router with 6 routes | ✅ `/login` `/dashboard` `/resorts` `/recommendations` `/gear` `/settings` |
| Fetch/Axios API calls to backend | ✅ (native Fetch) |
| Reusable component used 3+ times | ✅ `ResortCard` — Dashboard, Recommendations (×3) |
| Component with props | ✅ `ResortCard`, `DataTable`, `LoadingSpinner`, `ErrorMessage` |
| Login form with validation | ✅ email format + min-length password |
| Protected routes (auth guard) | ✅ `ProtectedRoute` reads localStorage |
| Loading states | ✅ All pages |
| Error handling from backend | ✅ Universal response unwrapping |
| Role-based header (`x-user-role`) | ✅ Auto-attached on every request |
| Backend error middleware | ✅ `try/catch → next(err)` in all controllers |
| CORS for React dev server | ✅ port 3001 allowed |
