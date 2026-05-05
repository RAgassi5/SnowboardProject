# SkiPlanner Backend API

A Node.js + Express REST API for planning ski/snowboard trips. Uses in-memory mock data — no database required.

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

## Role-Based Access Control

Send the `x-user-role` header with every request that requires authentication.

| Method | Allowed Roles |
|--------|--------------|
| GET    | user, manager, admin |
| POST   | manager, admin |
| PUT    | manager, admin |
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

### USERS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Get all users | any role |
| GET | `/users/:id` | Get user by ID | any role |
| GET | `/users/:id/trips` | Get all trips for a user | any role |
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

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/resorts` | Get all resorts | any role |
| GET | `/resorts?country=Switzerland` | Filter by country | any role |
| GET | `/resorts?difficultyLevel=beginner` | Filter by difficulty | any role |
| GET | `/resorts/:id` | Get resort by ID | any role |
| GET | `/resorts/:id/locations` | Get locations for a resort | any role |
| GET | `/resorts/:id/locations?type=lift` | Filter locations by type | any role |
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
  "difficultyLevel": "advanced",
  "latitude": 46.0207,
  "longitude": 7.7491
}
```
> `terrainType` values: `"groomed"`, `"powder"`, `"park"`, `"mixed"`, `"backcountry"`  
> `difficultyLevel` values: `"beginner"`, `"intermediate"`, `"advanced"`

---

### TRIPS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/trips` | Get all trips | any role |
| GET | `/trips/:id` | Get trip by ID | any role |
| POST | `/trips` | Create a new trip | admin, manager |
| PUT | `/trips/:id` | Update a trip | admin, manager |
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
| GET | `/resort-locations` | Get all locations | any role |
| GET | `/resort-locations/:id` | Get location by ID | any role |
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

### AI ROUTE

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/resort-summary` | Get AI-generated resort summary | none required |

**Request Body:**
```json
{
  "resortId": 1,
  "skillLevel": "beginner"
}
```
> `skillLevel` values: `"beginner"`, `"intermediate"`, `"advanced"`

**Response:**
```json
{
  "success": true,
  "data": {
    "resortId": 1,
    "resortName": "Zermatt",
    "difficultyLevel": "advanced",
    "skillLevel": "beginner",
    "summary": "Not recommended. Zermatt is rated advanced and may be too challenging for a beginner skier or snowboarder. Consider a resort with easier terrain."
  },
  "error": null
}
```

---

## Mock Data Summary

| Resource | Count | Notes |
|----------|-------|-------|
| Users | 5 | Includes admin (id:1), manager (id:2, id:5), user (id:3, id:4) |
| Resorts | 5 | Switzerland, France, Austria, Italy |
| Trips | 4 | Spanning multiple users and resorts |
| Resort Locations | 8 | Across 4 resorts, covering all location types |

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
