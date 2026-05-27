import React, { useState } from 'react';
import { updateUser, getStoredUser, getStoredRole } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLE_COLORS     = { admin: '#f59e0b', manager: '#38d9c0', user: '#4f8ef7' };
const ROLE_ICONS      = { admin: '⭐', manager: '🔑', user: '👤' };
const ROLE_BADGE_CLS  = { admin: 'badge badge-amber', manager: 'badge badge-teal', user: 'badge badge-blue' };
const SKILL_LABELS    = { 1: 'First-Timer', 2: 'Novice', 3: 'Intermediate', 4: 'Expert', 5: 'Pro / Freeride' };

// ── Validation ────────────────────────────────────────────────────────────────
const validate = ({ firstName, lastName }) => {
  const errs = {};
  if (!firstName.trim()) errs.firstName = 'First name is required.';
  if (!lastName.trim())  errs.lastName  = 'Last name is required.';
  return errs;
};

// ── Component ─────────────────────────────────────────────────────────────────
function SettingsPage() {
  const user = getStoredUser();
  const role = getStoredRole();

  const [form, setForm] = useState({
    firstName:  user?.firstName  ?? '',
    lastName:   user?.lastName   ?? '',
    userRole:   user?.userRole   ?? 'user',
    sportType:  user?.sportType  ?? 'snowboard',
    skillLevel: (user?.skillLevel ?? 3).toString(),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg]   = useState('');

  const canEdit = role === 'admin' || role === 'manager';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
    if (serverError) setServerError('');
    if (successMsg)  setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    setServerError('');
    setSuccessMsg('');
    try {
      // ── Backend update (firstName, lastName, userRole) — admin/manager only ──
      if (canEdit) {
        await updateUser(user.userId, {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          userRole:  form.userRole,
        }, role);
      }

      // ── Always save all fields to localStorage (including sportType + skillLevel) ──
      const updated = {
        ...user,
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        userRole:   form.userRole,
        sportType:  form.sportType,
        skillLevel: parseInt(form.skillLevel),
        updateDate: new Date().toISOString(),
      };
      localStorage.setItem('snowtrip_user', JSON.stringify(updated));

      setSuccessMsg(
        canEdit
          ? '✅ Profile updated in both the backend and your local session.'
          : '✅ Sport type and skill level saved locally. Name changes require admin/manager role.'
      );
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="page-content">
        <ErrorMessage message="No user session found. Please log in again." />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Settings &amp; Profile</h1>
        <p>Update your profile details and trip preferences.</p>
      </div>

      <div style={styles.layout}>
        {/* ── Left: Avatar + info ─────────────────────────────────────────── */}
        <aside>
          <div className="card" style={styles.avatarCard}>
            <div style={{ ...styles.avatar, background: ROLE_COLORS[user.userRole] ?? '#4f8ef7' }}>
              {(user.firstName?.[0] ?? '?').toUpperCase()}
            </div>
            <h2 style={styles.fullName}>{user.firstName} {user.lastName}</h2>
            <div style={styles.email}>{user.email}</div>
            <span className={ROLE_BADGE_CLS[user.userRole] ?? 'badge badge-blue'}
              style={{ marginTop: '0.4rem' }}>
              {ROLE_ICONS[user.userRole] ?? '👤'} {user.userRole}
            </span>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={styles.infoLabel}>Account Details</div>
            <div style={styles.infoList}>
              <InfoRow label="User ID"     value={`#${user.userId}`} />
              <InfoRow label="Sport"
                value={user.sportType === 'snowboard' ? '🏂 Snowboard' : '⛷️ Ski'} />
              <InfoRow label="Skill"
                value={`${user.skillLevel} — ${SKILL_LABELS[user.skillLevel] ?? '?'}`} />
              <InfoRow label="Member since"
                value={user.createDate
                  ? new Date(user.createDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'} />
            </div>
          </div>
        </aside>

        {/* ── Right: Edit form ─────────────────────────────────────────────── */}
        <div>
          <div className="card">
            <h2 style={styles.formTitle}>Edit Profile</h2>

            {/* Permission note for regular users */}
            {!canEdit && (
              <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
                <span>🔒</span>
                <div>
                  <strong>Limited editing.</strong> You are logged in as{' '}
                  <strong>{role}</strong>. Name and role changes require an admin or manager account.
                  Sport type and skill level are saved to your local session and pre-fill the Plan Trip form.
                </div>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <span>✅</span><span>{successMsg}</span>
              </div>
            )}

            <ErrorMessage message={serverError} onDismiss={() => setServerError('')} />

            <form onSubmit={handleSubmit} noValidate id="settings-form">

              {/* Name row */}
              <div style={styles.nameRow}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="s-firstName" className="form-label">First Name</label>
                  <input id="s-firstName" name="firstName" type="text"
                    className={`form-input ${fieldErrors.firstName ? 'error' : ''}`}
                    value={form.firstName} onChange={handleChange}
                    disabled={!canEdit || loading} autoComplete="given-name" />
                  {fieldErrors.firstName && (
                    <span className="form-error" role="alert">⚠ {fieldErrors.firstName}</span>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="s-lastName" className="form-label">Last Name</label>
                  <input id="s-lastName" name="lastName" type="text"
                    className={`form-input ${fieldErrors.lastName ? 'error' : ''}`}
                    value={form.lastName} onChange={handleChange}
                    disabled={!canEdit || loading} autoComplete="family-name" />
                  {fieldErrors.lastName && (
                    <span className="form-error" role="alert">⚠ {fieldErrors.lastName}</span>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="s-userRole" className="form-label">Role</label>
                <select id="s-userRole" name="userRole"
                  className="form-input" value={form.userRole}
                  onChange={handleChange} disabled={!canEdit || loading}>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* ── Trip preferences (all roles can set these) ───────────── */}
              <hr style={{ borderColor: 'var(--border-subtle)', margin: '1.5rem 0' }} />
              <h3 style={styles.prefTitle}>Trip Preferences</h3>
              <p style={styles.prefSub}>
                These pre-fill your Plan Trip form and personalise recommendations.
                Saved to your local session.
              </p>

              {/* Sport type */}
              <div className="form-group">
                <label className="form-label">Sport Type</label>
                <div style={styles.sportToggle}>
                  {['ski', 'snowboard'].map(sport => (
                    <label key={sport} htmlFor={`s-sport-${sport}`} style={{
                      ...styles.sportOpt,
                      ...(form.sportType === sport ? styles.sportOptActive : {}),
                    }}>
                      <input id={`s-sport-${sport}`} type="radio" name="sportType"
                        value={sport} checked={form.sportType === sport}
                        onChange={handleChange} disabled={loading}
                        style={{ display: 'none' }} />
                      {sport === 'ski' ? '⛷️ Ski' : '🏂 Snowboard'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Skill level */}
              <div className="form-group">
                <label htmlFor="s-skillLevel" className="form-label">
                  Skill Level
                  <span style={{ color: 'var(--accent-light)', fontWeight: 400, fontSize: '0.8rem' }}>
                    &nbsp;({SKILL_LABELS[form.skillLevel] ?? '…'})
                  </span>
                </label>
                <select id="s-skillLevel" name="skillLevel"
                  className="form-input" value={form.skillLevel}
                  onChange={handleChange} disabled={loading}>
                  <option value="1">1 — First-Timer</option>
                  <option value="2">2 — Novice</option>
                  <option value="3">3 — Intermediate</option>
                  <option value="4">4 — Expert</option>
                  <option value="5">5 — Pro / Freeride</option>
                </select>
              </div>

              {/* Email (read-only) */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input"
                  value={user.email ?? ''} disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  aria-label="Email address — read only" />
              </div>

              <button type="submit" id="settings-submit" className="btn btn-primary"
                disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading
                  ? <><span className="spinner spinner-sm" /> Saving…</>
                  : '💾 Save Changes'}
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ ...styles.prefTitle, marginBottom: '0.5rem' }}>Session</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Signed in as <strong style={{ color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </strong> ({user.email}).
            </p>
            <button id="settings-logout" className="btn btn-danger"
              onClick={() => {
                localStorage.removeItem('snowtrip_user');
                window.location.href = '/login';
              }}>
              ↩ Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  layout: {
    display: 'grid', gridTemplateColumns: '260px 1fr',
    gap: '1.5rem', alignItems: 'start',
  },
  avatarCard: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center',
    gap: '0.35rem', padding: '2rem 1.25rem',
  },
  avatar: {
    width: 68, height: 68, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem', fontWeight: 800, color: '#0a0f1e',
    marginBottom: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  fullName: { fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' },
  email:    { fontSize: '0.8rem', color: 'var(--text-muted)' },
  infoLabel: {
    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem',
  },
  infoList: {},
  formTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' },
  nameRow:   { display: 'flex', gap: '1rem' },
  prefTitle: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
  prefSub:   { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.55 },
  sportToggle: { display: 'flex', gap: '0.75rem' },
  sportOpt: {
    flex: 1, textAlign: 'center', padding: '0.65rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s ease',
  },
  sportOptActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)', color: 'var(--accent-light)',
  },
};

export default SettingsPage;
