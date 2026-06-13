/**
 * SnowTrip Planner — API Service Layer
 *
 * Base URL: http://localhost:3000 (Assignment 2 backend)
 *
 * All backend responses follow the universal format:
 *   { success: true,  data: {...}, error: null }
 *   { success: false, data: null,  error: { code, message, details } }
 *
 * This module:
 *   1. Sends requests with proper headers (Content-Type, x-user-role, x-user-id)
 *   2. Parses JSON automatically
 *   3. Unwraps the universal response envelope
 *   4. Throws readable Error objects on failure (using error.message from backend)
 */

// ── Base configuration ────────────────────────────────────────────────────────

export const API_BASE_URL = 'http://localhost:3000';

// ── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Read the logged-in user from localStorage.
 * Returns the parsed user object, or null if not logged in.
 */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('snowtrip_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Returns the role of the currently stored user.
 * Defaults to 'user' if no role is found.
 */
export const getStoredRole = () => {
  const user = getStoredUser();
  return user?.userRole ?? 'user';
};

// ── Core request helper ───────────────────────────────────────────────────────

/**
 * Central fetch wrapper.
 *
 * @param {string} path       - API path, e.g. '/resorts' or '/auth/login'
 * @param {object} options    - Fetch options: method, body, role, extraHeaders
 * @returns {*}               - Unwrapped `data` from the backend response
 * @throws {Error}            - With backend's error.message (or fallback)
 */
const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body = undefined,
    role = null,          // pass explicit role, or omit to auto-read from localStorage
    extraHeaders = {}
  } = options;

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  // Attach role header: explicit > localStorage > omit
  const userRole = role ?? getStoredRole();
  if (userRole) {
    headers['x-user-role'] = userRole;
  }

  // Always attach x-user-id for ownership checks (e.g. trip deletion)
  const storedUser = getStoredUser();
  if (storedUser?.userId) {
    headers['x-user-id'] = String(storedUser.userId);
  }

  // Build fetch config
  const fetchConfig = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, fetchConfig);
  } catch (networkErr) {
    // Network failure (e.g. backend not running)
    throw new Error(
      'Cannot connect to the server. Please make sure the backend is running on http://localhost:3000'
    );
  }

  // Parse JSON
  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${response.status})`);
  }

  // Unwrap universal response envelope
  if (json.success === false) {
    const message =
      json?.error?.message ||
      `Request failed (HTTP ${response.status})`;
    const err = new Error(message);
    err.code    = json?.error?.code    ?? 'UNKNOWN_ERROR';
    err.details = json?.error?.details ?? {};
    err.status  = response.status;
    throw err;
  }

  // Return only the data payload
  return json.data;
};

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /auth/login
 * Returns { message, user }
 */
export const login = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body: { email, password },
    role: null  // no role needed for public login endpoint
  });

/**
 * POST /auth/register
 * Returns { message, user }
 */
export const register = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: payload,
    role: null
  });

// ═════════════════════════════════════════════════════════════════════════════
// RESORTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /resorts
 * Supports optional query filters: country, difficultyLevel
 * Returns array of resort objects
 */
export const getResorts = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.country)         params.set('country', filters.country);
  if (filters.difficultyLevel) params.set('difficultyLevel', filters.difficultyLevel);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/resorts${qs}`);
};

/**
 * GET /resorts/:id
 * Returns a single resort object
 */
export const getResortById = (id) =>
  request(`/resorts/${id}`);

/**
 * GET /resorts/:id/forecast
 * Returns { resortId, resortName, forecast: [...weatherLogs] }
 */
export const getResortForecast = (id, startDate = null, endDate = null) => {
  const qs = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
  return request(`/resorts/${id}/forecast${qs}`);
};

/**
 * GET /resorts/:id/locations
 * Supports optional query filter: type
 * Returns array of location objects for the resort
 */
export const getResortLocations = (id, type = null) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return request(`/resorts/${id}/locations${qs}`);
};

