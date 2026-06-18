import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getResortById, getResortSummary, getResortForecast, getResortLocations,
  getStoredUser,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ResortLocationMap from '../components/ResortLocationMap';

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
  lift:       { label: 'Lifts',        icon: '🚡', color: '#4f8ef7' },
  slope:      { label: 'Slopes',       icon: '⛷️', color: '#38d9c0' },
  restaurant: { label: 'Restaurants',  icon: '🍽️', color: '#f59e0b' },
  park:       { label: 'Parks',        icon: '🏂', color: '#ec4899' },
  rental:     { label: 'Rental Shops', icon: '🎿', color: '#22c55e' },
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

        // Weather — upcoming 7-day forecast starting today; graceful note if unavailable
        try {
          const upcoming = await getResortForecast(resortId);
          if (!cancelled) setForecast(upcoming);
        } catch (_) {
          if (!cancelled) setWeatherNote("Weather data isn't available for this resort right now.");
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

  const hasMetaStrip = Boolean(resort.terrainType) || (resort.latitude != null && resort.longitude != null);

  return (
    <div className="page-content" style={{ maxWidth: 1320 }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={styles.hero}>
        {resort.imageUrl
          ? <img src={resort.imageUrl} alt={resort.name} loading="eager" style={styles.heroImage} />
          : <div style={styles.heroFallbackBg} aria-hidden="true" />}

        <div style={styles.heroOverlay}>
          <div>
            <Link to="/resorts" className="btn btn-secondary" id="resort-details-back-btn">
              ← Back to Resorts
            </Link>
          </div>

          <div>
            <h1 style={styles.heroName}>{flag} {resort.name}</h1>
            <div style={styles.heroBadges}>
              <span style={styles.heroBadge}>{flag} {resort.country}</span>
              <span style={{ ...styles.heroBadge, color: dColor, borderColor: dColor }}>
                ⬛ {resort.difficultyLevel} — {dLabel}
              </span>
              {resort.elevation != null && (
                <span style={styles.heroBadge}>📏 {resort.elevation.toLocaleString()} m</span>
              )}
              <span style={styles.heroBadge}>
                {resort.snowboardFriendly ? '🏂 Board-Friendly' : '⚠️ Has cat-tracks'}
              </span>
            </div>
            <button id="create-trip-for-resort-btn" className="btn btn-primary" style={styles.heroCta} onClick={handleCreateTrip}>
              🎯 Create Trip for This Resort
            </button>
          </div>
        </div>
      </div>

      {/* ── Compact metadata strip ───────────────────────────────────────────── */}
      {hasMetaStrip && (
        <div style={styles.metaStrip}>
          {resort.terrainType && (
            <span style={styles.metaItem}>
              🏔️ Terrain: <strong>{resort.terrainType.charAt(0).toUpperCase() + resort.terrainType.slice(1)}</strong>
            </span>
          )}
          {(resort.latitude != null && resort.longitude != null) && (
            <span style={styles.metaItem}>
              📍 Coordinates: <strong>{resort.latitude.toFixed(2)}, {resort.longitude.toFixed(2)}</strong>
            </span>
          )}
        </div>
      )}

      <div style={styles.grid}>

        {/* Section 1 — AI suitability summary */}
        {summary && (
          <div className="card">
            <h3 style={styles.cardTitle}>🤖 AI Suitability Summary</h3>
            <p style={styles.summaryText}>{summary.summary}</p>
          </div>
        )}

        {/* Section 1b — Resort location map */}
        <ResortLocationMap resort={resort} />

        {/* Section 2 — Weekly weather forecast */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>📅 Weekly Weather Forecast</h3>
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

        {/* Section 3 — In-resort locations, one distinct card per category */}
        {Object.keys(groupedLocations).length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={styles.sectionHeading}>📍 In-Resort Locations</h3>
            <div style={styles.locationCardsGrid}>
              {Object.entries(groupedLocations).map(([type, locs]) => {
                const meta = LOCATION_TYPE_META[type] ?? { label: type, icon: '📌', color: '#4f8ef7' };
                return (
                  <div key={type} className="card" style={styles.locationCard}>
                    <div style={{ ...styles.locationCardAccent, background: meta.color }} aria-hidden="true" />
                    <h4 style={{ ...styles.locationCardTitle, color: meta.color }}>{meta.icon} {meta.label}</h4>
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

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  hero: {
    position: 'relative',
    height: 380,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    boxShadow: 'var(--shadow-card)',
  },
  heroImage: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
  },
  heroFallbackBg: {
    position: 'absolute', inset: 0,
    background: 'var(--grad-hero)',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    background: 'linear-gradient(to top, rgba(8,13,28,0.95) 0%, rgba(8,13,28,0.65) 45%, rgba(8,13,28,0.1) 100%)',
    padding: 'var(--space-xl)',
  },
  heroName: {
    fontSize: '2.4rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    marginBottom: '0.6rem',
    lineHeight: 1.1,
  },
  heroBadges: {
    display: 'flex', flexWrap: 'wrap', gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  heroBadge: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 'var(--radius-full)',
    padding: '0.35rem 0.85rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  heroCta: {
    fontSize: '1rem',
    padding: '0.8rem 1.75rem',
  },
  metaStrip: {
    display: 'flex', flexWrap: 'wrap', gap: '1.75rem',
    marginBottom: '2rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 'var(--space-xl)',
  },
  cardTitle: {
    fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  sectionHeading: {
    fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    marginBottom: '1.1rem',
  },
  summaryText: {
    fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7,
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
    padding: '1rem 1.1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    minWidth: 135, gap: '0.35rem',
    flex: '1 1 135px',
  },
  forecastIcon: { fontSize: '1.9rem', marginBottom: '0.2rem' },
  forecastDate: { fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 },
  forecastStat: { fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 },
  locationCardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 'var(--space-lg)',
  },
  locationCard: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: '1.25rem',
  },
  locationCardAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
  },
  locationCardTitle: {
    fontSize: '0.95rem', fontWeight: 700,
    marginBottom: '0.75rem',
  },
  locationList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  locationItem: {
    fontSize: '0.85rem', color: 'var(--text-secondary)',
  },
  locationDesc: {
    color: 'var(--text-muted)',
  },
};

export default ResortDetailsPage;
