import React from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS = {
  1: 'First-Timer',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Expert',
  5: 'Pro / Freeride',
};

const TERRAIN_ICONS = {
  mixed:       '🏔️',
  backcountry: '🌨️',
  groomed:     '⛷️',
  park:        '🛹',
};

const COUNTRY_FLAGS = {
  Switzerland: '🇨🇭',
  France:      '🇫🇷',
  Austria:     '🇦🇹',
  Italy:       '🇮🇹',
  Germany:     '🇩🇪',
  USA:         '🇺🇸',
  Canada:      '🇨🇦',
  Japan:       '🇯🇵',
};

/** Maps difficulty 1–5 to a badge colour class */
const difficultyBadgeClass = (level) => {
  if (level <= 1) return 'badge badge-green';
  if (level === 2) return 'badge badge-teal';
  if (level === 3) return 'badge badge-blue';
  if (level === 4) return 'badge badge-amber';
  return 'badge badge-red';
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ResortCard — reusable card displaying key resort information.
 *
 * Props:
 *   resort   {object}   — resort data object from GET /resorts
 *   onClick  {function} — optional click handler
 *   rank     {number}   — optional rank badge (used on recommendations page)
 */
function ResortCard({ resort, onClick, rank }) {
  if (!resort) return null;

  const {
    name,
    country,
    elevation,
    terrainType,
    difficultyLevel,
    snowboardFriendly,
  } = resort;

  const flag        = COUNTRY_FLAGS[country] ?? '🌍';
  const terrainIcon = TERRAIN_ICONS[terrainType] ?? '🏔️';
  const diffLabel   = DIFFICULTY_LABELS[difficultyLevel] ?? `Level ${difficultyLevel}`;

  return (
    <article
      className="card"
      style={styles.card}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`${name} resort card`}
    >
      {/* ── Top accent bar (colour varies by difficulty) ── */}
      <div style={{ ...styles.accentBar, background: accentGradient(difficultyLevel) }} aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* Rank badge (optional) */}
          {rank && (
            <div style={styles.rankBadge} aria-label={`Rank ${rank}`}>
              #{rank}
            </div>
          )}
          <div>
            <h3 style={styles.name}>{name}</h3>
            <div style={styles.location}>
              <span aria-label={`Country: ${country}`}>{flag}</span>
              <span>{country}</span>
            </div>
          </div>
        </div>

        {/* Terrain icon */}
        <div style={styles.terrainBubble} aria-label={`Terrain: ${terrainType}`} title={terrainType}>
          {terrainIcon}
        </div>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div style={styles.statsGrid}>
        <StatItem
          icon="📏"
          label="Elevation"
          value={elevation ? `${elevation.toLocaleString()} m` : 'N/A'}
        />
        <StatItem
          icon={terrainIcon}
          label="Terrain"
          value={terrainType ? terrainType.charAt(0).toUpperCase() + terrainType.slice(1) : 'N/A'}
        />
      </div>

      {/* ── Badges row ─────────────────────────────────────────────────────── */}
      <div style={styles.badgesRow}>
        {/* Difficulty badge */}
        <span className={difficultyBadgeClass(difficultyLevel)}>
          ⬛ {diffLabel}
        </span>

        {/* Snowboard friendly badge */}
        <span className={`badge ${snowboardFriendly ? 'badge-teal' : 'badge-red'}`}>
          {snowboardFriendly ? '🏂 Board-Friendly' : '⚠️ Not Board-Friendly'}
        </span>
      </div>

      {/* ── Snowboard warning note ─────────────────────────────────────────── */}
      {!snowboardFriendly && (
        <div style={styles.warningNote}>
          <span aria-hidden="true">⚠️</span>
          Long flat cat-tracks — challenging for snowboarders
        </div>
      )}
    </article>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function StatItem({ icon, label, value }) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statIcon} aria-hidden="true">{icon}</span>
      <div>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

// ── Accent gradient by difficulty ─────────────────────────────────────────────
const accentGradient = (level) => {
  const gradients = {
    1: 'linear-gradient(90deg, #22c55e, #16a34a)',
    2: 'linear-gradient(90deg, #38d9c0, #0d9488)',
    3: 'linear-gradient(90deg, #4f8ef7, #2563eb)',
    4: 'linear-gradient(90deg, #f59e0b, #d97706)',
    5: 'linear-gradient(90deg, #ef4444, #b91c1c)',
  };
  return gradients[level] ?? gradients[3];
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  card: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'default',
    paddingTop: '1.25rem',
  },
  accentBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
  },
  rankBadge: {
    background: 'var(--grad-accent)',
    color: '#0a0f1e',
    fontWeight: 800,
    fontSize: '0.8rem',
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  name: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.2rem',
    lineHeight: 1.2,
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.83rem',
    color: 'var(--text-muted)',
  },
  terrainBubble: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(79,142,247,0.1)',
    border: '1px solid rgba(79,142,247,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statIcon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    lineHeight: 1,
    marginBottom: '2px',
  },
  statValue: {
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  badgesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  warningNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.77rem',
    color: '#fcd34d',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.65rem',
  },
};

export default ResortCard;
