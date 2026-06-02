import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Reads the logged-in user from localStorage (set during login).
 */
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('snowtrip_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
