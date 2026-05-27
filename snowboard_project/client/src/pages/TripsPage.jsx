import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserTrips, getResorts, getStoredUser } from '../services/api';
import TripCard from '../components/TripCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function TripsPage() {
  const user = getStoredUser();

  const [trips,   setTrips]   = useState([]);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user?.userId) { setError('No user session found.'); setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [tripsData, resortsData] = await Promise.all([
          getUserTrips(user.userId),
          getResorts(),
        ]);
        if (!cancelled) {
          setTrips(tripsData);
          setResorts(resortsData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.userId]);

  // Enrich trips with resort data
  const enrichedTrips = trips.map(trip => ({
    ...trip,
    resort: resorts.find(r => r.resortId === trip.resortId) ?? null,
  }));

  return (
    <div className="page-content">
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1>My Trips</h1>
          <p>All your planned ski &amp; snowboard adventures</p>
        </div>
        <Link to="/plan-trip" id="plan-new-trip-btn" className="btn btn-primary" style={{ flexShrink: 0 }}>
          ＋ Plan a New Trip
        </Link>
      </div>

      {/* States */}
      {loading && <LoadingSpinner message="Loading your trips…" />}
      {!loading && error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {/* Empty */}
      {!loading && !error && trips.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🏔️</span>
          <h3>You have no planned trips yet</h3>
          <p>Plan your first ski or snowboard trip and it will appear here.</p>
          <Link to="/plan-trip" className="btn btn-primary" style={{ marginTop: '1rem' }}
            id="empty-plan-trip-link">
            🏔️ Plan Your First Trip
          </Link>
        </div>
      )}

      {/* Trip cards grid — TripCard used for every trip (≥3 reuse) */}
      {!loading && !error && enrichedTrips.length > 0 && (
        <>
          <div style={styles.tripCount}>
            {enrichedTrips.length} trip{enrichedTrips.length !== 1 ? 's' : ''} planned
          </div>
          <div className="grid-3">
            {enrichedTrips.map(({ resort, ...trip }) => (
              <TripCard key={trip.tripId} trip={trip} resort={resort} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  pageHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '1rem',
    flexWrap: 'wrap', marginBottom: '2rem',
  },
  tripCount: {
    fontSize: '0.85rem', color: 'var(--text-muted)',
    marginBottom: '1rem',
  },
};

export default TripsPage;
