import React, { useState, useEffect, useCallback } from 'react';
import {
  getStoredUser,
  getFriends,
  getReceivedRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} from '../services/api';
import { getSocket, connectSocket } from '../services/socket';

const SKILL_LABELS = { 1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro/Freeride' };

export default function FriendsPage() {
  const user = getStoredUser();

  const [tab,              setTab]              = useState('friends');
  const [friends,          setFriends]          = useState([]);
  const [received,         setReceived]         = useState([]);
  const [sent,             setSent]             = useState([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [searchResults,    setSearchResults]    = useState([]);
  const [searching,        setSearching]        = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [onlineIds,        setOnlineIds]        = useState(new Set());
  const [actionLoading,    setActionLoading]    = useState({});

  const loadSocial = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [f, r, s] = await Promise.all([
        getFriends(user.userId),
        getReceivedRequests(user.userId),
        getSentRequests(user.userId)
      ]);
      setFriends(f);
      setReceived(r);
      setSent(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { loadSocial(); }, [loadSocial]);

  // ── Socket: online status (Step 7) ──────────────────────────────────────────
  useEffect(() => {
    let socket = getSocket();
    if (!socket) socket = connectSocket();
    if (!socket) return;

    // Request current online friends
    socket.emit('friends:online', ({ onlineFriendIds }) => {
      setOnlineIds(new Set(onlineFriendIds));
    });

    const onOnline  = ({ userId }) => setOnlineIds(s => new Set([...s, userId]));
    const onOffline = ({ userId }) => setOnlineIds(s => { const n = new Set(s); n.delete(userId); return n; });
    const onRequest = () => loadSocial(); // refresh pending count when a request arrives

    socket.on('user:online',    onOnline);
    socket.on('user:offline',   onOffline);
    socket.on('friend:request', onRequest);

    return () => {
      socket.off('user:online',    onOnline);
      socket.off('user:offline',   onOffline);
      socket.off('friend:request', onRequest);
    };
  }, [loadSocial]);

  const withAction = async (key, fn) => {
    setActionLoading(a => ({ ...a, [key]: true }));
    try {
      await fn();
      await loadSocial();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(a => ({ ...a, [key]: false }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // Build lookup sets for fast status checking
  const friendSet       = new Set(friends.map(f => f.userId));
  const sentSet         = new Map(sent.map(r => [r.receiverId, r.requestId]));
  const receivedSet     = new Map(received.map(r => [r.senderId, r.requestId]));
  const friendshipIdMap = new Map(friends.map(f => [f.userId, f.friendshipId]));

  const getStatusButton = (targetUserId) => {
    if (friendSet.has(targetUserId)) {
      return (
        <button
          style={{ ...styles.btn, ...styles.btnDanger }}
          disabled={actionLoading[`unfriend-${targetUserId}`]}
          onClick={() => withAction(`unfriend-${targetUserId}`, () =>
            removeFriend(friendshipIdMap.get(targetUserId))
          )}
        >
          Unfriend
        </button>
      );
    }
    if (sentSet.has(targetUserId)) {
      return <span style={styles.statusPending}>Pending</span>;
    }
    if (receivedSet.has(targetUserId)) {
      const reqId = receivedSet.get(targetUserId);
      return (
        <div style={styles.btnRow}>
          <button
            style={{ ...styles.btn, ...styles.btnAccept }}
            disabled={actionLoading[`accept-${reqId}`]}
            onClick={() => withAction(`accept-${reqId}`, () => acceptFriendRequest(reqId))}
          >Accept</button>
          <button
            style={{ ...styles.btn, ...styles.btnReject }}
            disabled={actionLoading[`reject-${reqId}`]}
            onClick={() => withAction(`reject-${reqId}`, () => rejectFriendRequest(reqId))}
          >Reject</button>
        </div>
      );
    }
    return (
      <button
        style={{ ...styles.btn, ...styles.btnPrimary }}
        disabled={actionLoading[`add-${targetUserId}`]}
        onClick={() => withAction(`add-${targetUserId}`, async () => {
          await sendFriendRequest(targetUserId);
        })}
      >
        + Add Friend
      </button>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.heading}>Friends</h1>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'friends',  label: 'My Friends',  count: friends.length },
            { id: 'find',     label: 'Find People',  count: null },
            { id: 'requests', label: 'Requests',     count: received.length || null }
          ].map(({ id, label, count }) => (
            <button
              key={id}
              style={{ ...styles.tab, ...(tab === id ? styles.tabActive : {}) }}
              onClick={() => { setTab(id); setError(null); }}
            >
              {label}
              {count != null && count > 0 && (
                <span style={styles.badge}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        {/* ── My Friends tab ── */}
        {tab === 'friends' && (
          loading ? <p style={styles.hint}>Loading...</p> :
          friends.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🏔️</div>
              <p>No friends yet. Go find some riders!</p>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setTab('find')}>
                Find People
              </button>
            </div>
          ) : (
            <div style={styles.grid}>
              {friends.map(f => (
                <div key={f.friendshipId} style={styles.card}>
                  <div style={styles.avatarWrap}>
                    <div style={styles.avatar}>{f.firstName[0].toUpperCase()}</div>
                    {onlineIds.has(f.userId) && <span style={styles.onlineDot} title="Online" />}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName}>{f.firstName} {f.lastName}</div>
                    <div style={styles.cardMeta}>{f.sportType} · Level {f.skillLevel} — {SKILL_LABELS[f.skillLevel]}</div>
                    <div style={styles.cardEmail}>{f.email}</div>
                    <div style={onlineIds.has(f.userId) ? styles.onlineLabel : styles.offlineLabel}>
                      {onlineIds.has(f.userId) ? '● Online' : '○ Offline'}
                    </div>
                  </div>
                  <button
                    style={{ ...styles.btn, ...styles.btnDanger, marginLeft: 'auto', flexShrink: 0 }}
                    disabled={actionLoading[`unfriend-${f.userId}`]}
                    onClick={() => withAction(`unfriend-${f.userId}`, () => removeFriend(f.friendshipId))}
                  >
                    Unfriend
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Find People tab ── */}
        {tab === 'find' && (
          <div>
            <form onSubmit={handleSearch} style={styles.searchForm}>
              <input
                style={styles.searchInput}
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button style={{ ...styles.btn, ...styles.btnPrimary }} type="submit" disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResults.length === 0 && !searching && searchQuery && (
              <p style={styles.hint}>No users found for "{searchQuery}".</p>
            )}

            {searchResults.length > 0 && (
              <div style={styles.grid}>
                {searchResults.map(u => (
                  <div key={u.userId} style={styles.card}>
                    <div style={styles.avatarWrap}>
                      <div style={styles.avatar}>{u.firstName[0].toUpperCase()}</div>
                      {onlineIds.has(u.userId) && <span style={styles.onlineDot} title="Online" />}
                    </div>
                    <div style={styles.cardInfo}>
                      <div style={styles.cardName}>{u.firstName} {u.lastName}</div>
                      <div style={styles.cardMeta}>{u.sportType} · Level {u.skillLevel} — {SKILL_LABELS[u.skillLevel]}</div>
                      <div style={styles.cardEmail}>{u.email}</div>
                      <div style={onlineIds.has(u.userId) ? styles.onlineLabel : styles.offlineLabel}>
                        {onlineIds.has(u.userId) ? '● Online' : '○ Offline'}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {getStatusButton(u.userId)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Requests tab ── */}
        {tab === 'requests' && (
          loading ? <p style={styles.hint}>Loading...</p> : (
            <div>
              {/* Incoming */}
              <h2 style={styles.subheading}>Incoming Requests</h2>
              {received.length === 0 ? (
                <p style={styles.hint}>No pending requests.</p>
              ) : (
                <div style={styles.grid}>
                  {received.map(r => (
                    <div key={r.requestId} style={styles.card}>
                      <div style={styles.avatar}>{r.sender.firstName[0].toUpperCase()}</div>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardName}>{r.sender.firstName} {r.sender.lastName}</div>
                        <div style={styles.cardMeta}>{r.sender.sportType} · Level {r.sender.skillLevel} — {SKILL_LABELS[r.sender.skillLevel]}</div>
                        <div style={styles.cardEmail}>{r.sender.email}</div>
                      </div>
                      <div style={{ ...styles.btnRow, marginLeft: 'auto', flexShrink: 0 }}>
                        <button
                          style={{ ...styles.btn, ...styles.btnAccept }}
                          disabled={actionLoading[`accept-${r.requestId}`]}
                          onClick={() => withAction(`accept-${r.requestId}`, () => acceptFriendRequest(r.requestId))}
                        >Accept</button>
                        <button
                          style={{ ...styles.btn, ...styles.btnReject }}
                          disabled={actionLoading[`reject-${r.requestId}`]}
                          onClick={() => withAction(`reject-${r.requestId}`, () => rejectFriendRequest(r.requestId))}
                        >Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent */}
              <h2 style={{ ...styles.subheading, marginTop: '2rem' }}>Sent Requests</h2>
              {sent.length === 0 ? (
                <p style={styles.hint}>No pending sent requests.</p>
              ) : (
                <div style={styles.grid}>
                  {sent.map(r => (
                    <div key={r.requestId} style={styles.card}>
                      <div style={styles.avatar}>{r.receiver.firstName[0].toUpperCase()}</div>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardName}>{r.receiver.firstName} {r.receiver.lastName}</div>
                        <div style={styles.cardMeta}>{r.receiver.sportType} · Level {r.receiver.skillLevel} — {SKILL_LABELS[r.receiver.skillLevel]}</div>
                        <div style={styles.cardEmail}>{r.receiver.email}</div>
                      </div>
                      <span style={{ ...styles.statusPending, marginLeft: 'auto' }}>Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    padding: '2rem 1rem 4rem',
    background: 'var(--bg-base)',
  },
  container: {
    maxWidth: 800,
    margin: '0 auto',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.9rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '1.5rem',
  },
  subheading: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '0.5rem',
  },
  tab: {
    padding: '0.5rem 1.1rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'rgba(79,142,247,0.12)',
    color: 'var(--accent-light)',
    fontWeight: 700,
  },
  badge: {
    background: '#ef4444',
    color: '#fff',
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '1px 6px',
    minWidth: 18,
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--grad-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid var(--bg-card)',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  cardName: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  cardMeta: {
    fontSize: '0.8rem',
    color: 'var(--accent-light)',
    textTransform: 'capitalize',
  },
  cardEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  onlineLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#22c55e',
  },
  offlineLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  searchForm: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.6rem 1rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '0.5rem 0',
  },
  errorBanner: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  btnRow: {
    display: 'flex',
    gap: '0.4rem',
  },
  btn: {
    padding: '0.4rem 0.9rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: '#fff',
  },
  btnAccept: {
    background: 'rgba(52,211,153,0.15)',
    color: '#6ee7b7',
    border: '1px solid rgba(52,211,153,0.25)',
  },
  btnReject: {
    background: 'rgba(239,68,68,0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  btnDanger: {
    background: 'rgba(239,68,68,0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  statusPending: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    padding: '0.35rem 0.8rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-md)',
    whiteSpace: 'nowrap',
  },
};
