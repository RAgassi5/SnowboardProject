import React, { useState } from 'react';
import { getGearRecommendation, getStoredUser, getStoredRole } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ── Gear emoji map ────────────────────────────────────────────────────────────
const gearIcon = (item = '') => {
  const l = item.toLowerCase();
  if (l.includes('helmet'))          return '🪖';
  if (l.includes('goggle'))          return '🥽';
  if (l.includes('boot'))            return '👢';
  if (l.includes('glove') || l.includes('mitt')) return '🧤';
  if (l.includes('jacket') || l.includes('coat')) return '🧥';
  if (l.includes('pole'))            return '🎿';
  if (l.includes('binding'))         return '🔩';
  if (l.includes('base') || l.includes('thermal') || l.includes('layer')) return '🧣';
  if (l.includes('pant') || l.includes('salopette')) return '👖';
  if (l.includes('board') && !l.includes('snowboard')) return '🏂';
  if (l.includes('ski') && !l.includes('boot')) return '⛷️';
  if (l.includes('beacon') || l.includes('probe') || l.includes('shovel') || l.includes('avalanche')) return '📡';
  if (l.includes('airbag') || l.includes('backpack')) return '🎒';
  if (l.includes('skin'))            return '🧲';
  return '📦';
};

/**
 * GearAdvisorModal — floating button + full-screen overlay modal.
 *
 * Props:
 *   resortId   {number}  — from the trip
 *   resortName {string}  — for display
 */
function GearAdvisorModal({ resortId, resortName }) {
  const user = getStoredUser();
  const role = getStoredRole();

  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null);
  const [checked, setChecked] = useState({});

  const skillLevel = user?.skillLevel ?? 3;
  const sportType  = user?.sportType  ?? 'snowboard';

  const fetchGear = async () => {
    if (result) return; // already loaded
    setLoading(true);
    setError('');
    try {
      const data = await getGearRecommendation(
        { resortId, skillLevel, sportType },
        role
      );
      setResult(data);
      // init all items unchecked
      const init = {};
      data.suggestedGear?.forEach((_, i) => { init[i] = false; });
      setChecked(init);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchGear();
  };

  const handleClose = () => setOpen(false);

  const toggleItem = (idx) =>
    setChecked(p => ({ ...p, [idx]: !p[idx] }));

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount   = result?.suggestedGear?.length ?? 0;

  return (
    <>
      {/* ── Floating action button ─────────────────────────────────────────── */}
      <button
        id="gear-advisor-btn"
        className="btn btn-primary"
        style={styles.fab}
        onClick={handleOpen}
        aria-label="Open Gear Advisor"
        title="Gear Advisor"
      >
        🎒 Gear Advisor
      </button>

      {/* ── Modal overlay ──────────────────────────────────────────────────── */}
      {open && (
        <div
          style={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Gear Advisor"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div style={styles.modal}>
            {/* Modal header */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>🎒 Gear Advisor</h2>
                <p style={styles.modalSub}>
                  {resortName} &nbsp;·&nbsp;
                  {sportType === 'snowboard' ? '🏂 Snowboard' : '⛷️ Ski'} &nbsp;·&nbsp;
                  Level {skillLevel}
                </p>
              </div>
              <button
                id="gear-modal-close"
                onClick={handleClose}
                style={styles.closeBtn}
                aria-label="Close gear advisor"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={styles.modalBody}>
              {loading && <LoadingSpinner message="Building your gear list…" />}
              <ErrorMessage message={error} onDismiss={() => setError('')} />

              {!loading && result && (
                <>
                  {/* Board warning */}
                  {result.warning && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                      <span>⚠️</span>
                      <span>{result.warning}</span>
                    </div>
                  )}

                  {/* Progress */}
                  <div style={styles.progress}>
                    <span style={styles.progressLabel}>
                      {checkedCount} / {totalCount} items packed
                    </span>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${totalCount ? (checkedCount / totalCount) * 100 : 0}%`,
                      }} />
                    </div>
                  </div>

                  {/* Checklist */}
                  <div style={styles.checklist}>
                    {result.suggestedGear.map((item, idx) => (
                      <button
                        key={idx}
                        id={`gear-item-${idx}`}
                        onClick={() => toggleItem(idx)}
                        style={{
                          ...styles.item,
                          ...(checked[idx] ? styles.itemChecked : {}),
                        }}
                        aria-pressed={!!checked[idx]}
                        title="Click to check off"
                      >
                        <span style={styles.itemIcon}>{gearIcon(item)}</span>
                        <span style={{
                          ...styles.itemText,
                          ...(checked[idx] ? styles.itemTextChecked : {}),
                        }}>
                          {item}
                        </span>
                        <span style={styles.itemCheck}>{checked[idx] ? '✅' : '☐'}</span>
                      </button>
                    ))}
                  </div>

                  {checkedCount === totalCount && totalCount > 0 && (
                    <div style={styles.allDone}>
                      🎉 All packed and ready to ride!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  fab: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 900,
    boxShadow: '0 4px 24px rgba(79,142,247,0.4)',
    borderRadius: 'var(--radius-full)',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: 700,
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    width: '100%', maxWidth: 540,
    maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '1rem',
    padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)',
  },
  modalTitle: {
    fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  modalSub: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  closeBtn: {
    background: 'none', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontSize: '0.85rem', padding: '0.3rem 0.6rem',
    flexShrink: 0,
    transition: 'color 0.15s ease',
  },
  modalBody: {
    padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1,
  },
  progress: { marginBottom: '1rem' },
  progressLabel: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    display: 'block', marginBottom: '0.4rem',
  },
  progressBar: {
    height: 6, borderRadius: 3,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    background: 'var(--grad-accent)',
    transition: 'width 0.3s ease',
  },
  checklist: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.7rem 0.9rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'all 0.15s ease',
  },
  itemChecked: {
    background: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  itemIcon: { fontSize: '1.15rem', flexShrink: 0 },
  itemText: {
    flex: 1, fontSize: '0.85rem',
    color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3,
  },
  itemTextChecked: { textDecoration: 'line-through', opacity: 0.5 },
  itemCheck: { fontSize: '1rem', flexShrink: 0 },
  allDone: {
    marginTop: '1rem', textAlign: 'center',
    fontSize: '0.9rem', fontWeight: 700,
    color: '#22c55e', padding: '0.75rem',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 'var(--radius-md)',
  },
};

export default GearAdvisorModal;
