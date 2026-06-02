import React, { useState, useEffect } from 'react';
import { getGearRecommendation, getResorts, getStoredUser, getStoredRole } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Validation ────────────────────────────────────────────────────────────────
const validate = ({ resortId, skillLevel, sportType }) => {
  const errors = {};
  if (!resortId)   errors.resortId   = 'Please select a resort.';
  if (!skillLevel) errors.skillLevel = 'Skill level is required.';
  else if (![1,2,3,4,5].includes(parseInt(skillLevel)))
    errors.skillLevel = 'Skill level must be between 1 and 5.';
  if (!sportType)  errors.sportType  = 'Sport type is required.';
  else if (!['ski','snowboard'].includes(sportType))
    errors.sportType = 'Sport type must be ski or snowboard.';
  return errors;
};

// ── Gear icons map ────────────────────────────────────────────────────────────
const gearIcon = (item = '') => {
  const lower = item.toLowerCase();
  if (lower.includes('helmet'))  return '🪖';
  if (lower.includes('goggle'))  return '🥽';
  if (lower.includes('boot'))    return '👢';
  if (lower.includes('glove') || lower.includes('mitt')) return '🧤';
  if (lower.includes('jacket') || lower.includes('coat')) return '🧥';
  if (lower.includes('ski') && !lower.includes('boot'))  return '⛷️';
  if (lower.includes('board'))   return '🏂';
  if (lower.includes('pole'))    return '🎿';
  if (lower.includes('binding')) return '🔩';
  if (lower.includes('base') || lower.includes('thermal')) return '🧣';
  if (lower.includes('pant') || lower.includes('trouser')) return '👖';
  if (lower.includes('sunscreen') || lower.includes('sun')) return '🌞';
  if (lower.includes('avalanche') || lower.includes('beacon')) return '📡';
  return '🎒';
};

