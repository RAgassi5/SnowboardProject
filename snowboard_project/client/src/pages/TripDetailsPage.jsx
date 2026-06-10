import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTripById, getResortById, getResortForecast,
  getResortLocations, getResortAssistant, getResortSummary,
  getStoredUser, getStoredRole, deleteTrip,
} from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import GearAdvisorModal from '../components/GearAdvisorModal';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Constants ─────────────────────────────────────────────────────────────────
const LOCATION_TYPES = ['all', 'lift', 'slope', 'restaurant', 'park', 'rental'];
const TYPE_ICONS     = { lift: '🚡', slope: '⛷️', restaurant: '🍽️', park: '🛹', rental: '🏪' };
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
const DIFFICULTY_COLORS = {
  1: '#22c55e', 2: '#38d9c0', 3: '#4f8ef7', 4: '#f59e0b', 5: '#ef4444',
};
const DIFFICULTY_LABELS = {
  1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro / Freeride',
};

// ── Locations table columns ────────────────────────────────────────────────────
const LOCATION_COLUMNS = [
  {
    key: 'type', label: 'Type',
    render: (val) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {TYPE_ICONS[val] ?? '📍'} {val}
      </span>
    ),
  },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
];

// ── Component ─────────────────────────────────────────────────────────────────
function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate   = useNavigate();
  const user       = getStoredUser();
  const role       = getStoredRole();

  // Data state
  const [trip,      setTrip]      = useState(null);
  const [resort,    setResort]    = useState(null);
  const [forecast,  setForecast]  = useState(null);
  const [locations, setLocations] = useState([]);
  const [summary,   setSummary]   = useState(null);

  // Loading/error
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Locations filter
  const [locFilter, setLocFilter] = useState('all');

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);

  // Resort assistant
  const [assistantType,     setAssistantType]     = useState('');
  const [assistantResult,   setAssistantResult]   = useState(null);
  const [assistantLoading,  setAssistantLoading]  = useState(false);
  const [assistantError,    setAssistantError]    = useState('');

  // ── Load all data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const tripData = await getTripById(tripId);
        if (!tripData) throw new Error('Trip not found.');

        const [resortData, forecastData, locData] = await Promise.all([
          getResortById(tripData.resortId),
          getResortForecast(tripData.resortId, tripData.startDate, tripData.endDate),
          getResortLocations(tripData.resortId),
        ]);

        // Resort summary uses user's skill level
        let summaryData = null;
        try {
          summaryData = await getResortSummary({
            resortId:   tripData.resortId,
            skillLevel: user?.skillLevel ?? 3,
          });
        } catch (_) { /* non-critical */ }

        if (!cancelled) {
          setTrip(tripData);
          setResort(resortData);
          setForecast(forecastData);
          setLocations(locData ?? []);
          setSummary(summaryData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tripId, user?.skillLevel]);

  // ── Delete trip ───────────────────────────────────────────────────────────────
  const handleDeleteTrip = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await deleteTrip(trip.tripId);
      navigate('/trips', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  // ── Resort assistant ─────────────────────────────────────────────────────────
  const handleAssistant = async (locType) => {
    if (!resort) return;
    setAssistantType(locType);
    setAssistantResult(null);
    setAssistantLoading(true);
    setAssistantError('');
    try {
      const data = await getResortAssistant(
        { resortId: resort.resortId, locationType: locType, sportType: user?.sportType ?? 'snowboard' },
        role
      );
      setAssistantResult(data);
    } catch (err) {
      setAssistantError(err.message);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Filtered locations for the table
  const filteredLocations = locFilter === 'all'
    ? locations
    : locations.filter(l => l.type === locFilter);

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-content"><LoadingSpinner message="Loading your trip details…" /></div>
  );

  if (error) return (
    <div className="page-content">
      <ErrorMessage message={error} />
      <Link to="/trips" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
        ← Back to My Trips
      </Link>
    </div>
  );

  if (!trip || !resort) return null;

  const dColor    = DIFFICULTY_COLORS[resort.difficultyLevel] ?? '#4f8ef7';
  const dLabel    = DIFFICULTY_LABELS[resort.difficultyLevel] ?? '';
  const nights    = Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000);
  const fmtDate   = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-content" style={{ paddingBottom: '6rem' /* space for FAB */ }}>

      {/* Back + Delete row */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/trips')} className="btn btn-secondary"
          id="back-to-trips" style={{ fontSize: '0.85rem' }}>
          ← Back to My Trips
        </button>
        <button
          id="delete-trip-btn"
          className="btn btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          style={{ fontSize: '0.85rem', marginLeft: 'auto' }}
        >
          {deleting ? '…' : '🗑 Delete Trip'}
        </button>
      </div>

      {/* ── SECTION 1: Trip Overview ─────────────────────────────────────── */}
      <section className="card" style={styles.heroCard} aria-label="Trip overview">
        <div style={{ ...styles.heroAccent, background: dColor }} aria-hidden="true" />
        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroBadge}>Trip #{trip.tripId}</div>
            <h1 style={styles.heroTitle}>{resort.name}</h1>
            <div style={styles.heroSub}>
              🌍 {resort.country} &nbsp;·&nbsp;
              📏 {resort.elevation?.toLocaleString()} m &nbsp;·&nbsp;
              <span style={{ color: dColor }}>{dLabel}</span>
            </div>
          </div>

          <div style={styles.heroStats}>
            <div style={styles.heroStat}>
              <div style={styles.heroStatVal}>{nights}</div>
              <div style={styles.heroStatLabel}>Nights</div>
            </div>
            <div style={styles.heroStat}>
              <div style={{ ...styles.heroStatVal, fontSize: '0.95rem' }}>
                {fmtDate(trip.startDate)}
              </div>
              <div style={styles.heroStatLabel}>Check In</div>
            </div>
            <div style={styles.heroStat}>
              <div style={{ ...styles.heroStatVal, fontSize: '0.95rem' }}>
                {fmtDate(trip.endDate)}
              </div>
              <div style={styles.heroStatLabel}>Check Out</div>
            </div>
          </div>
        </div>

        {/* Snowboard friendly status */}
        <div style={styles.boardRow}>
          <span style={resort.snowboardFriendly ? styles.boardYes : styles.boardWarn}>
            {resort.snowboardFriendly
              ? '🏂 Snowboard Friendly — minimal flat cat-tracks'
              : '⚠️ Cat-track warning — challenging for snowboarders between sectors'}
          </span>
        </div>
      </section>

      {/* ── SECTION 2: Weather Conditions ────────────────────────────────── */}
      {forecast?.days?.length > 0 && (
        <section aria-label="Weather forecast" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>🌤️ Weather Conditions</h2>
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
          <p style={styles.sectionSub}>
            {forecast.label} for {resort.name}
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
              <div key={day.date} className="card" style={styles.forecastDay}>
                <div style={styles.forecastIcon}>{weatherIcon(day.snowfall, day.precipitation, day.windMax, day.tempMax)}</div>
                <div style={styles.forecastDate}>{day.date}</div>
                <div style={styles.forecastRow}>❄️ <strong>{day.snowfall ?? 0} cm</strong> snowfall</div>
                <div style={styles.forecastRow}>🌡️ <strong>{day.tempMax}°C / {day.tempMin}°C</strong></div>
                <div style={styles.forecastRow}>💨 <strong>{day.windMax} kph</strong></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECTION 3: AI Suitability Summary ───────────────────────────── */}
      {summary && (
        <section className="card" style={{ marginBottom: '2rem' }} aria-label="AI summary">
          <h2 style={styles.sectionTitle}>🤖 AI Suitability Summary</h2>
          <p style={styles.summaryText}>{summary.summary}</p>
          <div style={styles.summaryMeta}>
            Resort difficulty: <strong>{summary.resortDifficultyLabel}</strong> &nbsp;·&nbsp;
            Your level: <strong>{summary.skillLevelLabel}</strong>
          </div>
        </section>
      )}

      {/* ── SECTION 4: In-Resort Locations ──────────────────────────────── */}
      <section aria-label="In-resort locations" style={{ marginBottom: '2rem' }}>
        <h2 style={styles.sectionTitle}>📍 In-Resort Locations</h2>
        <p style={styles.sectionSub}>{locations.length} locations available at {resort.name}</p>

        {/* Type filter tabs */}
        <div style={styles.filterTabs} role="group" aria-label="Location type filter">
          {LOCATION_TYPES.map(t => (
            <button
              key={t}
              id={`loc-filter-${t}`}
              onClick={() => setLocFilter(t)}
              style={{
                ...styles.filterTab,
                ...(locFilter === t ? styles.filterTabActive : {}),
              }}
              aria-pressed={locFilter === t}
            >
              {t === 'all' ? '🗺️ All' : `${TYPE_ICONS[t]} ${t}`}
            </button>
          ))}
        </div>

        {/* Locations data table */}
        <DataTable
          id="locations-table"
          columns={LOCATION_COLUMNS}
          data={filteredLocations}
          emptyMessage={locFilter === 'all'
            ? `No locations found for ${resort.name}.`
            : `No ${locFilter}s found at ${resort.name}.`}
        />
      </section>

      {/* ── SECTION 5: Resort Assistant ──────────────────────────────────── */}
      <section className="card" style={{ marginBottom: '2rem' }} aria-label="Resort assistant">
        <h2 style={styles.sectionTitle}>🧭 Resort Assistant</h2>
        <p style={styles.sectionSub}>
          Get sport-tailored advice for a specific type of location at {resort.name}.
        </p>

        <div style={styles.assistantTypes}>
          {LOCATION_TYPES.filter(t => t !== 'all').map(t => (
            <button
              key={t}
              id={`assistant-${t}`}
              onClick={() => handleAssistant(t)}
              className={assistantType === t ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.85rem' }}
            >
              {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}s
            </button>
          ))}
        </div>

        {assistantLoading && <LoadingSpinner message="Getting advice…" />}
        <ErrorMessage message={assistantError} onDismiss={() => setAssistantError('')} />

        {!assistantLoading && assistantResult && (
          <div style={styles.assistantResult}>
            <div style={styles.generalTip}>
              <span aria-hidden="true">💡</span>
              <p>{assistantResult.generalTip}</p>
            </div>
            {assistantResult.inResortSpots?.length > 0 && (
              <div style={{ marginTop: '0.85rem' }}>
                <div style={styles.spotsLabel}>Recommended spots:</div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {assistantResult.inResortSpots.map(spot => (
                    <li key={spot.locationId} style={styles.spotItem}>
                      <strong>{spot.name}</strong>
                      {spot.description && ` — ${spot.description}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {assistantResult.inResortSpots?.length === 0 && (
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                No specific {assistantType} spots found in our database for this resort.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Gear Advisor floating button + modal ────────────────────────── */}
      <GearAdvisorModal resortId={resort.resortId} resortName={resort.name} />

      {/* ── Delete confirm dialog ────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Trip?"
          message={`Permanently delete your trip to ${resort.name}? This cannot be undone.`}
          confirmText="Delete Trip"
          onConfirm={handleDeleteTrip}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  heroCard: {
    position: 'relative', overflow: 'hidden',
    paddingTop: '1.5rem', marginBottom: '2rem',
  },
  heroAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
  },
  heroContent: {
    display: 'flex', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: '1.5rem',
    marginBottom: '1.25rem',
  },
  heroBadge: {
    display: 'inline-block', fontSize: '0.75rem',
    fontWeight: 600, color: 'var(--accent-light)',
    background: 'rgba(79,142,247,0.1)',
    border: '1px solid rgba(79,142,247,0.2)',
    borderRadius: 'var(--radius-full)', padding: '0.2rem 0.7rem',
    marginBottom: '0.5rem',
  },
  heroTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800,
    color: 'var(--text-primary)', marginBottom: '0.35rem',
  },
  heroSub: { fontSize: '0.88rem', color: 'var(--text-muted)' },
  heroStats: {
    display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start',
  },
  heroStat: { textAlign: 'center' },
  heroStatVal: {
    fontSize: '1.35rem', fontWeight: 800,
    color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
    lineHeight: 1,
  },
  heroStatLabel: {
    fontSize: '0.68rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '3px',
  },
  boardRow: { borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' },
  boardYes: {
    fontSize: '0.82rem', color: '#5eead4', fontWeight: 600,
  },
  boardWarn: {
    fontSize: '0.82rem', color: '#fcd34d', fontWeight: 600,
  },
  sectionTitle: {
    fontSize: '1.2rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.25rem',
  },
  sectionSub: {
    fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1rem',
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
    flex: '1 1 150px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.35rem', padding: '1rem',
    textAlign: 'center',
  },
  forecastIcon: { fontSize: '2rem' },
  forecastDate: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 },
  forecastRow: { fontSize: '0.83rem', color: 'var(--text-secondary)' },
  summaryText: {
    fontSize: '0.9rem', color: 'var(--text-secondary)',
    lineHeight: 1.7, marginBottom: '0.75rem',
  },
  summaryMeta: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  filterTabs: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  filterTab: {
    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-subtle)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 600,
    transition: 'all 0.15s ease',
    textTransform: 'capitalize',
  },
  filterTabActive: {
    background: 'rgba(79,142,247,0.15)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-light)',
  },
  assistantTypes: {
    display: 'flex', flexWrap: 'wrap', gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  assistantResult: {
    padding: '1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    marginTop: '0.75rem',
  },
  generalTip: {
    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
    fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6,
  },
  spotsLabel: {
    fontSize: '0.75rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: 'var(--text-muted)', marginBottom: '0.4rem',
  },
  spotItem: {
    fontSize: '0.85rem', color: 'var(--text-secondary)',
    lineHeight: 1.5, marginBottom: '0.25rem',
  },
};

export default TripDetailsPage;
