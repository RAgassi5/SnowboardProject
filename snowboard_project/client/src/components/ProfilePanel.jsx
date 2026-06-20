import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStoredUser,
  getFriends, getReceivedRequests, getSentRequests,
  searchUsers, sendFriendRequest,
  acceptFriendRequest, rejectFriendRequest, removeFriend,
} from '../services/api';
import { getSocket } from '../services/socket';

const ROLE_COLOR  = { admin: '#f59e0b', manager: '#38d9c0', user: '#4f8ef7' };
const SKILL_LABEL = { 1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro/Freeride' };

export default function ProfilePanel({ open, onClose }) {
  const user      = getStoredUser();
  const navigate  = useNavigate();
  const roleColor = ROLE_COLOR[user?.userRole] ?? '#4f8ef7';
  const initials  = (user?.firstName?.[0] ?? '?').toUpperCase();
  const memberSince = user?.createDate
    ? new Date(user.createDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '—';

  const [activeTab,     setActiveTab]     = useState('friends');
  const [friends,       setFriends]       = useState([]);
  const [received,      setReceived]      = useState([]);
  const [sent,          setSent]          = useState([]);
  const [onlineIds,     setOnlineIds]     = useState(new Set());
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const busy = (key, v) => setActionLoading(p => ({ ...p, [key]: v }));

  const loadSocial = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const [f, r, s] = await Promise.all([
        getFriends(user.userId),
        getReceivedRequests(user.userId),
        getSentRequests(user.userId),
      ]);
      setFriends(f ?? []);
      setReceived(r ?? []);
      setSent(s ?? []);
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  // Load data + wire socket when panel opens
  useEffect(() => {
    if (!open || !user?.userId) return;
    setActiveTab('friends');
    setSearchQuery('');
    setSearchResults([]);
    loadSocial();

    const sock = getSocket();
    if (!sock) return;

    sock.emit('friends:online', ({ onlineFriendIds } = {}) => {
      setOnlineIds(new Set(onlineFriendIds ?? []));
    });

    const onOnline     = ({ userId }) => setOnlineIds(p => new Set([...p, userId]));
    const onOffline    = ({ userId }) => setOnlineIds(p => { const s = new Set(p); s.delete(userId); return s; });
    const onFriendReq  = () => loadSocial();

    sock.on('user:online',    onOnline);
    sock.on('user:offline',   onOffline);
    sock.on('friend:request', onFriendReq);

    return () => {
      sock.off('user:online',    onOnline);
      sock.off('user:offline',   onOffline);
      sock.off('friend:request', onFriendReq);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Friend actions ────────────────────────────────────────────────────────────

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchUsers(searchQuery.trim());
      setSearchResults(res ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAdd = async (receiverId) => {
    busy(`add-${receiverId}`, true);
    try { await sendFriendRequest(receiverId); await loadSocial(); } catch { /* no-op */ }
    finally { busy(`add-${receiverId}`, false); }
  };

  const handleAccept = async (requestId) => {
    busy(`accept-${requestId}`, true);
    try { await acceptFriendRequest(requestId); await loadSocial(); } catch { /* no-op */ }
    finally { busy(`accept-${requestId}`, false); }
  };

  const handleReject = async (requestId) => {
    busy(`reject-${requestId}`, true);
    try { await rejectFriendRequest(requestId); await loadSocial(); } catch { /* no-op */ }
    finally { busy(`reject-${requestId}`, false); }
  };

  const handleUnfriend = async (friendshipId, userId) => {
    busy(`unfriend-${userId}`, true);
    try { await removeFriend(friendshipId); await loadSocial(); } catch { /* no-op */ }
    finally { busy(`unfriend-${userId}`, false); }
  };

  const handleSettings = () => { navigate('/settings'); onClose(); };
  const handleLogout   = () => { localStorage.removeItem('snowtrip_user'); navigate('/login', { replace: true }); };

  // Classify relationship for a given userId (used in search results)
  const getRelationship = (uid) => {
    const fr   = friends.find(f => f.userId === uid);
    if (fr) return { type: 'friend', friendshipId: fr.friendshipId };
    const recv = received.find(r => r.sender?.userId === uid);
    if (recv) return { type: 'received', requestId: recv.requestId };
    const snt  = sent.find(s => s.receiver?.userId === uid);
    if (snt) return { type: 'sent', requestId: snt.requestId };
    return { type: 'none' };
  };

  // ── Reusable user card ────────────────────────────────────────────────────────

  const UserCard = ({ u, action }) => {
    const isOnline = onlineIds.has(u.userId);
    const sport    = u.sportType === 'snowboard' ? '🏂' : u.sportType === 'ski' ? '⛷️' : '';
    return (
      <div style={styles.userCard}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ ...styles.cardAvatar, background: ROLE_COLOR[u.userRole] ?? '#4f8ef7' }}>
            {(u.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <span style={{ ...styles.onlineDot, background: isOnline ? '#22c55e' : 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={styles.cardBody}>
          <div style={styles.cardName}>{u.firstName} {u.lastName}</div>
          <div style={styles.cardMeta}>{sport} {u.sportType} · Level {u.skillLevel}</div>
          {u.email && <div style={styles.cardEmail}>{u.email}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ ...styles.backdrop, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        style={{ ...styles.panel, transform: open ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Profile panel"
      >
        {/* ── Panel header ──────────────────────────────────────────────────── */}
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>Your Profile</span>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close panel">✕</button>
        </div>

        {/* ── Profile section ───────────────────────────────────────────────── */}
        <div style={styles.profileSection}>
          <div style={styles.profileTop}>
            <div style={{ ...styles.bigAvatar, background: roleColor }}>{initials}</div>
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>{user.firstName} {user.lastName}</div>
              <div style={styles.profileEmail}>{user.email}</div>
              <span style={{ ...styles.roleBadge, color: roleColor, borderColor: `${roleColor}40`, background: `${roleColor}14` }}>
                {user.userRole}
              </span>
            </div>
          </div>
          <div style={styles.profileGrid}>
            <div style={styles.profileGridItem}>
              <span style={styles.gridLabel}>Sport</span>
              <span style={styles.gridValue}>
                {user.sportType === 'snowboard' ? '🏂 Snowboard' : user.sportType === 'ski' ? '⛷️ Ski' : '—'}
              </span>
            </div>
            <div style={styles.profileGridItem}>
              <span style={styles.gridLabel}>Skill</span>
              <span style={styles.gridValue}>Lvl {user.skillLevel} — {SKILL_LABEL[user.skillLevel] ?? '—'}</span>
            </div>
            <div style={styles.profileGridItem}>
              <span style={styles.gridLabel}>User ID</span>
              <span style={styles.gridValue}>#{user.userId}</span>
            </div>
            <div style={styles.profileGridItem}>
              <span style={styles.gridLabel}>Member since</span>
              <span style={styles.gridValue}>{memberSince}</span>
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* ── Social section ─────────────────────────────────────────────────── */}
        <div style={styles.sectionLabel}>Social</div>

        {/* Tab bar */}
        <div style={styles.tabBar}>
          {[
            { key: 'friends',  label: 'My Friends' },
            { key: 'requests', label: received.length > 0 ? `Requests (${received.length})` : 'Requests' },
            { key: 'search',   label: 'Find People' },
          ].map(tab => (
            <button
              key={tab.key}
              style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={styles.tabContent}>
          {loading && <div style={styles.hint}>Loading…</div>}

          {!loading && activeTab === 'friends' && (
            friends.length === 0
              ? <div style={styles.emptyState}><span style={{ fontSize: '2rem' }}>👥</span><div>No friends yet.</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Use "Find People" to search for riders.</div></div>
              : friends.map(f => (
                <UserCard key={f.userId} u={f}
                  action={
                    <button style={styles.dangerBtn}
                      onClick={() => handleUnfriend(f.friendshipId, f.userId)}
                      disabled={actionLoading[`unfriend-${f.userId}`]}>
                      {actionLoading[`unfriend-${f.userId}`] ? '…' : 'Unfriend'}
                    </button>
                  }
                />
              ))
          )}

          {!loading && activeTab === 'requests' && (
            <>
              <div style={styles.subsectionLabel}>Received</div>
              {received.length === 0
                ? <div style={styles.hint}>No incoming requests.</div>
                : received.map(r => (
                  <UserCard key={r.requestId} u={r.sender}
                    action={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <button style={styles.primaryBtn}
                          onClick={() => handleAccept(r.requestId)}
                          disabled={actionLoading[`accept-${r.requestId}`]}>
                          {actionLoading[`accept-${r.requestId}`] ? '…' : 'Accept'}
                        </button>
                        <button style={styles.ghostBtn}
                          onClick={() => handleReject(r.requestId)}
                          disabled={actionLoading[`reject-${r.requestId}`]}>
                          {actionLoading[`reject-${r.requestId}`] ? '…' : 'Decline'}
                        </button>
                      </div>
                    }
                  />
                ))
              }

              <div style={{ ...styles.subsectionLabel, marginTop: '1.25rem' }}>Sent</div>
              {sent.length === 0
                ? <div style={styles.hint}>No pending requests sent.</div>
                : sent.map(s => (
                  <UserCard key={s.requestId} u={s.receiver}
                    action={<span style={styles.pendingBadge}>Pending</span>}
                  />
                ))
              }
            </>
          )}

          {!loading && activeTab === 'search' && (
            <>
              <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                  style={styles.searchInput}
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" style={styles.primaryBtn} disabled={searching || !searchQuery.trim()}>
                  {searching ? '…' : '🔍'}
                </button>
              </form>

              {searchResults.filter(u => u.userId !== user.userId).map(u => {
                const rel = getRelationship(u.userId);
                let action;
                if (rel.type === 'friend') {
                  action = (
                    <button style={styles.dangerBtn}
                      onClick={() => handleUnfriend(rel.friendshipId, u.userId)}
                      disabled={actionLoading[`unfriend-${u.userId}`]}>
                      {actionLoading[`unfriend-${u.userId}`] ? '…' : 'Unfriend'}
                    </button>
                  );
                } else if (rel.type === 'received') {
                  action = (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <button style={styles.primaryBtn}
                        onClick={() => handleAccept(rel.requestId)}
                        disabled={actionLoading[`accept-${rel.requestId}`]}>
                        {actionLoading[`accept-${rel.requestId}`] ? '…' : 'Accept'}
                      </button>
                      <button style={styles.ghostBtn}
                        onClick={() => handleReject(rel.requestId)}
                        disabled={actionLoading[`reject-${rel.requestId}`]}>
                        {actionLoading[`reject-${rel.requestId}`] ? '…' : 'Decline'}
                      </button>
                    </div>
                  );
                } else if (rel.type === 'sent') {
                  action = <span style={styles.pendingBadge}>Pending</span>;
                } else {
                  action = (
                    <button style={styles.primaryBtn}
                      onClick={() => handleAdd(u.userId)}
                      disabled={actionLoading[`add-${u.userId}`]}>
                      {actionLoading[`add-${u.userId}`] ? '…' : '+ Add'}
                    </button>
                  );
                }
                return <UserCard key={u.userId} u={u} action={action} />;
              })}

              {searchResults.length > 0 && searchResults.filter(u => u.userId !== user.userId).length === 0 && (
                <div style={styles.hint}>No other users matched "{searchQuery}".</div>
              )}
            </>
          )}
        </div>

        <div style={styles.divider} />

        {/* ── Bottom actions ─────────────────────────────────────────────────── */}
        <div style={styles.actions}>
          <button style={styles.actionRow} onClick={handleSettings}>
            <span>⚙️</span>
            <span style={{ flex: 1 }}>Settings</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
          </button>
          <button style={{ ...styles.actionRow, ...styles.actionDanger }} onClick={handleLogout}>
            <span>↩</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 799,
    transition: 'opacity 0.25s ease',
  },
  panel: {
    position: 'fixed',
    top: 0, right: 0,
    width: 380,
    height: '100vh',
    zIndex: 800,
    background: 'var(--bg-card)',
    borderLeft: '1px solid var(--border-card)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
    transition: 'transform 0.25s ease',
    overflow: 'hidden',
  },

  panelHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0.2rem 0.55rem',
    lineHeight: 1,
  },

  profileSection: {
    padding: '1rem 1.25rem',
    flexShrink: 0,
  },
  profileTop: {
    display: 'flex', alignItems: 'center',
    gap: '0.9rem', marginBottom: '0.85rem',
  },
  bigAvatar: {
    width: 52, height: 52,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', fontWeight: 800,
    color: '#0a0f1e', flexShrink: 0,
  },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  profileName: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },
  profileEmail: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  roleBadge: {
    display: 'inline-block',
    fontSize: '0.65rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '0.12rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    alignSelf: 'flex-start',
  },
  profileGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  profileGridItem: {
    display: 'flex', flexDirection: 'column', gap: '0.1rem',
    padding: '0.45rem 0.6rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
  },
  gridLabel: { fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  gridValue: { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 },

  divider: { height: 1, background: 'var(--border-subtle)', flexShrink: 0 },
  sectionLabel: {
    padding: '0.6rem 1.25rem 0.3rem',
    fontSize: '0.68rem', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
    flexShrink: 0,
  },

  tabBar: {
    display: 'flex', gap: '0.3rem',
    padding: '0.4rem 1rem',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '0.4rem 0.3rem',
    fontSize: '0.73rem', fontWeight: 600,
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'rgba(56,217,192,0.1)',
    border: '1px solid rgba(56,217,192,0.3)',
    color: '#38d9c0',
  },

  tabContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem 1rem',
  },

  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem', gap: '0.35rem',
  },
  hint: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    textAlign: 'center', padding: '0.75rem 0', fontStyle: 'italic',
  },
  subsectionLabel: {
    fontSize: '0.68rem', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '0.5rem', marginTop: '0.25rem',
  },

  userCard: {
    display: 'flex', alignItems: 'center',
    gap: '0.65rem',
    padding: '0.65rem 0.5rem',
    borderBottom: '1px solid var(--border-subtle)',
  },
  cardAvatar: {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: 700, color: '#0a0f1e',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid var(--bg-card)',
  },
  cardBody: { flex: 1, overflow: 'hidden' },
  cardName: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardMeta: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' },
  cardEmail: { fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  searchForm: { display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' },
  searchInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    padding: '0.45rem 0.7rem',
    outline: 'none',
  },

  primaryBtn: {
    padding: '0.3rem 0.65rem',
    background: 'rgba(79,142,247,0.12)',
    border: '1px solid rgba(79,142,247,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-light)',
    fontSize: '0.73rem', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  dangerBtn: {
    padding: '0.3rem 0.65rem',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-sm)',
    color: '#fca5a5',
    fontSize: '0.73rem', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  ghostBtn: {
    padding: '0.3rem 0.65rem',
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: '0.73rem', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  pendingBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.55rem',
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 'var(--radius-sm)',
    color: '#fbbf24',
    fontSize: '0.7rem', fontWeight: 600,
    whiteSpace: 'nowrap',
  },

  actions: { flexShrink: 0, padding: '0.5rem 0.75rem 1rem' },
  actionRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 0.75rem',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem', fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease',
    marginBottom: '0.1rem',
  },
  actionDanger: { color: '#fca5a5' },
};
