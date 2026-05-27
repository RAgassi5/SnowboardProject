import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserTrips, getResorts, getStoredUser } from '../services/api';
import TripCard from '../components/TripCard';
import LoadingSpinner from '../components/LoadingSpinner';

function DashboardPage() {
  const user = getStoredUser();

  const [trips,   setTrips]   = useState([]);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [tripsData, resortsData] = await Promise.all([
          getUserTrips(user.userId),
          getResorts(),
        ]);
        if (!cancelled) {
          setTrips(tripsData);
          setResorts(resortsData);
        }
      } catch (_) {
        // Dashboard fails gracefully — data not critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.userId]);

  const recentTrips = trips.slice(0, 3);
  const enrichedTrips = recentTrips.map(t => ({
    ...t,
    resort: resorts.find(r => r.resortId === t.resortId) ?? null,
  }));

  return (
    <div className="page-content">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={styles.hero} aria-label="Welcome">
        <div style={styles.heroBadge}>🏔️ Ski &amp; Snowboard Trip Planner</div>
        <h1 style={styles.heroTitle}>
          Welcome back,{' '}
          <span style={styles.heroName}>{user?.firstName ?? 'Rider'}</span>
        </h1>
        <p style={styles.heroSub}>
          Plan your next winter adventure — discover resorts, save trips, and get personalised gear &amp; location advice.
        </p>
        <div style={styles.heroActions}>
          <Link to="/plan-trip" id="dashboard-plan-trip" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 1.75rem' }}>
            🏔️ Plan a New Trip
          </Link>
          <Link to="/trips" id="dashboard-my-trips" className="btn btn-secondary">
            📋 My Trips ({trips.length})
          </Link>
        </div>

        {/* Stats strip */}
        <div style={styles.statsStrip}>
          <StatPill icon="⛷️" value={resorts.length || 5} label="Resorts" />
          <div style={styles.divider} aria-hidden="true" />
          <StatPill icon="✈️" value={trips.length} label="Your Trips" />
          <div style={styles.divider} aria-hidden="true" />
          <StatPill icon="🤖" value="AI" label="Recommendations" />
          <div style={styles.divider} aria-hidden="true" />
          <StatPill icon="🎒" value="AI" label="Gear Advisor" />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '2.5rem' }} aria-label="How it works">
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div className="grid-3">
          <StepCard num="1" icon="🎯" title="Get AI Recommendations"
            desc="Enter your dates, sport type, and skill level. Our AI scores and ranks the top 3 resorts for you." />
          <StepCard num="2" icon="💾" title="Save Your Trip"
            desc="Select a resort, review the forecast and suitability summary, then save your trip in one click." />
          <StepCard num="3" icon="🗺️" title="Explore &amp; Pack"
            desc="Open your trip to see in-resort locations, get tailored assistant advice, and build your gear list." />
        </div>
      </section>

      {/* ── RECENT TRIPS ─────────────────────────────────────────────────── */}
      <section aria-label="Recent trips">
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>My Recent Trips</h2>
            <p style={styles.sectionSub}>Your latest planned adventures</p>
          </div>
          <Link to="/trips" id="dashboard-view-all-trips" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            View All →
          </Link>
        </div>

        {loading && <LoadingSpinner message="Loading your trips…" />}

        {!loading && trips.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏔️</span>
            <h3>No trips yet</h3>
            <p>Plan your first ski or snowboard trip to see it here.</p>
            <Link to="/plan-trip" className="btn btn-primary"
              id="empty-plan-trip-cta" style={{ marginTop: '0.75rem' }}>
              🏔️ Plan Your First Trip
            </Link>
          </div>
        )}

        {!loading && enrichedTrips.length > 0 && (
          <div className="grid-3">
            {enrichedTrips.map(({ resort, ...trip }) => (
              <TripCard key={trip.tripId} trip={trip} resort={resort} />
            ))}
          </div>
        )}
      </section>

      {/* ── QUICK LINKS ──────────────────────────────────────────────────── */}
      <section style={{ marginTop: '2.5rem' }} aria-label="Quick navigation">
        <hr className="section-divider" />
        <h2 style={styles.sectionTitle}>Quick Links</h2>
        <div className="grid-3" style={{ marginTop: '1rem' }}>
          <QuickLink id="ql-plan" to="/plan-trip" icon="🎯" title="Plan a Trip"
            desc="Get AI-powered resort recommendations and create a new trip." />
          <QuickLink id="ql-resorts" to="/resorts" icon="🏔️" title="Browse Resorts"
            desc="View the full resort database with difficulty, terrain, and snowboard info." />
          <QuickLink id="ql-settings" to="/settings" icon="⚙️" title="My Profile"
            desc="Update your name, sport type, and skill level to personalise your recommendations." />
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.3rem' }} aria-hidden="true">{icon}</span>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}

function StepCard({ num, icon, title, desc }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%',
          background: 'var(--grad-accent)', color: '#0a0f1e',
          fontWeight: 800, fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0 }}>
          {num}
        </div>
        <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{icon}</span>
      </div>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  );
}

function QuickLink({ id, to, icon, title, desc }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ fontSize: '1.8rem' }} aria-hidden="true">{icon}</div>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>{desc}</p>
      <Link to={to} id={id} className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.85rem' }}>
        Go →
      </Link>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  hero: {
    background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(56,217,192,0.05) 100%)',
    border: '1px solid var(--border-card)', borderRadius: 'var(--radius-xl)',
    padding: '2.25rem', marginBottom: '2.5rem',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.3rem 0.85rem',
    background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
    borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--accent-light)', letterSpacing: '0.04em', marginBottom: '0.85rem',
  },
  heroTitle: {
    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800,
    color: 'var(--text-primary)', marginBottom: '0.5rem',
    fontFamily: 'var(--font-display)', lineHeight: 1.2,
  },
  heroName: {
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  heroSub: {
    fontSize: '1rem', color: 'var(--text-secondary)',
    maxWidth: '540px', marginBottom: '1.5rem', lineHeight: 1.65,
  },
  heroActions: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' },
  statsStrip: {
    display: 'flex', flexWrap: 'wrap', gap: '1.25rem',
    paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)',
    alignItems: 'center',
  },
  divider: { width: 1, background: 'var(--border-subtle)', alignSelf: 'stretch' },
  sectionHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' },
  sectionSub:  { fontSize: '0.83rem', color: 'var(--text-muted)' },
};

export default DashboardPage;
