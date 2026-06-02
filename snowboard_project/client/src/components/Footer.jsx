import React from 'react';
import { NavLink } from 'react-router-dom';

const FOOTER_LINKS = [
  { to: '/dashboard',       label: 'Dashboard' },
  { to: '/resorts',         label: 'Resorts' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/gear',            label: 'Gear' },
  { to: '/settings',        label: 'Settings' },
];

function Footer() {
  return (
    <footer style={styles.footer} role="contentinfo">
      {/* Top decorative line */}
      <div style={styles.topAccent} aria-hidden="true" />

      <div style={styles.inner}>
        {/* ── Brand column ──────────────────────────────────────────────────── */}
        <div style={styles.brandCol}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>❄️</span>
            <span style={styles.logoText}>
              Snow<span style={styles.logoAccent}>Trip</span> Planner
            </span>
          </div>
          <p style={styles.tagline}>
            Plan smarter ski and snowboard trips with personalized resort insights.
          </p>
          <div style={styles.techBadge}>
            <span style={styles.dot} />
            Built with React + Node.js / Express
          </div>
        </div>

        {/* ── Quick links column ─────────────────────────────────────────────── */}
        <div style={styles.linksCol}>
          <h3 style={styles.colHeading}>Navigate</h3>
          <ul style={{ padding: 0 }}>
            {FOOTER_LINKS.map(({ to, label }) => (
              <li key={to} style={{ marginBottom: '0.4rem' }}>
                <NavLink to={to} style={styles.footerLink} id={`footer-link-${label.toLowerCase()}`}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Info column ────────────────────────────────────────────────────── */}
        <div style={styles.infoCol}>
          <h3 style={styles.colHeading}>About</h3>
          <p style={styles.infoText}>
            SnowTrip Planner is a fullstack university project (BGU Web Development).
            Backend powered by Express with in-memory data. Frontend built with React Router.
          </p>
          <div style={styles.stats}>
            <StatPill icon="⛷️" label="5 Resorts" />
            <StatPill icon="🌍" label="4 Countries" />
            <StatPill icon="🎯" label="AI Picks" />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────────── */}
      <div style={styles.bottom}>
        <span style={styles.copyright}>
          © {new Date().getFullYear()} SnowTrip Planner · BGU Web Development Final Project
        </span>
        <span style={styles.slogan}>
          🏔️ Ride the mountain. Plan the trip.
        </span>
      </div>
    </footer>
  );
}

function StatPill({ icon, label }) {
  return (
    <span style={styles.statPill}>
      {icon} {label}
    </span>
  );
}

const styles = {
  footer: {
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 'auto',
  },
  topAccent: {
    height: '3px',
    background: 'var(--grad-accent)',
    opacity: 0.6,
  },
  inner: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '2.5rem 2rem',
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr 1.6fr',
    gap: '2rem',
  },

  // Brand
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.4rem',
    filter: 'drop-shadow(0 0 6px rgba(79,142,247,0.5))',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  logoAccent: {
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    maxWidth: '260px',
  },
  techBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    padding: '0.3rem 0.7rem',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-full)',
    width: 'fit-content',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-secondary)',
    display: 'inline-block',
  },

  // Nav links
  linksCol: {},
  colHeading: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '0.9rem',
  },
  footerLink: {
    fontSize: '0.87rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    display: 'block',
  },

  // Info column
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  infoText: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    lineHeight: 1.65,
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginTop: '0.25rem',
  },
  statPill: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.65rem',
    background: 'rgba(79,142,247,0.08)',
    border: '1px solid rgba(79,142,247,0.15)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--accent-light)',
    fontWeight: 500,
  },

  // Bottom bar
  bottom: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '1rem 2rem',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  copyright: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  slogan: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default Footer;