// ── Component ─────────────────────────────────────────────────────────────────
function GearPage() {
  const user = getStoredUser();
  const role = getStoredRole();

  const [resorts, setResorts]   = useState([]);
  const [form, setForm]         = useState({
    resortId:   '',
    skillLevel: user?.skillLevel?.toString() ?? '3',
    sportType:  user?.sportType ?? 'snowboard',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);
  const [resortsLoading, setResortsLoading] = useState(true);

  // Load resort list for dropdown
  useEffect(() => {
    getResorts()
      .then((data) => { setResorts(data); setResortsLoading(false); })
      .catch(() => { setResortsLoading(false); });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getGearRecommendation({
        resortId:   parseInt(form.resortId),
        skillLevel: parseInt(form.skillLevel),
        sportType:  form.sportType,
      }, role);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Gear Recommendations</h1>
        <p>Get a personalised gear checklist based on your resort, skill level, and sport.</p>
      </div>

      <div style={styles.layout}>
        {/* ── Form card ───────────────────────────────────────────────────── */}
        <div className="card" style={styles.formCard}>
          <h2 style={styles.formTitle}>🎿 Configure Your Kit</h2>

          <form onSubmit={handleSubmit} noValidate id="gear-form">

            {/* Resort selector */}
            <div className="form-group">
              <label htmlFor="gear-resortId" className="form-label">Select Resort</label>
              {resortsLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading resorts…</div>
              ) : (
                <select
                  id="gear-resortId" name="resortId"
                  className={`form-input ${fieldErrors.resortId ? 'error' : ''}`}
                  value={form.resortId} onChange={handleChange}
                >
                  <option value="">— Choose a resort —</option>
                  {resorts.map((r) => (
                    <option key={r.resortId} value={r.resortId}>
                      {r.name} ({r.country})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.resortId && (
                <span className="form-error" role="alert">⚠ {fieldErrors.resortId}</span>
              )}
            </div>

            {/* Skill level */}
            <div className="form-group">
              <label htmlFor="gear-skillLevel" className="form-label">Skill Level</label>
              <select
                id="gear-skillLevel" name="skillLevel"
                className={`form-input ${fieldErrors.skillLevel ? 'error' : ''}`}
                value={form.skillLevel} onChange={handleChange}
              >
                <option value="1">1 — First-Timer</option>
                <option value="2">2 — Novice</option>
                <option value="3">3 — Intermediate</option>
                <option value="4">4 — Expert</option>
                <option value="5">5 — Pro / Freeride</option>
              </select>
              {fieldErrors.skillLevel && (
                <span className="form-error" role="alert">⚠ {fieldErrors.skillLevel}</span>
              )}
            </div>

            {/* Sport type */}
            <div className="form-group">
              <label className="form-label">Sport Type</label>
              <div style={styles.sportToggle}>
                {['ski','snowboard'].map((sport) => (
                  <label key={sport} htmlFor={`gear-sport-${sport}`} style={{
                    ...styles.sportOption,
                    ...(form.sportType === sport ? styles.sportActive : {}),
                  }}>
                    <input
                      id={`gear-sport-${sport}`} type="radio"
                      name="sportType" value={sport}
                      checked={form.sportType === sport}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    {sport === 'ski' ? '⛷️ Ski' : '🏂 Snowboard'}
                  </label>
                ))}
              </div>
              {fieldErrors.sportType && (
                <span className="form-error" role="alert">⚠ {fieldErrors.sportType}</span>
              )}
            </div>

            <ErrorMessage message={error} onDismiss={() => setError('')} />

            <button
              type="submit" id="gear-submit"
              className="btn btn-primary btn-full"
              disabled={loading || resortsLoading}
            >
              {loading
                ? <><span className="spinner spinner-sm" /> Building your kit…</>
                : '🎒 Get Gear List'}
            </button>
          </form>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div>
          {loading && <LoadingSpinner message="Building your gear list…" />}

          {!loading && !result && !error && (
            <div className="empty-state" style={{ paddingTop: '3rem' }}>
              <span className="empty-icon">🎿</span>
              <h3>No gear list yet</h3>
              <p>Select your resort, skill level, and sport to get a personalised kit list.</p>
            </div>
          )}

          {!loading && result && (
            <div style={styles.results}>
              {/* Resort summary */}
              <div style={styles.resortBanner}>
                <div>
                  <div style={styles.bannerLabel}>Resort</div>
                  <div style={styles.bannerValue}>{result.resortName}</div>
                </div>
                <div>
                  <div style={styles.bannerLabel}>Sport</div>
                  <div style={styles.bannerValue}>
                    {result.sportType === 'snowboard' ? '🏂 Snowboard' : '⛷️ Ski'}
                  </div>
                </div>
                <div>
                  <div style={styles.bannerLabel}>Skill Level</div>
                  <div style={styles.bannerValue}>
                    {result.skillLevel} — {result.skillLevelLabel}
                  </div>
                </div>
                <div>
                  <div style={styles.bannerLabel}>Board-Friendly</div>
                  <div style={{ ...styles.bannerValue,
                    color: result.snowboardFriendly ? '#5eead4' : '#fca5a5' }}>
                    {result.snowboardFriendly ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
              </div>

              {/* Warning */}
              {result.warning && (
                <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
                  <span>⚠️</span>
                  <span>{result.warning}</span>
                </div>
              )}

              {/* Gear checklist */}
              <h2 style={styles.gearTitle}>📦 Your Gear Checklist</h2>
              <p style={styles.gearSub}>
                {result.suggestedGear?.length ?? 0} items recommended for your trip
              </p>

              <div style={styles.gearGrid}>
                {(result.suggestedGear ?? []).map((item, idx) => (
                  <GearItem key={idx} item={item} idx={idx} />
                ))}
              </div>

              {/* Pack tip */}
              <div style={styles.packTip}>
                <span aria-hidden="true">💡</span>
                <p>
                  Pro tip: Always check your gear fits properly before heading to the slopes.
                  Rental shops at {result.resortName} can help if you need adjustments on the day.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function GearItem({ item, idx }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      id={`gear-item-${idx}`}
      onClick={() => setChecked((c) => !c)}
      style={{
        ...styles.gearItem,
        ...(checked ? styles.gearItemChecked : {}),
      }}
      aria-pressed={checked}
      title="Click to check off"
    >
      <span style={styles.gearIcon}>{gearIcon(item)}</span>
      <span style={{
        ...styles.gearText,
        ...(checked ? { textDecoration: 'line-through', opacity: 0.5 } : {}),
      }}>
        {item}
      </span>
      <span style={styles.gearCheck}>{checked ? '✅' : '☐'}</span>
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  formCard: { position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' },
  formTitle: { fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem',
    color: 'var(--text-primary)' },
  sportToggle: { display: 'flex', gap: '0.75rem' },
  sportOption: {
    flex: 1, textAlign: 'center', padding: '0.65rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s ease',
  },
  sportActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-light)',
  },
  results: {},
  resortBanner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
    padding: '1.25rem',
    background: 'rgba(79,142,247,0.06)',
    border: '1px solid rgba(79,142,247,0.15)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '1.25rem',
  },
  bannerLabel: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: '0.25rem',
  },
  bannerValue: {
    fontSize: '0.95rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  gearTitle: { fontSize: '1.2rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.25rem' },
  gearSub: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' },
  gearGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  gearItem: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.75rem 1rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  gearItemChecked: {
    background: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  gearIcon: { fontSize: '1.25rem', flexShrink: 0 },
  gearText: { flex: 1, fontSize: '0.88rem', color: 'var(--text-secondary)',
    fontWeight: 500, lineHeight: 1.3 },
  gearCheck: { fontSize: '1rem', flexShrink: 0 },
  packTip: {
    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    padding: '0.85rem 1rem',
    background: 'rgba(56,217,192,0.06)',
    border: '1px solid rgba(56,217,192,0.15)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
  },
};

export default GearPage;
