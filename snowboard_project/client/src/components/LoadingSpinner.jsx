import React from 'react';

/**
 * LoadingSpinner — centered spinner with optional message.
 * Usage: <LoadingSpinner message="Loading resorts..." />
 */
function LoadingSpinner({ message = 'Loading...', fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '1rem'
      }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</span>
      </div>
    );
  }

  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export default LoadingSpinner;
