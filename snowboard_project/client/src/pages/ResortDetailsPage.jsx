import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getResortById, getResortSummary, getResortForecast, getResortLocations,
  getStoredUser,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const LOCATION_TYPE_META = {
  lift:       { label: 'Lifts',        icon: '🚡' },
  slope:      { label: 'Slopes',       icon: '⛷️' },
  restaurant: { label: 'Restaurants',  icon: '🍽️' },
  park:       { label: 'Parks',        icon: '🏂' },
  rental:     { label: 'Rental Shops', icon: '🎿' },
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

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ── Component ─────────────────────────────────────────────────────────────────
function ResortDetailsPage() {
  const { resortId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [resort, setResort]       = useState(null);
  const [summary, setSummary]     = useState(null);
  const [forecast, setForecast]   = useState(null);
  const [weatherNote, setWeatherNote] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setSummary(null);
      setForecast(null);
      setWeatherNote('');
      setLocations([]);

      try {
        const resortData = await getResortById(resortId);
        if (cancelled) return;
        setResort(resortData);

        // AI suitability summary — graceful, page still works if this fails
        getResortSummary({ resortId, skillLevel: user?.skillLevel ?? 3 })
          .then(data => { if (!cancelled) setSummary(data); })
          .catch(() => {});

        // In-resort locations — graceful, empty list if none/fails
        getResortLocations(resortId)
          .then(data => { if (!cancelled) setLocations(data ?? []); })
          .catch(() => {});

        // Weather — prefer last 3 days, fall back to live forecast, then a note
        try {
          const recent = await getResortForecast(resortId, isoDaysAgo(3), isoDaysAgo(1));
          if (!cancelled) setForecast(recent);
        } catch (_) {
          try {
            const live = await getResortForecast(resortId);
            if (!cancelled) setForecast(live);
          } catch (__) {
            if (!cancelled) setWeatherNote("Weather data isn't available for this resort right now.");
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [resortId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTrip = () => {
    navigate('/plan-trip', {
      state: {
        presetResort: {
          resortId:          resort.resortId,
          name:              resort.name,
          country:           resort.country,
          difficultyLevel:   resort.difficultyLevel,
          snowboardFriendly: resort.snowboardFriendly,
          elevation:         resort.elevation,
          terrainType:       resort.terrainType,
        },
      },
    });
  };

  if (loading) return <div className="page-content"><LoadingSpinner message="Loading resort details…" fullPage /></div>;

  if (error || !resort) {
    return (
      <div className="page-content">
        <ErrorMessage message={error || 'Resort not found.'} />
        <Link to="/resorts" className="btn btn-secondary">← Back to Resorts</Link>
      </div>
    );
  }

  const flag = COUNTRY_FLAGS[resort.country] ?? '🌍';
  const dColor = DIFFICULTY_COLORS[resort.difficultyLevel] ?? '#4f8ef7';
  const dLabel = DIFFICULTY_LABELS[resort.difficultyLevel] ?? '';

  const groupedLocations = locations.reduce((acc, loc) => {
    (acc[loc.type] ??= []).push(loc);
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>{flag} {resort.name}</h1>
          <p>{resort.country}</p>
        </div>
        <Link to="/resorts" className="btn btn-secondary" id="resort-details-back-btn">
          ← Back to Resorts
        </Link>
      </div>

      <div style={styles.grid}>

        {/* Overview */}
        <div className="card">
          <h3 style={styles.cardTitle}>Overview</h3>
          <div style={styles.overviewGrid}>
            <OverviewItem icon="🌍" label="Country" value={resort.country} />
            {(resort.latitude != null && resort.longitude != null) && (
              <OverviewItem icon="📍" label="Coordinates"
                value={`${resort.latitude.toFixed(2)}, ${resort.longitude.toFixed(2)}`} />
            )}
            {resort.elevation != null && (
              <OverviewItem icon="📏" label="Elevation" value={`${resort.elevation.toLocaleString()} m`} />
            )}
            {resort.terrainType && (
              <OverviewItem icon="🏔️" label="Terrain"
                value={resort.terrainType.charAt(0).toUpperCase() + resort.terrainType.slice(1)} />
            )}
            <OverviewItem icon="⬛" label="Difficulty"
              value={<span style={{ color: dColor }}>{resort.difficultyLevel} — {dLabel}</span>} />
            <OverviewItem icon={resort.snowboardFriendly ? '✅' : '⚠️'} label="Board-Friendly"
              value={resort.snowboardFriendly ? 'Yes' : 'Has cat-tracks'} />
          </div>
        </div>

        {/* AI suitability summary */}
        {summary && (
          <div className="card">
            <h3 style={styles.cardTitle}>🤖 AI Suitability Summary</h3>
            <p style={styles.summaryText}>{summary.summary}</p>
          </div>
        )}

        {/* Weather */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>🌤️ Weather</h3>
            {forecast && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: CONFIDENCE_BG[forecast.confidence],
                color: CONFIDENCE_COLOR[forecast.confidence],
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {forecast.label}
              </span>
            )}
          </div>

          {weatherNote && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{weatherNote}</p>}

          {forecast && forecast.days?.length > 0 && (
            <>
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
            </>
          )}
        </div>

        {/* In-resort locations */}
        {Object.keys(groupedLocations).length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={styles.cardTitle}>📍 In-Resort Locations</h3>
            <div style={styles.locationGroups}>
              {Object.entries(groupedLocations).map(([type, locs]) => {
                const meta = LOCATION_TYPE_META[type] ?? { label: type, icon: '📌' };
                return (
                  <div key={type}>
                    <div style={styles.locationGroupTitle}>{meta.icon} {meta.label}</div>
                    <ul style={styles.locationList}>
                      {locs.map(loc => (
                        <li key={loc.locationId} style={styles.locationItem}>
                          <strong>{loc.name}</strong>
                          {loc.description && <span style={styles.locationDesc}> — {loc.description}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create trip CTA */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={styles.cardTitle}>🎯 Plan a Trip Here</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Start a trip for <strong style={{ color: 'var(--text-primary)' }}>{resort.name}</strong> — you'll
            choose your dates, sport, skill level, and privacy on the next step.
          </p>
          <button id="create-trip-for-resort-btn" className="btn btn-primary" onClick={handleCreateTrip}>
            🎯 Create Trip for This Resort
          </button>
        </div>

      </div>
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

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.25rem',
  },
  cardTitle: {
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
  forecastSummary: {
    display: 'flex', flexWrap: 'wrap', gap: '1rem',
    marginBottom: '1rem', paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.82rem', color: 'var(--text-secondary)',
  },
  forecastStrip: {
    display: 'flex', flexWrap: 'wrap', gap: '1rem',
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
  locationGroups: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  locationGroupTitle: {
    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  locationList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '0.4rem',
  },
  locationItem: {
    fontSize: '0.82rem', color: 'var(--text-secondary)',
  },
  locationDesc: {
    color: 'var(--text-muted)',
  },
};

export default ResortDetailsPage;
