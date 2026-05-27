import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout — wraps all protected pages.
 * Structure: Navbar (fixed) → <main> with top padding → <Outlet> → Footer
 *
 * The <style> tag below handles responsive rules for the Navbar
 * that can't be expressed purely in JS inline styles.
 */
function Layout() {
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

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
