import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getResorts } from '../services/api';
import DataTable from '../components/DataTable';
import ResortCard from '../components/ResortCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Column definitions ────────────────────────────────────────────────────────

const DIFFICULTY_LABELS = {
  1: 'First-Timer',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Expert',
  5: 'Pro / Freeride',
};

const DIFFICULTY_COLORS = {
  1: '#22c55e',
  2: '#38d9c0',
  3: '#4f8ef7',
  4: '#f59e0b',
  5: '#ef4444',
};

const COLUMNS = [
  { key: 'resortId', label: '#' },
  { key: 'name',    label: 'Resort Name' },
  { key: 'country', label: 'Country' },
  {
    key: 'elevation',
    label: 'Elevation',
    render: (val) => val ? `${val.toLocaleString()} m` : '—',
  },
  {
    key: 'terrainType',
    label: 'Terrain Type',
    render: (val) => val
      ? val.charAt(0).toUpperCase() + val.slice(1)
      : '—',
  },
  {
    key: 'difficultyLevel',
    label: 'Difficulty',
    render: (val) => (
      <span style={{
        color: DIFFICULTY_COLORS[val] ?? 'var(--text-secondary)',
        fontWeight: 600,
      }}>
        {val} — {DIFFICULTY_LABELS[val] ?? `Level ${val}`}
      </span>
    ),
  },
  {
    key: 'snowboardFriendly',
    label: 'Board-Friendly',
    render: (val) => (
      <span style={{
        color: val ? '#5eead4' : '#fca5a5',
        fontWeight: 600,
      }}>
        {val ? '✅ Yes' : '❌ No'}
      </span>
    ),
  },
  {
    key: 'viewLink',
    label: '',
    render: () => <span style={styles.viewLink}>View Resort →</span>,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

function ResortsPage() {
  const navigate = useNavigate();
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('resortId');
  const [sortDir, setSortDir] = useState('asc');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetch_ = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getResorts();
        if (!cancelled) setResorts(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch_();
    return () => { cancelled = true; };
  }, []);

  // ── Sort handler ───────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = resorts
    .filter((r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'string'
        ? av.localeCompare(bv)
        : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Sortable column headers (the trailing "view" column isn't sortable)
  const sortableColumns = COLUMNS.map((col) => {
    if (col.key === 'viewLink') return col;
    return {
      ...col,
      label: (
        <button
          onClick={() => handleSort(col.key)}
          style={sortHeaderStyle(sortKey === col.key)}
          title={`Sort by ${col.label}`}
        >
          {col.label}
          {sortKey === col.key && (
            <span aria-label={sortDir === 'asc' ? 'Sorted ascending' : 'Sorted descending'}>
              {sortDir === 'asc' ? ' ↑' : ' ↓'}
            </span>
          )}
        </button>
      ),
    };
  });

  // Featured Resorts — top 6 by elevation, reusing already-fetched data (no new endpoint)
  const featured = [...resorts]
    .sort((a, b) => (b.elevation ?? 0) - (a.elevation ?? 0))
    .slice(0, 6);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1>Ski &amp; Snowboard Resorts</h1>
        <p>Full resort database — sortable and searchable</p>
      </div>

      {/* Featured Resorts */}
      {!loading && !error && featured.length > 0 && (
        <section style={styles.featuredSection} aria-label="Featured resorts">
          <h2 style={styles.featuredHeading}>🌟 Featured Resorts</h2>
          <div style={styles.featuredStrip}>
            {featured.map((resort) => (
              <div key={resort.resortId} style={styles.featuredCardWrap}>
                <ResortCard resort={resort} onClick={() => navigate(`/resorts/${resort.resortId}`)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toolbar */}
      {!loading && !error && resorts.length > 0 && (
        <div style={styles.toolbar}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              id="resort-search"
              type="search"
              className="form-input"
              placeholder="🔍  Search by name or country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search resorts"
            />
          </div>
          <div style={styles.meta}>
            <span style={styles.countLabel}>
              {filtered.length} of {resorts.length} resorts
            </span>
            <Link to="/dashboard" className="btn btn-secondary" id="resorts-back-btn">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* States */}
      {loading && <LoadingSpinner message="Loading resort data…" />}
      {!loading && error && (
        <ErrorMessage message={error} onDismiss={() => setError('')} />
      )}

      {/* Table */}
      {!loading && !error && (
        <DataTable
          id="resorts-table"
          columns={sortableColumns}
          data={filtered}
          onRowClick={(row) => navigate(`/resorts/${row.resortId}`)}
          emptyMessage={
            search
              ? `No resorts match "${search}".`
              : 'No resorts found. Make sure the backend is running.'
          }
        />
      )}

      {/* Summary stats cards */}
      {!loading && !error && resorts.length > 0 && (
        <div style={styles.summaryGrid}>
          <SummaryCard
            label="Total Resorts"
            value={resorts.length}
            icon="⛷️"
          />
          <SummaryCard
            label="Countries"
            value={[...new Set(resorts.map((r) => r.country))].length}
            icon="🌍"
          />
          <SummaryCard
            label="Board-Friendly"
            value={resorts.filter((r) => r.snowboardFriendly).length}
            icon="🏂"
          />
          <SummaryCard
            label="Avg Elevation"
            value={`${Math.round(
              resorts.reduce((s, r) => s + (r.elevation ?? 0), 0) / resorts.length
            ).toLocaleString()} m`}
            icon="📏"
          />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.06em', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const sortHeaderStyle = (active) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: active ? 'var(--accent-light)' : 'inherit',
  fontWeight: 700,
  fontSize: 'inherit',
  letterSpacing: 'inherit',
  textTransform: 'inherit',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  whiteSpace: 'nowrap',
});

const styles = {
  featuredSection: {
    marginBottom: '2rem',
  },
  featuredHeading: {
    fontSize: '1.2rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    marginBottom: '1rem',
  },
  featuredStrip: {
    display: 'flex',
    gap: '1.25rem',
    overflowX: 'auto',
    scrollSnapType: 'x proximity',
    paddingBottom: '0.5rem',
  },
  featuredCardWrap: {
    flex: '0 0 280px',
    scrollSnapAlign: 'start',
  },
  viewLink: {
    color: 'var(--accent-light)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
  },
  countLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem',
    marginTop: '2rem',
  },
};

export default ResortsPage;
