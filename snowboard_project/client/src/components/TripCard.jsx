import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

const COUNTRY_FLAGS = {
  Switzerland: '🇨🇭', France: '🇫🇷', Austria: '🇦🇹',
  Italy: '🇮🇹', USA: '🇺🇸', Canada: '🇨🇦', Japan: '🇯🇵',
};

const DIFFICULTY_COLORS = {
  1: '#22c55e', 2: '#38d9c0', 3: '#4f8ef7', 4: '#f59e0b', 5: '#ef4444',
};
const DIFFICULTY_LABELS = {
  1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro / Freeride',
};

/**
 * TripCard — reusable card for a saved trip.
 *
 * Props:
 *   trip       {object}    — trip object { tripId, userId, resortId, startDate, endDate }
 *   resort     {object}    — enriched resort object (may be null if not loaded yet)
 *   onDelete   {function}  — optional; called with (tripId) after user confirms delete
 */
function TripCard({ trip, resort, onDelete }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  if (!trip) return null;

  const resortName    = resort?.name   ?? `Resort #${trip.resortId}`;
  const country       = resort?.country ?? '';
  const flag          = COUNTRY_FLAGS[country] ?? '🌍';
  const difficulty    = resort?.difficultyLevel;
  const dColor        = DIFFICULTY_COLORS[difficulty] ?? '#4f8ef7';
  const dLabel        = DIFFICULTY_LABELS[difficulty] ?? '';
  const boardFriendly = resort?.snowboardFriendly;

  const start  = new Date(trip.startDate);
  const end    = new Date(trip.endDate);
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleDelete = async () => {
    setShowConfirm(false);
    setDeleting(true);
    try {
      await onDelete(trip.tripId);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article
        className="card trip-card"
        style={styles.card}
        aria-label={`Trip to ${resortName}`}
      >
        {/* Accent bar coloured by difficulty */}
        <div style={{ ...styles.accentBar, background: dColor }} aria-hidden="true" />

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.name}>{resortName}</h3>
            {country && (
              <div style={styles.country}>
                <span aria-label={`Country: ${country}`}>{flag}</span>
                <span>{country}</span>
              </div>
            )}
          </div>
          <div style={styles.nightsBubble} aria-label={`${nights} nights`}>
            <div style={styles.nightsNum}>{nights}</div>
            <div style={styles.nightsLabel}>nights</div>
          </div>
        </div>

        {/* Dates */}
        <div style={styles.dates}>
          <span style={styles.dateIcon} aria-hidden="true">📅</span>
          <span style={styles.dateText}>
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
          </span>
        </div>

        {/* Badges */}
        {(dLabel || boardFriendly !== undefined) && (
          <div style={styles.badgesRow}>
            {dLabel && (
              <span style={{ ...styles.diffBadge, color: dColor, borderColor: `${dColor}40` }}>
                ⬛ {dLabel}
              </span>
            )}
            {boardFriendly !== undefined && (
              <span style={boardFriendly ? styles.boardYes : styles.boardNo}>
                {boardFriendly ? '🏂 Board-Friendly' : '⚠️ Cat-tracks'}
              </span>
            )}
          </div>
        )}

        {/* CTAs */}
        <div style={styles.ctaRow}>
          <button
            id={`view-trip-${trip.tripId}`}
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate(`/trips/${trip.tripId}`)}
          >
            🔍 View Details
          </button>

          {onDelete && (
            <button
              id={`delete-trip-${trip.tripId}`}
              className="btn btn-danger"
              style={{ flexShrink: 0, padding: '0.65rem 0.9rem' }}
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              title="Delete this trip"
              aria-label={`Delete trip to ${resortName}`}
            >
              {deleting ? '…' : '🗑'}
            </button>
          )}
        </div>
      </article>

      {/* Confirm dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Trip?"
          message={`Delete your trip to ${resortName}? This cannot be undone.`}
          confirmText="Delete Trip"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  card: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    gap: '0.8rem', paddingTop: '1.25rem',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
  },
  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
  },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '0.75rem',
  },
  name: {
    fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.2rem',
  },
  country: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  nightsBubble: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '0.35rem 0.7rem',
    background: 'rgba(79,142,247,0.1)',
    border: '1px solid rgba(79,142,247,0.2)',
    borderRadius: 'var(--radius-md)',
    flexShrink: 0,
  },
  nightsNum: {
    fontSize: '1.2rem', fontWeight: 800,
    color: 'var(--accent-light)', lineHeight: 1,
  },
  nightsLabel: {
    fontSize: '0.65rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  dates: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.83rem', color: 'var(--text-secondary)',
    padding: '0.55rem 0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
  },
  dateIcon: { flexShrink: 0 },
  dateText: { lineHeight: 1.3 },
  badgesRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  diffBadge: {
    fontSize: '0.72rem', fontWeight: 600,
    padding: '0.2rem 0.55rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid', background: 'rgba(255,255,255,0.04)',
  },
  boardYes: {
    fontSize: '0.72rem', fontWeight: 600,
    padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)',
    color: '#5eead4', background: 'rgba(56,217,192,0.08)',
    border: '1px solid rgba(56,217,192,0.2)',
  },
  boardNo: {
    fontSize: '0.72rem', fontWeight: 600,
    padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)',
    color: '#fcd34d', background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
  },
  ctaRow: { display: 'flex', gap: '0.5rem', marginTop: 'auto' },
};

export default TripCard;
