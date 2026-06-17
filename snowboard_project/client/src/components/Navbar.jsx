import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, getReceivedRequests, getDashboard } from '../services/api';
import { getSocket } from '../services/socket';
import ProfilePanel from './ProfilePanel';

// ── Navigation links (Friends + Settings moved to ProfilePanel) ───────────────
const getNavLinks = (userRole) => {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/plan-trip', label: 'Plan Trip',  icon: '🎯' },
    { to: '/trips',     label: 'My Trips',   icon: '📋' },
    { to: '/discover',  label: 'Discover',   icon: '🔍' },
    { to: '/resorts',   label: 'Resorts',    icon: '⛷️'  },
  ];
  if (userRole === 'admin' || userRole === 'manager') {
    links.push({ to: '/management', label: 'Management', icon: '🛠️' });
  }
  return links;
};

function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user,         setUser]         = useState(null);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [joinRequestCount, setJoinRequestCount] = useState(0);

  // Re-read user on each navigation (handles login state change)
  useEffect(() => {
    setUser(getStoredUser());
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load pending request count + listen for new requests (for avatar badge)
  useEffect(() => {
    const u = getStoredUser();
    if (!u?.userId) return;

    const refreshJoinRequests = () => {
      getDashboard()
        .then(d => {
          const total = (d?.attentionItems ?? [])
            .filter(item => item.type === 'join_request')
            .reduce((sum, item) => sum + (item.count ?? 1), 0);
          setJoinRequestCount(total);
        })
        .catch(() => {});
    };

    getReceivedRequests(u.userId)
      .then(reqs => setRequestCount(reqs?.length ?? 0))
      .catch(() => {});
    refreshJoinRequests();

    const sock = getSocket();
    if (!sock) return;

    const onFriendReq = () => {
      getReceivedRequests(u.userId)
        .then(reqs => setRequestCount(reqs?.length ?? 0))
        .catch(() => {});
    };
    const onJoinReq = () => refreshJoinRequests();

    sock.on('friend:request', onFriendReq);
    sock.on('trip:join-request', onJoinReq);
    return () => {
      sock.off('friend:request', onFriendReq);
      sock.off('trip:join-request', onJoinReq);
    };
  }, [location]); // re-check when user navigates (catches login/logout transitions)

  const handleLogout = () => {
    localStorage.removeItem('snowtrip_user');
    navigate('/login', { replace: true });
  };

  const userInitial = user ? (user.firstName?.[0] ?? '?').toUpperCase() : '?';
  const navLinks    = getNavLinks(user?.userRole);
  const roleColor   = { admin: '#f59e0b', manager: '#38d9c0', user: '#4f8ef7' }[user?.userRole] ?? '#4f8ef7';

  return (
    <>
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }} role="navigation" aria-label="Main navigation">

        {/* ── Left: Logo ──────────────────────────────────────────────────────── */}
        <NavLink to="/dashboard" style={styles.logo} id="nav-logo">
          <span style={styles.logoIcon}>❄️</span>
          <span style={styles.logoText}>SnowTrip</span>
          <span style={styles.logoAccent}>Planner</span>
        </NavLink>

        {/* ── Centre: Desktop nav links ─────────────────────────────────────── */}
        <ul style={styles.linkList}>
          {navLinks.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                id={`nav-link-${label.toLowerCase().replace(' ', '-')}`}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {}),
                })}
              >
                <span style={styles.linkIcon} aria-hidden="true">{icon}</span>
                {label}
                {to === '/trips' && joinRequestCount > 0 && (
                  <span style={styles.mobileBadge} aria-label={`${joinRequestCount} pending trip join requests`}>
                    {joinRequestCount > 9 ? '9+' : joinRequestCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Right: Avatar button + hamburger ─────────────────────────────── */}
        <div style={styles.right}>
          {user && (
            <button
              id="profile-panel-btn"
              style={styles.avatarBtn}
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile panel"
              title={`${user.firstName} ${user.lastName}`}
            >
              {/* Badge — friend requests only (trip join requests live on My Trips / trip cards, not here) */}
              {requestCount > 0 && (
                <span style={styles.avatarBadge} aria-label={`${requestCount} friend requests`}>
                  {requestCount > 9 ? '9+' : requestCount}
                </span>
              )}
              {/* Avatar circle */}
              <div style={{ ...styles.avatar, background: roleColor }}>
                {userInitial}
              </div>
              {/* Name + role */}
              <div style={styles.userText}>
                <span style={styles.userName}>{user.firstName} {user.lastName}</span>
                <span style={{ ...styles.userRole, color: roleColor }}>{user.userRole}</span>
              </div>
            </button>
          )}

          {/* Hamburger for mobile */}
          <button
            style={styles.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            id="nav-hamburger"
          >
            <span style={styles.hamburgerLine(menuOpen, 0)} />
            <span style={styles.hamburgerLine(menuOpen, 1)} />
            <span style={styles.hamburgerLine(menuOpen, 2)} />
          </button>
        </div>

        {/* ── Mobile dropdown menu ──────────────────────────────────────────── */}
        {menuOpen && (
          <div style={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Mobile navigation">
            {user && (
              <div style={styles.mobileUserInfo}>
                <div style={{ ...styles.avatar, background: roleColor, width: 36, height: 36, fontSize: '1rem' }}>
                  {userInitial}
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ color: roleColor, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {user.userRole}
                  </div>
                </div>
              </div>
            )}

            <ul style={{ padding: 0 }}>
              {navLinks.map(({ to, label, icon }) => (
                <li key={to} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <NavLink
                    to={to}
                    style={({ isActive }) => ({
                      ...styles.mobileLink,
                      ...(isActive ? styles.mobileLinkActive : {}),
                    })}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                    {to === '/trips' && joinRequestCount > 0 && (
                      <span style={styles.mobileBadge}>{joinRequestCount}</span>
                    )}
                  </NavLink>
                </li>
              ))}

              {/* Friends + Settings accessible from mobile menu too */}
              <li style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <NavLink to="/friends" style={({ isActive }) => ({ ...styles.mobileLink, ...(isActive ? styles.mobileLinkActive : {}) })}>
                  <span aria-hidden="true">👥</span>Friends
                  {requestCount > 0 && <span style={styles.mobileBadge}>{requestCount}</span>}
                </NavLink>
              </li>
              <li style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <NavLink to="/settings" style={({ isActive }) => ({ ...styles.mobileLink, ...(isActive ? styles.mobileLinkActive : {}) })}>
                  <span aria-hidden="true">⚙️</span>Settings
                </NavLink>
              </li>
            </ul>

            {user && (
              <button onClick={handleLogout} style={styles.mobileLogout} id="mobile-logout-btn">
                ↩ Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Profile panel — rendered outside <nav> to avoid stacking context issues */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 200,
    height: 'var(--navbar-height)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2rem',
    gap: '1.5rem',
    background: 'rgba(8, 13, 28, 0.90)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.3s ease, box-shadow 0.3s ease',
  },
  navScrolled: {
    background: 'rgba(8, 13, 28, 0.98)',
    boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
  },

  logo: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    textDecoration: 'none', flexShrink: 0,
  },
  logoIcon: { fontSize: '1.4rem', filter: 'drop-shadow(0 0 8px rgba(79,142,247,0.7))' },
  logoText: {
    fontFamily: 'var(--font-display)', fontWeight: 800,
    fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.01em',
  },
  logoAccent: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem',
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: '-0.01em',
  },

  linkList: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    flex: 1, justifyContent: 'center',
  },
  link: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.88rem', fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  linkActive: {
    background: 'rgba(79,142,247,0.12)',
    color: 'var(--accent-light)', fontWeight: 600,
  },
  linkIcon: { fontSize: '0.9rem' },

  right: {
    display: 'flex', alignItems: 'center',
    gap: '0.75rem', flexShrink: 0, marginLeft: 'auto',
  },

  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '0.35rem 0.75rem 0.35rem 0.45rem',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  avatarBadge: {
    position: 'absolute',
    top: -6, left: -4,
    minWidth: 18, height: 18,
    borderRadius: 'var(--radius-full)',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid rgba(8,13,28,0.95)',
    zIndex: 1,
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: 700,
    color: '#0a0f1e', flexShrink: 0,
  },
  userText: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  userName: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  userRole: { fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize', letterSpacing: '0.03em' },

  hamburger: {
    display: 'none',
    flexDirection: 'column', justifyContent: 'center',
    gap: '5px', width: 36, height: 36,
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '4px',
  },
  hamburgerLine: (open, idx) => ({
    display: 'block', width: '100%', height: '2px',
    background: 'var(--text-secondary)', borderRadius: 2,
    transition: 'all 0.2s ease',
    ...(open && idx === 0 ? { transform: 'translateY(7px) rotate(45deg)'  } : {}),
    ...(open && idx === 1 ? { opacity: 0 } : {}),
    ...(open && idx === 2 ? { transform: 'translateY(-7px) rotate(-45deg)' } : {}),
  }),

  mobileMenu: {
    position: 'fixed',
    top: 'var(--navbar-height)', left: 0, right: 0,
    background: 'rgba(8,13,28,0.98)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '1rem', zIndex: 199,
  },
  mobileUserInfo: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: '0.5rem',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.85rem 0.5rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.95rem', fontWeight: 500,
    transition: 'color 0.15s ease',
  },
  mobileLinkActive: { color: 'var(--accent-light)', fontWeight: 600 },
  mobileBadge: {
    marginLeft: '0.4rem',
    minWidth: 18, height: 18,
    borderRadius: 'var(--radius-full)',
    background: '#ef4444', color: '#fff',
    fontSize: '0.65rem', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },
  mobileLogout: {
    marginTop: '0.75rem', width: '100%',
    padding: '0.75rem',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-md)',
    color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
  },
};

export default Navbar;
