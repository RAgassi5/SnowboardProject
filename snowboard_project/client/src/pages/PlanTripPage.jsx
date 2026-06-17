import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  recommendResorts, getResortForecast, getResortSummary,
  createTrip, getStoredUser, getStoredRole,
} from '../services/api';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const validate = ({ startDate, endDate, skillLevel, sportType }) => {
  const errs = {};
  if (!startDate) errs.startDate = 'Start date is required.';
  if (!endDate)   errs.endDate   = 'End date is required.';
  if (startDate && endDate && startDate >= endDate)
    errs.endDate = 'End date must be after start date.';
  if (!skillLevel) errs.skillLevel = 'Please select a skill level.';
  if (!sportType)  errs.sportType  = 'Please select a sport type.';
  return errs;
};

const weatherIcon = (snowfall, precipitation, windMax, tempMax) => {
  const stormy = (windMax > 35) || (precipitation > 8 && windMax > 20);
  if (stormy && (snowfall > 0 || precipitation > 1)) return '⛈️';
  if (snowfall > 0)        return '🌨️';
  if (precipitation > 5)   return '🌧️';
  if (precipitation > 0.5) return '⛅';
  if (tempMax >= 15)       return '☀️';
  if (tempMax >= 3)        return '⛅';
  return '☁️';
};

const CONFIDENCE_COLOR = { high: '#22c55e', medium: '#4f8ef7', low: '#f59e0b' };
const CONFIDENCE_BG    = { high: 'rgba(34,197,94,0.12)', medium: 'rgba(79,142,247,0.12)', low: 'rgba(245,158,11,0.12)' };
const CONFIDENCE_LABEL = { high: 'Live forecast', medium: 'Historical', low: 'Typical avg' };

