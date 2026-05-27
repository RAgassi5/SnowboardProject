import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Pages ─────────────────────────────────────────────────────────────────────
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import PlanTripPage    from './pages/PlanTripPage';
import TripsPage       from './pages/TripsPage';
import TripDetailsPage from './pages/TripDetailsPage';
import ResortsPage     from './pages/ResortsPage';
import SettingsPage    from './pages/SettingsPage';

// ── Layout ────────────────────────────────────────────────────────────────────
import Layout         from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — all wrapped in Layout (Navbar + Footer) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/plan-trip"        element={<PlanTripPage />} />
          <Route path="/trips"            element={<TripsPage />} />
          <Route path="/trips/:tripId"    element={<TripDetailsPage />} />
          <Route path="/resorts"          element={<ResortsPage />} />
          <Route path="/settings"         element={<SettingsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
