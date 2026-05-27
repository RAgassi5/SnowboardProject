import React, { useState, useEffect } from 'react';
import { recommendResorts, getResorts, getStoredUser, getStoredRole } from '../services/api';
import ResortCard from '../components/ResortCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Validation ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const validate = ({ startDate, endDate, skillLevel, sportType }) => {
  const errors = {};
  if (!startDate)  errors.startDate = 'Start date is required.';
  if (!endDate)    errors.endDate   = 'End date is required.';
  if (startDate && endDate && startDate >= endDate)
    errors.endDate = 'End date must be after start date.';
  if (!skillLevel)
    errors.skillLevel = 'Skill level is required.';
  else if (![1,2,3,4,5].includes(parseInt(skillLevel)))
    errors.skillLevel = 'Skill level must be between 1 and 5.';
  if (!sportType)
    errors.sportType = 'Sport type is required.';
  else if (!['ski','snowboard'].includes(sportType))
    errors.sportType = 'Sport type must be ski or snowboard.';
  return errors;
};

// ── Component ─────────────────────────────────────────────────────────────────
function RecommendPage() {
  const user = getStoredUser();
  const role = getStoredRole();

  const [form, setForm] = useState({
    startDate:  today(),
    endDate:    '',
    skillLevel: user?.skillLevel?.toString() ?? '3',
    sportType:  user?.sportType ?? 'snowboard',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [results, setResults]   = useState(null);
  const [resorts, setResorts]   = useState([]);

  // Pre-fetch resort list for ID resolution
  useEffect(() => {
    getResorts().then(setResorts).catch(() => {});
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
    setResults(null);
    try {
      const data = await recommendResorts({
        startDate:  form.startDate,
        endDate:    form.endDate,
        skillLevel: parseInt(form.skillLevel),
        sportType:  form.sportType,
      }, role);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enrich recommendation with full resort data for ResortCard
  const enrichedRecs = results?.recommendations?.map((rec) => {
    const full = resorts.find((r) => r.resortId === rec.resortId) ?? {};
    return { ...full, ...rec };
  }) ?? [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Resort Recommendations</h1>
        <p>Tell us about your trip and we'll rank the top 3 resorts that suit you best.</p>
      </div>

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <div style={styles.layout}>
        <div className="card" style={styles.formCard}>
          <h2 style={styles.formTitle}>🎯 Find My Resort</h2>

          <form onSubmit={handleSubmit} noValidate id="recommend-form">

            {/* Date row */}
            <div style={styles.dateRow}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="rec-startDate" className="form-label">Start Date</label>
                <input
                  id="rec-startDate" name="startDate" type="date"
                  className={`form-input ${fieldErrors.startDate ? 'error' : ''}`}
                  value={form.startDate} onChange={handleChange}
                  min={today()}
                />
                {fieldErrors.startDate && (
                  <span className="form-error" role="alert">⚠ {fieldErrors.startDate}</span>
                )}
              </div>

              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="rec-endDate" className="form-label">End Date</label>
                <input
                  id="rec-endDate" name="endDate" type="date"
                  className={`form-input ${fieldErrors.endDate ? 'error' : ''}`}
                  value={form.endDate} onChange={handleChange}
                  min={form.startDate || today()}
                />
                {fieldErrors.endDate && (
                  <span className="form-error" role="alert">⚠ {fieldErrors.endDate}</span>
                )}
              </div>
            </div>

            {/* Skill level */}
            <div className="form-group">
              <label htmlFor="rec-skillLevel" className="form-label">
                Skill Level
                <span style={styles.skillHint}>
                  &nbsp;({SKILL_LABELS[form.skillLevel] ?? '…'})
                </span>
              </label>
              <select
                id="rec-skillLevel" name="skillLevel"
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
                {['ski', 'snowboard'].map((sport) => (
                  <label key={sport} htmlFor={`sport-${sport}`} style={{
                    ...styles.sportOption,
                    ...(form.sportType === sport ? styles.sportOptionActive : {}),
                  }}>
                    <input
                      id={`sport-${sport}`} type="radio"
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
              type="submit" id="recommend-submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner spinner-sm" /> Finding resorts…</>
                : '🎯 Get Top 3 Recommendations'}
            </button>
          </form>
        </div>

        {/* ── Results panel ───────────────────────────────────────────────── */}
        <div style={styles.results}>
          {loading && <LoadingSpinner message="Analysing resorts for you…" />}

          {!loading && !results && !error && (
            <div className="empty-state" style={{ paddingTop: '3rem' }}>
              <span className="empty-icon">🏔️</span>
              <h3>No results yet</h3>
              <p>Fill in the form and click "Get Top 3 Recommendations" to see your personalised picks.</p>
            </div>
          )}

          {!loading && results && (
            <>
              <div style={styles.resultsHeader}>
                <h2 style={styles.resultsTitle}>🏆 Your Top 3 Picks</h2>
                <p style={styles.resultsMeta}>
                  {results.startDate} → {results.endDate} &nbsp;·&nbsp;
                  {SKILL_LABELS[results.skillLevel]} &nbsp;·&nbsp;
                  {results.sportType === 'snowboard' ? '🏂' : '⛷️'} {results.sportType}
                </p>
              </div>

              <div style={styles.recList}>
                {enrichedRecs.map((rec) => (
                  <div key={rec.resortId}>
                    <ResortCard resort={rec} rank={rec.rank} />
                    {rec.explanation && (
                      <div style={styles.explanation}>
                        <span aria-hidden="true">💡</span>
                        <p>{rec.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Constants & Styles ────────────────────────────────────────────────────────
const SKILL_LABELS = {
  '1': 'First-Timer', '2': 'Novice', '3': 'Intermediate',
  '4': 'Expert', '5': 'Pro / Freeride',
};

const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  formCard: { position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' },
  formTitle: { fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem',
    color: 'var(--text-primary)' },
  dateRow: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  skillHint: { color: 'var(--accent-light)', fontSize: '0.8rem', fontWeight: 400 },
  sportToggle: { display: 'flex', gap: '0.75rem' },
  sportOption: {
    flex: 1, textAlign: 'center', padding: '0.65rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s ease',
  },
  sportOptionActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-light)',
  },
  results: { minHeight: 300 },
  resultsHeader: { marginBottom: '1.25rem' },
  resultsTitle: { fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)',
    marginBottom: '0.3rem' },
  resultsMeta: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  recList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  explanation: {
    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    marginTop: '0.5rem', padding: '0.75rem 1rem',
    background: 'rgba(79,142,247,0.06)',
    border: '1px solid rgba(79,142,247,0.12)',
    borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
    color: 'var(--text-secondary)', lineHeight: 1.6,
  },
};

export default RecommendPage;
