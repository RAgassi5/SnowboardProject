import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser, discoverTrips, joinTrip } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const SKILL_LABELS = { 1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro/Freeride' };
const PRIVACY_META = {
  public:       { label: 'Public',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'friends-only': { label: 'Friends Only', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  private:      { label: 'Private',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
};
const DIFF_COLORS = { 1: '#22c55e', 2: '#38d9c0', 3: '#4f8ef7', 4: '#f59e0b', 5: '#ef4444' };

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function DiscoverTripsPage() {
  const user = getStoredUser();

  const [trips,         setTrips]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [filters,       setFilters]       = useState({ sportType: '', skillLevel: '' });
  const [actionLoading, setActionLoading] = useState({});
  const [actionErrors,  setActionErrors]  = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = {};
      if (filters.sportType)  activeFilters.sportType  = filters.sportType;
      if (filters.skillLevel) activeFilters.skillLevel = filters.skillLevel;
      const data = await discoverTrips(activeFilters);
      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.sportType, filters.skillLevel]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (tripId) => {
    setActionLoading(a => ({ ...a, [tripId]: true }));
    setActionErrors(e => ({ ...e, [tripId]: null }));
    try {
      await joinTrip(tripId);
      // Update local state: flip to pending
      setTrips(prev => prev.map(t =>
        t.tripId === tripId ? { ...t, membershipStatus: 'pending' } : t
      ));
    } catch (err) {
      setActionErrors(e => ({ ...e, [tripId]: err.message }));
    } finally {
      setActionLoading(a => ({ ...a, [tripId]: false }));
    }
  };

  const joinButton = (trip) => {
    if (trip.membershipStatus === 'approved') {
      return <span style={styles.statusJoined}>Joined</span>;
    }
    if (trip.membershipStatus === 'pending') {
      return <span style={styles.statusPending}>Pending approval</span>;
    }
    if (trip.membershipStatus === 'rejected') {
      return <span style={styles.statusRejected}>Request declined</span>;
    }
    const isFull = trip.maxMembers != null && trip.memberCount >= trip.maxMembers;
    if (isFull) {
      return <span style={styles.statusFull}>Full</span>;
    }
    return (
      <button
        style={styles.joinBtn}
        disabled={actionLoading[trip.tripId]}
        onClick={() => handleJoin(trip.tripId)}
      >
        {actionLoading[trip.tripId] ? '...' : 'Join Trip'}
      </button>
    );
  };

  return (
    <div className="page-content">

      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1>Discover Trips</h1>
          <p>Browse public and friends-only trips you can join</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <select
          style={styles.select}
          value={filters.sportType}
          onChange={e => setFilters(f => ({ ...f, sportType: e.target.value }))}
        >
          <option value="">All sports</option>
          <option value="ski">Ski</option>
          <option value="snowboard">Snowboard</option>
        </select>
        <select
          style={styles.select}
          value={filters.skillLevel}
          onChange={e => setFilters(f => ({ ...f, skillLevel: e.target.value }))}
        >
          <option value="">All levels</option>
          {[1,2,3,4,5].map(l => (
            <option key={l} value={l}>Level {l} — {SKILL_LABELS[l]}</option>
          ))}
        </select>
        <button style={styles.clearBtn} onClick={() => setFilters({ sportType: '', skillLevel: '' })}>
          Clear
        </button>
      </div>

      {loading && <LoadingSpinner message="Discovering trips…" />}
      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {!loading && !error && trips.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🏔️</span>
          <h3>No trips to discover right now</h3>
          <p>Public trips and friends-only trips will appear here. Add more friends or wait for others to plan trips!</p>
          <Link to="/plan-trip" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Plan Your Own Trip
          </Link>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <>
          <div style={styles.tripCount}>
            {trips.length} trip{trips.length !== 1 ? 's' : ''} available
          </div>
          <div className="grid-3">
            {trips.map(trip => {
              const pm = PRIVACY_META[trip.privacy] || PRIVACY_META.public;
              const dc = DIFF_COLORS[trip.resort?.difficultyLevel] ?? '#4f8ef7';
              const nights = Math.round(
                (new Date(trip.endDate) - new Date(trip.startDate)) / 86400000
              );
              return (
                <div key={trip.tripId} className="card" style={styles.card}>
                  {/* Privacy badge */}
                  <div style={styles.cardTop}>
                    <span style={{ ...styles.privacyBadge, color: pm.color, background: pm.bg }}>
                      {pm.label}
                    </span>
                    {trip.resort && (
                      <span style={{ ...styles.diffBadge, color: dc }}>
                        Lvl {trip.resort.difficultyLevel}
                      </span>
                    )}
                  </div>

                  {/* Resort & dates */}
                  <div style={styles.cardResort}>
                    {trip.resort?.name ?? 'Unknown Resort'}
                  </div>
                  <div style={styles.cardCountry}>
                    {trip.resort?.country}
                  </div>
                  <div style={styles.cardDates}>
                    {fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}
                    <span style={styles.nightsBadge}>{nights} nights</span>
                  </div>

                  {/* Trip tags */}
                  <div style={styles.cardTags}>
                    {trip.sportType && (
                      <span style={styles.tag}>{trip.sportType}</span>
                    )}
                    {trip.skillLevel && (
                      <span style={styles.tag}>Level {trip.skillLevel}</span>
                    )}
                    {trip.maxMembers != null && (
                      <span style={styles.tag}>
                        {trip.memberCount}/{trip.maxMembers} members
                      </span>
                    )}
                  </div>

                  {/* Creator */}
                  <div style={styles.cardCreator}>
                    by {trip.creator?.firstName} {trip.creator?.lastName}
                  </div>

                  {/* Action error */}
                  {actionErrors[trip.tripId] && (
                    <div style={styles.cardErr}>{actionErrors[trip.tripId]}</div>
                  )}

                  {/* Footer: view details + join */}
                  <div style={styles.cardFooter}>
                    <Link to={`/trips/${trip.tripId}`} style={styles.detailsLink}>
                      View Details
                    </Link>
                    {joinButton(trip)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  pageHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '1rem',
    flexWrap: 'wrap', marginBottom: '1.5rem',
  },
  filterBar: {
    display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
    marginBottom: '1.5rem', alignItems: 'center',
  },
  select: {
    padding: '0.5rem 0.9rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '0.5rem 0.9rem',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  tripCount: {
    fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem',
  },
  card: {
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    padding: '1.25rem',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  privacyBadge: {
    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.65rem',
    borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  diffBadge: {
    fontSize: '0.72rem', fontWeight: 700, marginLeft: 'auto',
  },
  cardResort: {
    fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
  },
  cardCountry: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  cardDates: {
    fontSize: '0.82rem', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
    marginTop: '0.25rem',
  },
  nightsBadge: {
    fontSize: '0.72rem', color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
  },
  cardTags: {
    display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem',
  },
  tag: {
    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(79,142,247,0.1)', color: 'var(--accent-light)',
    textTransform: 'capitalize',
  },
  cardCreator: {
    fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem',
  },
  cardErr: {
    fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.25rem',
  },
  cardFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '0.75rem', paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  detailsLink: {
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-light)',
    textDecoration: 'none',
  },
  joinBtn: {
    padding: '0.4rem 1rem',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#fff', fontSize: '0.82rem', fontWeight: 700,
    cursor: 'pointer',
  },
  statusPending: {
    fontSize: '0.78rem', fontWeight: 600, color: '#fcd34d',
  },
  statusJoined: {
    fontSize: '0.78rem', fontWeight: 600, color: '#34d399',
  },
  statusRejected: {
    fontSize: '0.78rem', fontWeight: 600, color: '#6b7280',
  },
  statusFull: {
    fontSize: '0.78rem', fontWeight: 600, color: '#f87171',
  },
};
