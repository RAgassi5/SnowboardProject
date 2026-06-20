import React, { useState, useEffect } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import { getStoredUser, getUnreadCounts } from '../services/api';
import ChatRoom from './ChatRoom';

export default function FloatingChat({ tripId, resortName }) {
  const user = getStoredUser();
  const [open,        setOpen]        = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count on mount
  useEffect(() => {
    if (!user?.userId) return;
    getUnreadCounts(user.userId)
      .then(counts => setUnreadCount(counts?.[tripId] ?? 0))
      .catch(() => {});
  }, [tripId, user?.userId]);

  // Real-time badge updates
  useEffect(() => {
    if (!user?.userId) return;
    let sock = getSocket();
    if (!sock) sock = connectSocket();
    if (!sock) return;

    const onUpdate = ({ tripId: tid, count }) => {
      if (parseInt(tid) === parseInt(tripId)) setUnreadCount(count);
    };
    sock.on('chat:unread-update', onUpdate);
    return () => sock.off('chat:unread-update', onUpdate);
  }, [tripId, user?.userId]);

  const toggle = () => setOpen(o => !o);

  return (
    <div style={styles.container}>
      {/* Popup body — only mounted when open, so ChatRoom's chat:join fires on open */}
      {open && (
        <div style={styles.popup}>
          <div style={styles.chatBody}>
            <ChatRoom tripId={tripId} />
          </div>
        </div>
      )}

      {/* Header bar — always visible, acts as the toggle trigger */}
      <div
        style={{
          ...styles.header,
          borderRadius: open ? 0 : '12px 12px 0 0',
          borderTop: open ? '1px solid rgba(79,142,247,0.2)' : '1px solid var(--border-card)',
        }}
        onClick={toggle}
        role="button"
        aria-expanded={open}
        aria-label={open ? 'Minimize group chat' : 'Open group chat'}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
      >
        <span style={styles.headerIcon}>💬</span>
        <div style={styles.headerText}>
          <span style={styles.headerTitle}>Group Chat</span>
          {resortName && <span style={styles.headerSub}>{resortName}</span>}
        </div>
        {unreadCount > 0 && (
          <span style={styles.badge} aria-label={`${unreadCount} unread messages`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span style={styles.chevron} aria-hidden="true">{open ? '▼' : '▲'}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    right: '1.5rem',
    zIndex: 600,
    width: 320,
    display: 'flex',
    flexDirection: 'column',
  },
  popup: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '12px 12px 0 0',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: 'none',
  },
  chatBody: {
    height: 420,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(79,142,247,0.12)',
    cursor: 'pointer',
    userSelect: 'none',
    borderLeft: '1px solid var(--border-card)',
    borderRight: '1px solid var(--border-card)',
    borderBottom: '1px solid var(--border-card)',
  },
  headerIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  headerSub: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 'var(--radius-full)',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
    flexShrink: 0,
  },
  chevron: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
};
