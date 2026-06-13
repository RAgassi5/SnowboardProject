import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, getStoredUser } from '../services/api';
import TripCard from '../components/TripCard';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS = {
  Switzerland: '🇨🇭', France: '🇫🇷', Austria: '🇦🇹',
  Italy: '🇮🇹', USA: '🇺🇸', Canada: '🇨🇦', Japan: '🇯🇵',
};

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function conditionsEmoji(weather) {
  if (!weather) return '❓';
  if ((weather.totalSnowfall ?? 0) > 20) return '❄️';
  if ((weather.avgWindMax ?? 0) > 50) return '🌬️';
  if ((weather.avgTempMax ?? 10) > 5) return '⛅';
  return '🌨️';
}

// ── Sub-cards (inline components) ────────────────────────────────────────────

function SectionCard({ title, icon, children, style }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function NextTripCard({ nextTrip }) {
  const navigate = useNavigate();
  if (!nextTrip) {
    return (
      <div className="card" style={{ ...styles.nextTripCard, justifyContent: 'center', alignItems: 'center', gap: '1rem', flexDirection: 'column', padding: '2.5rem' }}>
        <span style={{ fontSize: '2.5rem' }}>🏔️</span>
        <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>No upcoming trips planned</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Ready for your next adventure?</p>
        <Link to="/plan-trip" className="btn btn-primary">🎯 Plan a Trip</Link>
      </div>
    );
  }

  const flag        = COUNTRY_FLAGS[nextTrip.country] ?? '🌍';
  const days        = nextTrip.daysRemaining;
  const dayColor    = days <= 2 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#38d9c0';
  const totalSlots  = nextTrip.maxMembers;
  const memberCount = nextTrip.approvedMemberCount;

  return (
    <div className="card" style={styles.nextTripCard}>
      {/* Left content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
              Next Trip
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
              {flag} {nextTrip.resortName}
              {nextTrip.country && <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{nextTrip.country}</span>}
            </h2>
            {nextTrip.title && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{nextTrip.title}</div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ ...styles.pill, background: `${dayColor}18`, color: dayColor, border: `1px solid ${dayColor}40` }}>
              {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow!' : `${days} days away`}
            </span>
            {nextTrip.unreadCount > 0 && (
              <span style={styles.unreadBadge}>💬 {nextTrip.unreadCount}</span>
            )}
          </div>
        </div>

        {/* Trip meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          <span>📅 {fmtDate(nextTrip.startDate)} → {fmtDate(nextTrip.endDate)}</span>
          {memberCount != null && (
            <span>👥 {memberCount}{totalSlots ? `/${totalSlots}` : ''} members</span>
          )}
        </div>

        {/* Weather row */}
        {nextTrip.weather && (
          <div style={styles.weatherRow}>
            <span>🌡️ {nextTrip.weather.avgTempMin}°C – {nextTrip.weather.avgTempMax}°C</span>
            {(nextTrip.weather.totalSnowfall ?? 0) > 0 && (
              <span>❄️ {nextTrip.weather.totalSnowfall}cm snowfall</span>
            )}
            {nextTrip.weather.avgWindMax != null && (
              <span>💨 {nextTrip.weather.avgWindMax} kph winds</span>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {nextTrip.weather.confidence} confidence
            </span>
          </div>
        )}
      </div>

      {/* Right CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/trips/${nextTrip.tripId}`)}
          style={{ whiteSpace: 'nowrap' }}
        >
          Open Trip →
        </button>
        <Link to="/trips" className="btn btn-secondary" style={{ textAlign: 'center', fontSize: '0.8rem' }}>
          All Trips
        </Link>
      </div>
    </div>
  );
}

function AttentionCard({ items }) {
  const navigate = useNavigate();
  const empty = !items || items.length === 0;

  const handleClick = (item) => {
    if (item.type === 'join_request')        navigate(`/trips/${item.tripId}`);
    else if (item.type === 'unread_messages') navigate(`/trips/${item.tripId}`);
    else if (item.type === 'trip_starting_soon') navigate(`/trips/${item.tripId}`);
    else if (item.type === 'invitations')    navigate('/trips');
    // friend_requests → ProfilePanel not accessible from here; navigate to a relevant page
    else if (item.type === 'friend_requests') navigate('/');
  };

  return (
    <SectionCard title="Requires Attention" icon="⚡">
      {empty ? (
        <div style={styles.emptySmall}>✅ All clear</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={styles.attentionItem}
              onClick={() => handleClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleClick(item)}
            >
              {item.type === 'join_request' && (
                <>
                  <span style={styles.attentionIcon}>🙋</span>
                  <span style={styles.attentionText}>
                    {item.count > 1
                      ? `${item.count} requests to join ${item.tripName}`
                      : `${item.requesterName} wants to join ${item.tripName}`
                    }
                  </span>
                </>
              )}
              {item.type === 'friend_requests' && (
                <>
                  <span style={styles.attentionIcon}>👥</span>
                  <span style={styles.attentionText}>{item.count} pending friend request{item.count > 1 ? 's' : ''}</span>
                </>
              )}
              {item.type === 'invitations' && (
                <>
                  <span style={styles.attentionIcon}>✉️</span>
                  <span style={styles.attentionText}>{item.count} trip invitation{item.count > 1 ? 's' : ''}</span>
                </>
              )}
              {item.type === 'unread_messages' && (
                <>
                  <span style={styles.attentionIcon}>💬</span>
                  <span style={styles.attentionText}>{item.count} unread in {item.tripName}</span>
                </>
              )}
              {item.type === 'trip_starting_soon' && (
                <>
                  <span style={styles.attentionIcon}>🚨</span>
                  <span style={styles.attentionText}>{item.tripName} starts in {item.daysUntil} day{item.daysUntil > 1 ? 's' : ''}!</span>
                </>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function AISuggestionsCard({ suggestions }) {
  return (
    <SectionCard title="AI Trip Tips" icon="🤖">
      {!suggestions || suggestions.length === 0 ? (
        <div style={styles.emptySmall}>
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Plan an upcoming trip to get personalized AI packing tips</span>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {suggestions.map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <span style={{ color: '#38d9c0', flexShrink: 0, marginTop: '0.05rem' }}>✦</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ConditionsCard({ trips }) {
  const empty = !trips || trips.length === 0;
  return (
    <SectionCard title="Conditions Watch" icon="🌨️">
      {empty ? (
        <div style={styles.emptySmall}>No upcoming trips to watch</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trips.map((t, i) => (
            <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{conditionsEmoji(t.weather)}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.resortName}</span>
                {t.country && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{COUNTRY_FLAGS[t.country] ?? ''} {t.country}</span>}
              </div>
              {t.weather ? (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>
                  {t.weather.avgTempMin}°C–{t.weather.avgTempMax}°C
                  {(t.weather.totalSnowfall ?? 0) > 0 && ` · ❄️ ${t.weather.totalSnowfall}cm`}
                  {(t.weather.avgWindMax ?? 0) > 30 && ` · 💨 ${t.weather.avgWindMax}kph`}
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>Weather data unavailable</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ResortSpotlightCard({ resort }) {
  const DIFFICULTY_LABELS = { 1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro/Freeride' };
  const DIFFICULTY_COLORS = { 1: '#22c55e', 2: '#38d9c0', 3: '#4f8ef7', 4: '#f59e0b', 5: '#ef4444' };

  if (!resort) {
    return (
      <SectionCard title="Resort Spotlight" icon="⛷️">
        <div style={styles.emptySmall}>
          <Link to="/resorts" className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>Browse All Resorts</Link>
        </div>
      </SectionCard>
    );
  }

  const flag   = COUNTRY_FLAGS[resort.country] ?? '🌍';
  const dColor = DIFFICULTY_COLORS[resort.difficultyLevel] ?? '#4f8ef7';
  const dLabel = DIFFICULTY_LABELS[resort.difficultyLevel] ?? '';

  return (
    <SectionCard title="Resort Spotlight" icon="⛷️">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {flag} {resort.name}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{resort.country}</div>
          </div>
          <span style={{ ...styles.pill, color: dColor, background: `${dColor}18`, border: `1px solid ${dColor}40`, flexShrink: 0 }}>
            {dLabel}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {resort.elevation && (
            <span style={styles.metaBadge}>⛰️ {resort.elevation}m</span>
          )}
          {resort.terrainType && (
            <span style={styles.metaBadge}>🗺️ {resort.terrainType}</span>
          )}
          {resort.snowboardFriendly !== undefined && (
            <span style={resort.snowboardFriendly
              ? { ...styles.metaBadge, color: '#5eead4', borderColor: 'rgba(56,217,192,0.3)', background: 'rgba(56,217,192,0.08)' }
              : { ...styles.metaBadge, color: '#fcd34d', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }
            }>
              {resort.snowboardFriendly ? '🏂 Board-Friendly' : '⚠️ Cat-tracks'}
            </span>
          )}
        </div>

        {resort.reason && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
            "{resort.reason}"
          </p>
        )}

        <Link to="/resorts" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.82rem' }}>
          Explore Resort →
        </Link>
      </div>
    </SectionCard>
  );
}

function RecentActivityCard({ activity }) {
  const TYPE_META = {
    join_request: { icon: '🙋', label: (a) => `${a.userName} requested to join ${a.tripName}` },
    join_approved: { icon: '✅', label: (a) => `Your request for ${a.tripName} was approved` },
    friend_request: { icon: '👥', label: (a) => `${a.userName} sent you a friend request` },
  };

  const empty = !activity || activity.length === 0;

  return (
    <SectionCard title="Recent Activity" icon="📋">
      {empty ? (
        <div style={styles.emptySmall}>No recent activity in the last 7 days</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {activity.map((a, i) => {
            const meta = TYPE_META[a.type];
            if (!meta) return null;
            return (
              <li key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{meta.label(a)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{relativeTime(a.timestamp)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DashboardPage() {
  const user = getStoredUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!user?.userId) { setLoading(false); return; }
    let cancelled = false;
    getDashboard()
      .then(data => { if (!cancelled) setDashboard(data); })
      .catch(err  => { if (!cancelled) setError(err.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="page-content">
        <LoadingSpinner message="Loading your command center…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const d = dashboard ?? {};

  return (
    <div className="page-content">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section style={styles.header} aria-label="Welcome">
        <div>
          <div style={styles.headerBadge}>🏔️ Trip Command Center</div>
          <h1 style={styles.headerTitle}>
            Welcome back, <span style={styles.headerName}>{user?.firstName ?? 'Rider'}</span>
          </h1>
          <p style={styles.headerSub}>Your mountain adventure hub</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Link to="/plan-trip" id="dashboard-plan-trip" className="btn btn-primary">
            🏔️ Plan a Trip
          </Link>
          <Link to="/trips" id="dashboard-my-trips" className="btn btn-secondary">
            📋 My Trips
          </Link>
        </div>
      </section>

      {/* ── Next trip ──────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '1.5rem' }} aria-label="Next upcoming trip">
        <NextTripCard nextTrip={d.nextTrip ?? null} />
      </section>

      {/* ── Three-column row ───────────────────────────────────────────────── */}
      <section className="grid-3" style={{ marginBottom: '1.5rem' }} aria-label="Dashboard highlights">
        <AttentionCard items={d.attentionItems ?? []} />
        <AISuggestionsCard suggestions={d.aiSuggestions ?? null} />
        <ConditionsCard trips={d.conditionsWatch ?? []} />
      </section>

      {/* ── Two-column row ─────────────────────────────────────────────────── */}
      <section style={{ ...styles.twoCol, marginBottom: '2rem' }} aria-label="Resort spotlight and activity">
        <ResortSpotlightCard resort={d.resortSpotlight ?? null} />
        <RecentActivityCard activity={d.recentActivity ?? []} />
      </section>

      {/* ── Recent trips ───────────────────────────────────────────────────── */}
      <section aria-label="Recent trips">
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Recent Trips</h2>
            <p style={styles.sectionSub}>Your latest adventures</p>
          </div>
          <Link to="/trips" id="dashboard-view-all-trips" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            View All →
          </Link>
        </div>

        {(!d.recentTrips || d.recentTrips.length === 0) ? (
          <div className="empty-state">
            <span className="empty-icon">🏔️</span>
            <h3>No trips yet</h3>
            <p>Plan your first ski or snowboard trip to see it here.</p>
            <Link to="/plan-trip" className="btn btn-primary" id="empty-plan-trip-cta" style={{ marginTop: '0.75rem' }}>
              🏔️ Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid-3">
            {d.recentTrips.map(({ resort, unreadCount, creator, ...trip }) => (
              <TripCard key={trip.tripId} trip={trip} resort={resort} unreadCount={unreadCount} creator={creator} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '1rem',
    background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(56,217,192,0.05) 100%)',
    border: '1px solid var(--border-card)', borderRadius: 'var(--radius-xl)',
    padding: '1.75rem 2rem', marginBottom: '1.5rem',
  },
  headerBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.3rem 0.85rem',
    background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
    borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--accent-light)', letterSpacing: '0.04em', marginBottom: '0.65rem',
  },
  headerTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 800,
    color: 'var(--text-primary)', margin: '0 0 0.3rem',
    fontFamily: 'var(--font-display)', lineHeight: 1.2,
  },
  headerName: {
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  headerSub: { fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 },

  nextTripCard: {
    display: 'flex', flexWrap: 'wrap', gap: '1.25rem',
    background: 'linear-gradient(135deg, rgba(56,217,192,0.06) 0%, rgba(79,142,247,0.04) 100%)',
    border: '1px solid rgba(56,217,192,0.2)',
    borderRadius: 'var(--radius-xl)', padding: '1.5rem',
  },
  weatherRow: {
    display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
    fontSize: '0.8rem', color: 'var(--text-secondary)',
    background: 'rgba(56,217,192,0.06)', border: '1px solid rgba(56,217,192,0.15)',
    borderRadius: 'var(--radius-md)', padding: '0.55rem 0.85rem',
  },
  pill: {
    fontSize: '0.73rem', fontWeight: 700, padding: '0.25rem 0.7rem',
    borderRadius: 'var(--radius-full)',
  },
  unreadBadge: {
    fontSize: '0.73rem', fontWeight: 700, padding: '0.25rem 0.65rem',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.3)',
  },

  attentionItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.55rem 0.65rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)', cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontSize: '0.82rem',
  },
  attentionIcon: { fontSize: '0.95rem', flexShrink: 0 },
  attentionText: { color: 'var(--text-secondary)', flex: 1, lineHeight: 1.35 },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },

  metaBadge: {
    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)',
  },

  emptySmall: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    textAlign: 'center', padding: '0.75rem 0',
    color: 'var(--text-muted)', fontSize: '0.82rem',
  },

  sectionHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' },
  sectionSub:   { fontSize: '0.83rem', color: 'var(--text-muted)' },
};

export default DashboardPage;
