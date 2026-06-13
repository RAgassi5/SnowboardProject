import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getUserTrips, getResorts, getStoredUser, deleteTrip,
  getUserInvitations, approveTripMember, removeTripMember, getUnreadCounts,
} from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import TripCard from '../components/TripCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function TripsPage() {
  const user = getStoredUser();

  const [trips,        setTrips]        = useState([]);
  const [resorts,      setResorts]      = useState([]);
  const [invitations,  setInvitations]  = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!user?.userId) { setError('No user session found.'); setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [tripsData, resortsData, invitationsData, unreadData] = await Promise.all([
          getUserTrips(user.userId),
          getResorts(),
          getUserInvitations(user.userId),
          getUnreadCounts(user.userId),
        ]);
        if (!cancelled) {
          setTrips(tripsData);
          setResorts(resortsData);
          setInvitations(invitationsData ?? []);
          setUnreadCounts(unreadData ?? {});
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

  // Listen for real-time unread count updates from socket
  useEffect(() => {
    if (!user?.userId) return;
    let socket = getSocket();
    if (!socket) socket = connectSocket();
    if (!socket) return;

    const onUnreadUpdate = ({ tripId, count }) => {
      setUnreadCounts(prev => ({ ...prev, [tripId]: count }));
    };

    socket.on('chat:unread-update', onUnreadUpdate);
    return () => socket.off('chat:unread-update', onUnreadUpdate);
  }, [user?.userId]);

  // Accept or decline a trip invitation
  const handleAcceptInvitation = async (memberId) => {
    try {
      await approveTripMember(memberId);
      setInvitations(prev => prev.filter(i => i.memberId !== memberId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeclineInvitation = async (memberId) => {
    try {
      await removeTripMember(memberId);
      setInvitations(prev => prev.filter(i => i.memberId !== memberId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a trip and remove from local state
  const handleDeleteTrip = async (tripId) => {
    await deleteTrip(tripId);
    setTrips(prev => prev.filter(t => t.tripId !== tripId));
  };

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

      {/* Pending trip invitations */}
      {!loading && !error && invitations.length > 0 && (
        <div style={styles.invitationsSection}>
          <h2 style={styles.invitationsTitle}>📨 Trip Invitations</h2>
          <div className="grid-3">
            {invitations.map(inv => (
              <div key={inv.memberId} className="card" style={styles.invitationCard}>
                <div style={styles.invitationResort}>
                  {inv.resort?.name ?? `Resort #${inv.resortId}`}
                </div>
                <div style={styles.invitationDates}>
                  📅 {new Date(inv.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' → '}
                  {new Date(inv.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {inv.creator && (
                  <div style={styles.invitationCreator}>
                    Invited by {inv.creator.firstName} {inv.creator.lastName}
                  </div>
                )}
                <div style={styles.invitationActions}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.82rem' }}
                    onClick={() => handleAcceptInvitation(inv.memberId)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.82rem' }}
                    onClick={() => handleDeclineInvitation(inv.memberId)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <TripCard key={trip.tripId} trip={trip} resort={resort}
                onDelete={handleDeleteTrip}
                unreadCount={unreadCounts[trip.tripId] ?? 0} />
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
  invitationsSection: {
    marginBottom: '2.5rem',
  },
  invitationsTitle: {
    fontSize: '1.1rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '0.75rem',
  },
  invitationCard: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    gap: '0.55rem', paddingTop: '1rem',
  },
  invitationResort: {
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  invitationDates: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
  },
  invitationCreator: {
    fontSize: '0.8rem', color: 'var(--text-secondary)',
  },
  invitationActions: {
    display: 'flex', gap: '0.5rem', marginTop: 'auto',
  },
};

export default TripsPage;
