import React from 'react';

/**
 * ErrorMessage — styled error alert box.
 * Usage: <ErrorMessage message="Something went wrong." onDismiss={() => setError(null)} />
 */
function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fca5a5', fontSize: '1.1rem', padding: '0 4px',
            flexShrink: 0, lineHeight: 1
          }}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
