import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Snowfall from 'react-snowfall';
import Navbar from './Navbar';
import Footer from './Footer';

// ── Snow preference helpers ───────────────────────────────────────────────────

const SNOW_KEY = 'snowtrip_snow';

/** Returns true if snowfall is enabled (default: true). */
const getSnowEnabled = () => localStorage.getItem(SNOW_KEY) !== 'false';

/**
 * Layout — wraps all protected pages.
 * Structure: Navbar (fixed) → <main> with top padding → <Outlet> → Footer
 * Snowfall is mounted here once, globally, behind all UI (z-index: 1, pointer-events: none).
 *
 * The <style> tag below handles responsive rules for the Navbar
 * that can't be expressed purely in JS inline styles.
 */
function Layout() {
  const [snowEnabled, setSnowEnabled] = useState(getSnowEnabled);

  // Listen for real-time toggle changes fired from SettingsPage
  useEffect(() => {
    const handler = () => setSnowEnabled(getSnowEnabled());
    window.addEventListener('snowtrip:snow-changed', handler);
    return () => window.removeEventListener('snowtrip:snow-changed', handler);
  }, []);

  return (
    <>
      {/* Responsive overrides for Navbar */}
      <style>{`
        @media (max-width: 900px) {
          /* Hide desktop link list on mobile */
          nav ul[role="list"] {
            display: none !important;
          }
          /* Hide user info text labels on small screens */
          nav [data-user-text] {
            display: none;
          }
          /* Show hamburger on mobile */
          nav button[aria-label="Open menu"],
          nav button[aria-label="Close menu"] {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          /* Always hide hamburger on desktop */
          nav button[aria-label="Open menu"],
          nav button[aria-label="Close menu"] {
            display: none !important;
          }
        }

        /* Footer responsive — stack columns on mobile */
        @media (max-width: 768px) {
          footer > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
          footer > div:last-child {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }

        /* Navbar link hover effect (not achievable with inline styles) */
        nav a:not([data-logo]):hover {
          color: var(--accent-light) !important;
          background: rgba(79, 142, 247, 0.08) !important;
        }

        /* Footer link hover */
        footer a:hover {
          color: var(--accent-light) !important;
        }

        /* Logout button hover */
        button[id="logout-btn"]:hover,
        button[id="mobile-logout-btn"]:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
        }
      `}</style>

      {/* ── Snowfall — fixed, behind all UI, non-interactive ──────────────── */}
      {snowEnabled && (
        <Snowfall
          color="#d4e8ff"
          snowflakeCount={80}
          speed={[0.4, 1.4]}
          wind={[-0.3, 0.8]}
          radius={[1, 5]}
          opacity={[0.35, 0.8]}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <Navbar />
        <main
          style={{ flex: 1, paddingTop: 'var(--navbar-height)' }}
          id="main-content"
          role="main"
        >
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default Layout;