// ── Component ─────────────────────────────────────────────────────────────────
function PlanTripPage() {
  const user     = getStoredUser();
  const role     = getStoredRole();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Pre-selected resort (arrived from Resort Details "Create Trip" button) ───
  const [presetResort, setPresetResort] = useState(location.state?.presetResort ?? null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    startDate:  today(),
    endDate:    '',
    skillLevel: (user?.skillLevel ?? 3).toString(),
    sportType:  user?.sportType ?? 'snowboard',
    privacy:    'public',
    maxMembers: '',
  });
  const [fieldErrors, setFieldErrors]    = useState({});
  const [recsLoading, setRecsLoading]    = useState(false);
  const [recsError, setRecsError]        = useState('');
  const [recommendations, setRecommendations] = useState(null);

  // ── Selected resort + trip builder state ────────────────────────────────────
  const [selected, setSelected]          = useState(null); // full rec object
  const [forecast, setForecast]          = useState(null);
  const [summary, setSummary]            = useState(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError]  = useState('');

  // ── Save trip state ─────────────────────────────────────────────────────────
  const [saving, setSaving]              = useState(false);
  const [saveError, setSaveError]        = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
    if (recsError) setRecsError('');
  };

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setRecsLoading(true);
    setRecsError('');
    setRecommendations(null);
    setSelected(null);
    setForecast(null);
    setSummary(null);
    try {
      const data = await recommendResorts({
        startDate:  form.startDate,
        endDate:    form.endDate,
        skillLevel: parseInt(form.skillLevel),
        sportType:  form.sportType,
      }, role);
      setRecommendations(data);
    } catch (err) {
      setRecsError(err.message);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleSelectResort = async (rec) => {
    setSelected(rec);
    setForecast(null);
    setSummary(null);
    setBuilderLoading(true);
    setBuilderError('');

    try {
      const [forecastData, summaryData] = await Promise.all([
        getResortForecast(rec.resortId, form.endDate ? form.startDate : null, form.endDate || null),
        getResortSummary({ resortId: rec.resortId, skillLevel: parseInt(form.skillLevel) }),
      ]);
      setForecast(forecastData);
      setSummary(summaryData);
    } catch (err) {
      setBuilderError(err.message);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleContinueWithPreset = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    await handleSelectResort({
      resortId:           presetResort.resortId,
      resortName:         presetResort.name,
      country:            presetResort.country,
      difficultyLevel:    presetResort.difficultyLevel,
      snowboardFriendly:  presetResort.snowboardFriendly,
    });
  };

  const handleSaveTrip = async () => {
    if (!selected || !user) return;
    setSaving(true);
    setSaveError('');
    try {
      await createTrip({
        userId:     user.userId,
        resortId:   selected.resortId,
        startDate:  form.startDate,
        endDate:    form.endDate,
        skillLevel: parseInt(form.skillLevel),
        sportType:  form.sportType,
        privacy:    form.privacy,
        maxMembers: form.maxMembers ? parseInt(form.maxMembers) : null,
      }, role);
      navigate('/trips');
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🏔️ Plan Your Trip</h1>
        <p>Tell us about your trip — we'll recommend the top 3 resorts that suit you best.</p>
      </div>

      {/* ── STEP 1: Trip preference form ─────────────────────────────────── */}
      <section style={styles.formSection} aria-label="Trip preferences">
        <div style={styles.stepLabel}>
          <span style={styles.stepNum}>1</span>
          <span style={styles.stepTitle}>Enter Your Trip Details</span>
        </div>

        {presetResort && (
          <div style={styles.presetBanner}>
            <span>🏔️ Creating a trip for <strong>{presetResort.name}</strong> — fill in your trip details below.</span>
            <button type="button" id="choose-different-resort-btn" onClick={() => navigate('/resorts')}
              style={styles.presetBannerLink}>
              Choose a different resort
            </button>
          </div>
        )}

        <form onSubmit={presetResort ? handleContinueWithPreset : handleGetRecommendations} noValidate id="plan-trip-form">
          <div style={styles.formGrid}>
            {/* Start date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pt-startDate" className="form-label">Start Date</label>
              <input
                id="pt-startDate" name="startDate" type="date"
                className={`form-input ${fieldErrors.startDate ? 'error' : ''}`}
                value={form.startDate} onChange={handleChange} min={today()}
              />
              {fieldErrors.startDate && (
                <span className="form-error" role="alert">⚠ {fieldErrors.startDate}</span>
              )}
            </div>

            {/* End date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pt-endDate" className="form-label">End Date</label>
              <input
                id="pt-endDate" name="endDate" type="date"
                className={`form-input ${fieldErrors.endDate ? 'error' : ''}`}
                value={form.endDate} onChange={handleChange}
                min={form.startDate || today()}
              />
              {fieldErrors.endDate && (
                <span className="form-error" role="alert">⚠ {fieldErrors.endDate}</span>
              )}
            </div>

            {/* Skill level */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pt-skillLevel" className="form-label">Skill Level</label>
              <select
                id="pt-skillLevel" name="skillLevel"
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sport Type</label>
              <div style={styles.sportToggle}>
                {['ski', 'snowboard'].map(sport => (
                  <label key={sport} htmlFor={`pt-sport-${sport}`}
                    style={{ ...styles.sportOpt, ...(form.sportType === sport ? styles.sportOptActive : {}) }}>
                    <input id={`pt-sport-${sport}`} type="radio" name="sportType"
                      value={sport} checked={form.sportType === sport}
                      onChange={handleChange} style={{ display: 'none' }} />
                    {sport === 'ski' ? '⛷️ Ski' : '🏂 Snowboard'}
                  </label>
                ))}
              </div>
              {fieldErrors.sportType && (
                <span className="form-error" role="alert">⚠ {fieldErrors.sportType}</span>
              )}
            </div>

            {/* Privacy */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Trip Privacy</label>
              <div style={styles.sportToggle}>
                {[
                  { value: 'public',       label: '🌍 Public' },
                  { value: 'friends-only', label: '👥 Friends Only' },
                  { value: 'private',      label: '🔒 Private' },
                ].map(opt => (
                  <label key={opt.value} htmlFor={`pt-privacy-${opt.value}`}
                    style={{ ...styles.sportOpt, ...(form.privacy === opt.value ? styles.sportOptActive : {}) }}>
                    <input id={`pt-privacy-${opt.value}`} type="radio" name="privacy"
                      value={opt.value} checked={form.privacy === opt.value}
                      onChange={handleChange} style={{ display: 'none' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Max members */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pt-maxMembers" className="form-label">Max Members <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="pt-maxMembers" name="maxMembers" type="number"
                className="form-input"
                value={form.maxMembers}
                onChange={handleChange}
                min="1" max="100"
                placeholder="No limit"
              />
            </div>
          </div>

          <ErrorMessage message={recsError} onDismiss={() => setRecsError('')} />

          <button type="submit" id="get-recommendations-btn"
            className="btn btn-primary" disabled={recsLoading || builderLoading}
            style={{ marginTop: '1rem' }}>
            {presetResort
              ? (builderLoading
                  ? <><span className="spinner spinner-sm" /> Loading {presetResort.name}…</>
                  : `➡️ Continue with ${presetResort.name}`)
              : (recsLoading
                  ? <><span className="spinner spinner-sm" /> Finding your resorts…</>
                  : '🎯 Get Top 3 Recommendations')}
          </button>
        </form>
      </section>

      {/* ── STEP 2: Top 3 recommendations ──────────────────────────────────── */}
      {!presetResort && recsLoading && <LoadingSpinner message="Analysing resorts for you…" />}

      {!presetResort && !recsLoading && recommendations && (
        <section style={styles.recsSection} aria-label="Resort recommendations">
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>2</span>
            <span style={styles.stepTitle}>Choose Your Resort</span>
          </div>

          <div style={styles.recMeta}>
            {recommendations.startDate} → {recommendations.endDate} &nbsp;·&nbsp;
            {recommendations.skillLevelLabel} &nbsp;·&nbsp;
            {recommendations.sportType === 'snowboard' ? '🏂' : '⛷️'} {recommendations.sportType}
          </div>

          <div className="grid-3">
            {recommendations.recommendations.map(rec => (
              <RecommendationCard
                key={rec.resortId}
                rec={rec}
                selected={selected?.resortId === rec.resortId}
                onSelect={handleSelectResort}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── STEP 3: Trip builder ─────────────────────────────────────────── */}
      {selected && (
        <section style={styles.builderSection} aria-label="Trip builder">
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>3</span>
            <span style={styles.stepTitle}>Review &amp; Save Your Trip</span>
          </div>

          {builderLoading && <LoadingSpinner message="Loading resort details…" />}
          <ErrorMessage message={builderError} onDismiss={() => setBuilderError('')} />

          {!builderLoading && (
            <div style={styles.builderGrid}>

              {/* Resort + dates overview */}
              <div className="card">
                <h3 style={styles.builderTitle}>Trip Overview</h3>
                <div style={styles.overviewGrid}>
                  <OverviewItem icon="🏔️" label="Resort"    value={selected.resortName} />
                  <OverviewItem icon="🌍" label="Country"   value={selected.country} />
                  <OverviewItem icon="📅" label="Dates"
                    value={`${form.startDate} → ${form.endDate}`} />
                  <OverviewItem icon={form.sportType === 'ski' ? '⛷️' : '🏂'}
                    label="Sport" value={form.sportType} />
                  <OverviewItem icon="📊" label="Your level"
                    value={SKILL_LABELS[form.skillLevel] ?? form.skillLevel} />
                  <OverviewItem icon={selected.snowboardFriendly ? '✅' : '⚠️'}
                    label="Board-friendly"
                    value={selected.snowboardFriendly ? 'Yes' : 'Cat-tracks present'} />
                  <OverviewItem
                    icon={{ public: '🌍', 'friends-only': '👥', private: '🔒' }[form.privacy]}
                    label="Privacy"
                    value={{ public: 'Public', 'friends-only': 'Friends Only', private: 'Private' }[form.privacy]} />
                  {form.maxMembers && (
                    <OverviewItem icon="👥" label="Max Members" value={form.maxMembers} />
                  )}
                </div>
              </div>

              {/* AI suitability summary */}
              {summary && (
                <div className="card">
                  <h3 style={styles.builderTitle}>🤖 AI Suitability Summary</h3>
                  <p style={styles.summaryText}>{summary.summary}</p>
                </div>
              )}

              {/* Forecast panel */}
              {forecast && forecast.days?.length > 0 && (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ ...styles.builderTitle, marginBottom: 0 }}>🌤️ Weather Conditions</h3>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: CONFIDENCE_BG[forecast.confidence],
                      color: CONFIDENCE_COLOR[forecast.confidence],
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {CONFIDENCE_LABEL[forecast.confidence]}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {forecast.label} for {forecast.resort?.name}
                    {forecast.partialForecast && ' (partial — forecast horizon reached)'}
                  </p>
                  {forecast.summary && (
                    <div style={styles.forecastSummary}>
                      <span>Avg high: <strong>{forecast.summary.avgTempMax}°C</strong></span>
                      <span>Avg low: <strong>{forecast.summary.avgTempMin}°C</strong></span>
                      <span>❄️ Total snow: <strong>{forecast.summary.totalSnowfall} cm</strong></span>
                      <span>💨 Avg wind: <strong>{forecast.summary.avgWindMax} kph</strong></span>
                    </div>
                  )}
                  <div style={styles.forecastStrip}>
                    {forecast.days.slice(0, 7).map(day => (
                      <div key={day.date} style={styles.forecastDay}>
                        <div style={styles.forecastIcon}>
                          {weatherIcon(day.snowfall, day.precipitation, day.windMax, day.tempMax)}
                        </div>
                        <div style={styles.forecastDate}>{day.date}</div>
                        <div style={styles.forecastStat}>❄️ {day.snowfall ?? 0} cm</div>
                        <div style={styles.forecastStat}>{day.tempMax}°C / {day.tempMin}°C</div>
                        <div style={styles.forecastStat}>💨 {day.windMax} kph</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save trip */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <h3 style={styles.builderTitle}>💾 Save This Trip</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Your trip to <strong style={{ color: 'var(--text-primary)' }}>{selected.resortName}</strong> will be
                  saved and visible in <strong style={{ color: 'var(--text-primary)' }}>My Trips</strong>.
                </p>
                <ErrorMessage message={saveError} onDismiss={() => setSaveError('')} />
                <button id="save-trip-btn" className="btn btn-primary"
                  onClick={handleSaveTrip} disabled={saving}>
                  {saving
                    ? <><span className="spinner spinner-sm" /> Saving…</>
                    : '✅ Save Trip to My Trips'}
                </button>
              </div>

            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function OverviewItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
        {icon} {value}
      </div>
    </div>
  );
}

// ── Constants + Styles ─────────────────────────────────────────────────────────
const SKILL_LABELS = {
  '1': 'First-Timer', '2': 'Novice', '3': 'Intermediate',
  '4': 'Expert', '5': 'Pro / Freeride',
};

const styles = {
  formSection: {
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '1.75rem',
    marginBottom: '2rem',
  },
  stepLabel: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    marginBottom: '1.25rem',
  },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--grad-accent)',
    color: '#0a0f1e', fontWeight: 800, fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  presetBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', flexWrap: 'wrap',
    padding: '0.75rem 1rem', marginBottom: '1.25rem',
    background: 'rgba(79,142,247,0.1)',
    border: '1px solid rgba(79,142,247,0.25)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem', color: 'var(--text-secondary)',
  },
  presetBannerLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--accent-light)', fontSize: '0.82rem', fontWeight: 600,
    textDecoration: 'underline', padding: 0, flexShrink: 0,
  },
  sportToggle: { display: 'flex', gap: '0.6rem' },
  sportOpt: {
    flex: 1, textAlign: 'center', padding: '0.6rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
    cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
    color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s ease',
  },
  sportOptActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)', color: 'var(--accent-light)',
  },
  recsSection: { marginBottom: '2rem' },
  recMeta: {
    fontSize: '0.83rem', color: 'var(--text-muted)',
    marginBottom: '1.25rem',
  },
  builderSection: {},
  builderGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.25rem',
  },
  builderTitle: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  overviewGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0.85rem',
  },
  summaryText: {
    fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
  },
  forecastStrip: {
    display: 'flex', flexWrap: 'wrap', gap: '1rem',
  },
  forecastSummary: {
    display: 'flex', flexWrap: 'wrap', gap: '1rem',
    marginBottom: '1rem', paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.82rem', color: 'var(--text-secondary)',
  },
  forecastDay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    minWidth: 120, gap: '0.3rem',
    flex: '1 1 120px',
  },
  forecastIcon: { fontSize: '1.8rem', marginBottom: '0.2rem' },
  forecastDate: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 },
  forecastStat: { fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 },
};

export default PlanTripPage;
