import React from 'react';

const DIFFICULTY_LABELS = {
  1: 'First-Timer', 2: 'Novice', 3: 'Intermediate',
  4: 'Expert', 5: 'Pro / Freeride',
};
const COUNTRY_FLAGS = {
  Switzerland: '🇨🇭', France: '🇫🇷', Austria: '🇦🇹',
  Italy: '🇮🇹', USA: '🇺🇸', Canada: '🇨🇦', Japan: '🇯🇵',
};
const DIFFICULTY_COLORS = {
  1: '#22c55e', 2: '#38d9c0', 3: '#4f8ef7', 4: '#f59e0b', 5: '#ef4444',
};

/**
 * RecommendationCard — displays one AI-ranked resort recommendation.
 *
 * Props:
 *   rec        {object}   — recommendation from POST /recommend-resorts
 *   selected   {boolean}  — true when this resort is chosen by the user
 *   onSelect   {function} — called when "Select this Resort" is clicked
 */
function RecommendationCard({ rec, selected, onSelect }) {
  if (!rec) return null;
  const {
    rank, resortName, country, difficultyLevel,
    snowboardFriendly, explanation,
  } = rec;

  const flag  = COUNTRY_FLAGS[country] ?? '🌍';
  const color = DIFFICULTY_COLORS[difficultyLevel] ?? '#4f8ef7';
  const label = DIFFICULTY_LABELS[difficultyLevel] ?? `Level ${difficultyLevel}`;

  return (
    <article
      className="card rec-card"
      style={{
        ...styles.card,
        ...(selected ? styles.cardSelected : {}),
      }}
      aria-label={`Recommendation ${rank}: ${resortName}`}
    >
      {/* ── Top accent bar ─── */}
      <div style={{ ...styles.accentBar, background: color }} aria-hidden="true" />

      {/* ── Header ─── */}
      <div style={styles.header}>
        {/* Rank bubble */}
        <div style={{ ...styles.rankBadge, background: color }} aria-label={`Rank ${rank}`}>
          #{rank}
        </div>

        <div style={styles.titleBlock}>
          <h3 style={styles.name}>{resortName}</h3>
          <div style={styles.sub}>
            <span aria-label={`Country: ${country}`}>{flag}</span>
            <span>{country}</span>
          </div>
        </div>

        {/* Board-friendly indicator */}
        <div
          style={styles.boardBadge}
          title={snowboardFriendly ? 'Snowboard friendly' : 'Not snowboard friendly'}
          aria-label={snowboardFriendly ? 'Snowboard friendly' : 'Not snowboard friendly'}
        >
          {snowboardFriendly ? '🏂 ✓' : '🏂 ✗'}
        </div>
      </div>

      {/* ── Difficulty badge ─── */}
      <div style={styles.diffRow}>
        <span style={{ ...styles.diffBadge, color, borderColor: `${color}40` }}>
          ⬛ {label}
        </span>
        {!snowboardFriendly && (
          <span style={styles.warnBadge}>⚠️ Cat-track warning</span>
        )}
      </div>

      {/* ── AI explanation ─── */}
      {explanation && (
        <div style={styles.explanation}>
          <span aria-hidden="true">💡</span>
          <p>{explanation}</p>
        </div>
      )}

      {/* ── Select button ─── */}
      <button
        id={`select-resort-${rec.resortId}`}
        className={`btn ${selected ? 'btn-secondary' : 'btn-primary'}`}
        style={{ marginTop: '0.25rem', width: '100%' }}
        onClick={() => onSelect(rec)}
        aria-pressed={selected}
      >
        {selected ? '✅ Selected' : '🏔️ Select this Resort'}
      </button>
    </article>
  );
}

const styles = {
  card: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    paddingTop: '1.25rem',
    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
  },
  cardSelected: {
    boxShadow: '0 0 0 2px #4f8ef7, 0 8px 32px rgba(79,142,247,0.25)',
    transform: 'translateY(-2px)',
  },
  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '3px',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
  },
  rankBadge: {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.78rem', fontWeight: 800,
    color: '#0a0f1e', flexShrink: 0, marginTop: '2px',
  },
  titleBlock: { flex: 1 },
  name: {
    fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.2rem',
  },
  sub: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  boardBadge: {
    fontSize: '0.8rem', fontWeight: 600,
    color: 'var(--text-muted)', flexShrink: 0,
  },
  diffRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  diffBadge: {
    fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem',
    borderRadius: 'var(--radius-sm)', border: '1px solid',
    background: 'rgba(255,255,255,0.04)',
  },
  warnBadge: {
    fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    color: '#fcd34d', background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
  },
  explanation: {
    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
    padding: '0.65rem 0.85rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55,
  },
};

export default RecommendationCard;
