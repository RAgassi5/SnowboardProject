import React, { useEffect } from 'react';

/**
 * ConfirmDialog — reusable destructive-action confirm modal.
 *
 * Props:
 *   title       {string}   — Modal heading
 *   message     {string}   — Body text explaining the action
 *   confirmText {string}   — Confirm button label (default: "Delete")
 *   danger      {bool}     — If true, confirm button is red (default: true)
 *   onConfirm   {function} — Called when user confirms
 *   onCancel    {function} — Called when user cancels or clicks overlay
 */
function ConfirmDialog({
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmText = 'Delete',
  danger      = true,
  onConfirm,
  onCancel,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div style={styles.dialog}>
        {/* Icon */}
        <div style={styles.iconWrap} aria-hidden="true">
          {danger ? '⚠️' : 'ℹ️'}
        </div>

        {/* Text */}
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.message}>{message}</p>

        {/* Buttons */}
        <div style={styles.actions}>
          <button
            id="confirm-dialog-cancel"
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1 }}
            autoFocus
          >
            Cancel
          </button>
          <button
            id="confirm-dialog-confirm"
            onClick={onConfirm}
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            style={{ flex: 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  dialog: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '2rem',
    width: '100%', maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    animation: 'dialogIn 0.18s ease',
  },
  iconWrap: { fontSize: '2.5rem', marginBottom: '0.85rem' },
  title: {
    fontSize: '1.15rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.5rem',
  },
  message: {
    fontSize: '0.88rem', color: 'var(--text-muted)',
    lineHeight: 1.6, marginBottom: '1.5rem',
  },
  actions: { display: 'flex', gap: '0.75rem' },
};

export default ConfirmDialog;