/**
 * POST /resorts
 * Requires admin or manager role.
 * Payload: { name, country, elevation, terrainType, difficultyLevel, snowboardFriendly, latitude, longitude }
 * Returns { resortId }
 */
export const createResort = (payload, role) =>
  request('/resorts', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * PUT /resorts/:id
 * Requires admin or manager role.
 * Payload: same as createResort
 * Returns { resortId }
 */
export const updateResort = (id, payload, role) =>
  request(`/resorts/${id}`, {
    method: 'PUT',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * DELETE /resorts/:id
 * Requires admin role.
 * Returns { resortId }
 */
export const deleteResort = (id, role) =>
  request(`/resorts/${id}`, {
    method: 'DELETE',
    role: role ?? getStoredRole()
  });

// ═════════════════════════════════════════════════════════════════════════════
// AI / RECOMMENDATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /recommend-resorts
 * Requires x-user-role header (any valid role).
 * Payload: { startDate, endDate, skillLevel, sportType }
 * Returns { startDate, endDate, skillLevel, skillLevelLabel, sportType, recommendations: [top3] }
 */
export const recommendResorts = (payload, role) =>
  request('/recommend-resorts', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * POST /gear-recommendation
 * Requires x-user-role header (any valid role).
 * Payload: { resortId, skillLevel, sportType }
 * Returns { resortId, resortName, suggestedGear, warning? }
 */
export const getGearRecommendation = (payload, role) =>
  request('/gear-recommendation', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * POST /resort-summary
 * No role restriction.
 * Payload: { resortId, skillLevel }
 * Returns { resortId, resortName, summary, ... }
 */
export const getResortSummary = (payload) =>
  request('/resort-summary', {
    method: 'POST',
    body: payload
  });

/**
 * POST /resort-assistant
 * Requires x-user-role header (any valid role).
 * Payload: { resortId, locationType, sportType }
 * Returns { resortId, resortName, generalTip, inResortSpots }
 */
export const getResortAssistant = (payload, role) =>
  request('/resort-assistant', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

// ═════════════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /users
 * Requires admin or manager role.
 * Returns array of user objects
 */
export const getAllUsers = (role) =>
  request('/users', { role: role ?? getStoredRole() });

/**
 * GET /users/:id
 * Requires admin or manager role.
 * Returns a single user object
 */
export const getUserById = (id, role) =>
  request(`/users/${id}`, { role: role ?? getStoredRole() });

/**
 * GET /users/:id/trips
 * No role restriction — user can view their own trips.
 * Returns array of trip objects for the user
 */
export const getUserTrips = (userId) =>
  request(`/users/${userId}/trips`);

/**
 * PUT /users/:id
 * Requires admin or manager role.
 * Payload: { firstName, lastName, userRole }
 * Returns { userId }
 */
export const updateUser = (userId, payload, role) =>
  request(`/users/${userId}`, {
    method: 'PUT',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * DELETE /users/:id
 * Requires admin role.
 * Returns { userId }
 */
export const deleteUser = (userId, role) =>
  request(`/users/${userId}`, {
    method: 'DELETE',
    role: role ?? getStoredRole()
  });

// ═════════════════════════════════════════════════════════════════════════════
// TRIPS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /trips
 * Requires admin or manager role.
 * Returns array of all trips
 */
export const getAllTrips = (role) =>
  request('/trips', { role: role ?? getStoredRole() });

/**
 * GET /trips/:id
 * Returns a single trip object.
 */
export const getTripById = (tripId) =>
  request(`/trips/${tripId}`);

/**
 * POST /trips
 * Requires user, admin, or manager role.
 * Payload: { userId, resortId, startDate, endDate }
 * Returns { tripId }
 */
export const createTrip = (payload, role) =>
  request('/trips', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * PUT /trips/:id
 * Requires user, admin, or manager role.
 * Payload: { userId, resortId, startDate, endDate }
 * Returns { tripId }
 */
export const updateTrip = (tripId, payload, role) =>
  request(`/trips/${tripId}`, {
    method: 'PUT',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * DELETE /trips/:id
 * - admin/manager: delete any trip.
 * - user: can only delete their own trip (backend enforces via x-user-id, auto-attached by request()).
 * Returns { tripId }
 */
export const deleteTrip = (tripId, role) =>
  request(`/trips/${tripId}`, {
    method: 'DELETE',
    role: role ?? getStoredRole()
  });

// ═════════════════════════════════════════════════════════════════════════════
// TRIP DISCOVERY & MEMBERSHIP
// ═════════════════════════════════════════════════════════════════════════════

export const discoverTrips = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.sportType)  params.set('sportType',  filters.sportType);
  if (filters.skillLevel) params.set('skillLevel', filters.skillLevel);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/trips/discover${qs}`);
};

export const joinTrip = (tripId) =>
  request(`/trips/${tripId}/join`, { method: 'POST' });

export const getTripMembers = (tripId) =>
  request(`/trips/${tripId}/members`);

export const approveTripMember = (memberId) =>
  request(`/trip-members/${memberId}/approve`, { method: 'PUT' });

export const rejectTripMember = (memberId) =>
  request(`/trip-members/${memberId}/reject`, { method: 'PUT' });

export const getJoinedTrips = (userId) =>
  request(`/users/${userId}/joined-trips`);

export const removeTripMember = (memberId) =>
  request(`/trip-members/${memberId}`, { method: 'DELETE' });

export const inviteFriendToTrip = (tripId, userId) =>
  request(`/trips/${tripId}/invite`, { method: 'POST', body: { userId } });

export const getUserInvitations = (userId) =>
  request(`/users/${userId}/invitations`);

export const getUnreadCounts = (userId) =>
  request(`/users/${userId}/unread-counts`);

// ═════════════════════════════════════════════════════════════════════════════
// SOCIAL — Friends & Friend Requests
// ═════════════════════════════════════════════════════════════════════════════

export const searchUsers = (q) =>
  request(`/users/search?q=${encodeURIComponent(q)}`);

export const getFriends = (userId) =>
  request(`/users/${userId}/friends`);

export const getReceivedRequests = (userId) =>
  request(`/users/${userId}/friend-requests/received`);

export const getSentRequests = (userId) =>
  request(`/users/${userId}/friend-requests/sent`);

export const sendFriendRequest = (receiverId) =>
  request('/friend-requests', { method: 'POST', body: { receiverId } });

export const acceptFriendRequest = (requestId) =>
  request(`/friend-requests/${requestId}/accept`, { method: 'PUT' });

export const rejectFriendRequest = (requestId) =>
  request(`/friend-requests/${requestId}/reject`, { method: 'PUT' });

export const removeFriend = (friendshipId) =>
  request(`/friendships/${friendshipId}`, { method: 'DELETE' });

// ═════════════════════════════════════════════════════════════════════════════
// RESORT LOCATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /resort-locations
 * Requires admin or manager role.
 * Returns array of all resort locations
 */
export const getAllLocations = (role) =>
  request('/resort-locations', { role: role ?? getStoredRole() });

/**
 * POST /resort-locations
 * Requires admin or manager role.
 * Payload: { resortId, name, type, description }
 * Returns { locationId }
 */
export const createLocation = (payload, role) =>
  request('/resort-locations', {
    method: 'POST',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * PUT /resort-locations/:id
 * Requires admin or manager role.
 * Payload: { resortId, name, type, description }
 * Returns { locationId }
 */
export const updateLocation = (id, payload, role) =>
  request(`/resort-locations/${id}`, {
    method: 'PUT',
    body: payload,
    role: role ?? getStoredRole()
  });

/**
 * DELETE /resort-locations/:id
 * Requires admin role.
 * Returns { locationId }
 */
export const deleteLocation = (id, role) =>
  request(`/resort-locations/${id}`, {
    method: 'DELETE',
    role: role ?? getStoredRole()
  });
