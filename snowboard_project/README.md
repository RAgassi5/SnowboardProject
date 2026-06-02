# ❄️ SnowTrip Planner — Fullstack Final Project

> A ski & snowboard trip planning application.  
> **BGU Web Development — Assignment 3 (React Frontend)**

---

## 📂 Project Structure

```
snowboard_project/
├── client/          ← React frontend (port 5173)
│   ├── public/
│   └── src/
├── server/          ← Express backend (port 3000)
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── docs/
│   └── server.js
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

Open **two terminals**:

```bash
# Terminal 1 — Backend (Express)
cd server
npm install
node server.js
# → Running on http://localhost:3000

# Terminal 2 — Frontend (React)
cd client
npm install
npm start
# → Running on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | roii@example.com        | password123 |
| Manager | chacha@example.com      | password123 |
| User    | lebron@example.com      | password123 |

---

## 🗺️ Pages & Features

### `/login` — Login
- Email + password fields with full validation
- Show/hide password toggle
- POST `/auth/login` → stores user in `localStorage`
- Demo credential tiles for quick testing
- Redirects to `/dashboard` on success

### `/register` — Sign Up
- Full registration form: name, email, password, sport type, skill level
- POST `/auth/register` → auto-login on success

### `/dashboard` — Dashboard
- Personalised hero welcome (uses logged-in user's name)
- Recent trips preview + quick links
- How-it-works step guide

### `/plan-trip` — Trip Planner
- Step 1: Enter dates, skill level, sport type → AI ranks top 3 resorts
- Step 2: Select a resort → see weather forecast + AI suitability summary
- Step 3: Confirm and save the trip

### `/trips` — My Trips
- All saved trips with resort details
- Delete trips with confirmation dialog

### `/trips/:id` — Trip Details
- Full trip view: overview, weather forecast, AI summary, in-resort locations
- Floating Gear Advisor modal (interactive checklist)
- Resort assistant tips by location type

### `/resorts` — Resorts Table
- Fetches `GET /resorts` and renders via sortable DataTable
- Live search by name or country
- Summary stats: total resorts, countries, board-friendly count, avg elevation

### `/settings` — Profile & Settings
- Avatar card with role-colour coding (⭐ admin · 🔑 manager · 👤 user)
- Edit name and preferences

### `/management` — Admin/Manager Panel
- **Users tab** — view all users, admin can delete
- **Resorts tab** — full CRUD (add, edit, delete resorts)
- **Locations tab** — manage in-resort locations per resort

---

## 🔧 API Service Layer (`client/src/services/api.js`)

All API calls go through a central `request()` helper that:
- Attaches `Content-Type: application/json`, `x-user-role`, and `x-user-id` headers automatically
- Unwraps the backend's universal `{ success, data, error }` envelope
- Throws `Error` objects with the backend's `error.message` on failure
- Catches network errors with a friendly "backend not running" message

---

## 🎨 Design System (`client/src/index.css`)

- **Theme:** Deep arctic night — dark navy backgrounds, electric blue accent (#4f8ef7), teal secondary (#38d9c0)
- **Typography:** Inter (body) + Outfit (headings/display)
- **Responsive:** Mobile hamburger menu below 900px, single-column grids below 768px

---

## 🔒 Authentication & Role-Based Access

- Login sets `localStorage.snowtrip_user = { userId, firstName, email, userRole, … }`
- **ProtectedRoute** reads this value — redirects to `/login` if missing
- `x-user-role` and `x-user-id` headers are sent automatically on every API call
- Roles: `user` · `manager` · `admin`

---

## ✅ Assignment Requirements Checklist

| Requirement | Status |
|-------------|--------|
| React.js frontend | ✅ |
| React Router with 6+ routes | ✅ 9 routes |
| Fetch/Axios API calls to backend | ✅ (native Fetch) |
| Reusable component used 3+ times | ✅ `TripCard`, `LoadingSpinner`, `ErrorMessage`, `DataTable`, `ConfirmDialog` |
| Component with props | ✅ All reusable components |
| Login form with validation | ✅ email format + min-length password |
| Registration form | ✅ full form with validation |
| Protected routes (auth guard) | ✅ `ProtectedRoute` reads localStorage |
| Loading states | ✅ All pages |
| Error handling from backend | ✅ Universal response unwrapping |
| Role-based header (`x-user-role`) | ✅ Auto-attached on every request |
| Backend error middleware | ✅ `try/catch → next(err)` in all controllers |
| CORS for React dev server | ✅ port 5173 allowed |
