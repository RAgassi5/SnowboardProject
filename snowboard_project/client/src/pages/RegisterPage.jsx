import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getStoredUser } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

// ── Validation ────────────────────────────────────────────────────────────────
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validate = ({ firstName, lastName, email, password, confirmPassword, sportType, skillLevel }) => {
  const errs = {};
  if (!firstName.trim())   errs.firstName = 'First name is required.';
  if (!lastName.trim())    errs.lastName  = 'Last name is required.';
  if (!email.trim())       errs.email = 'Email is required.';
  else if (!isValidEmail(email)) errs.email = 'Please enter a valid email address.';
  if (!password)           errs.password = 'Password is required.';
  else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
  if (!confirmPassword)    errs.confirmPassword = 'Please confirm your password.';
  else if (password && password !== confirmPassword)
    errs.confirmPassword = 'Passwords do not match.';
  if (!sportType)          errs.sportType  = 'Please choose a sport.';
  if (!skillLevel)         errs.skillLevel = 'Please select your skill level.';
  return errs;
};

// ── Component ─────────────────────────────────────────────────────────────────
function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: '', password: '', confirmPassword: '',
    sportType: 'snowboard', skillLevel: '2',
  });
  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (getStoredUser()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const data = await register({
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        email:      form.email.trim(),
        password:   form.password,
        sportType:  form.sportType,
        skillLevel: parseInt(form.skillLevel),
      });
      // Store and redirect to dashboard
      localStorage.setItem('snowtrip_user', JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="login-page-bg">
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>❄️</span>
          <h1 style={styles.brandName}>SnowTrip Planner</h1>
          <p style={styles.brandTagline}>Create your account and start planning</p>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.heading}>Create Account</h2>

        <ErrorMessage message={serverError} onDismiss={() => setServerError('')} />

        <form onSubmit={handleSubmit} noValidate id="register-form">

          {/* Name row */}
          <div style={styles.nameRow}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="reg-firstName" className="form-label">First Name</label>
              <input
                id="reg-firstName" name="firstName" type="text"
                className={`form-input ${fieldErrors.firstName ? 'error' : ''}`}
                placeholder="Jane" value={form.firstName}
                onChange={handleChange} autoComplete="given-name" disabled={loading}
              />
              {fieldErrors.firstName && (
                <span className="form-error" role="alert">⚠ {fieldErrors.firstName}</span>
              )}
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="reg-lastName" className="form-label">Last Name</label>
              <input
                id="reg-lastName" name="lastName" type="text"
                className={`form-input ${fieldErrors.lastName ? 'error' : ''}`}
                placeholder="Doe" value={form.lastName}
                onChange={handleChange} autoComplete="family-name" disabled={loading}
              />
              {fieldErrors.lastName && (
                <span className="form-error" role="alert">⚠ {fieldErrors.lastName}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input
              id="reg-email" name="email" type="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@example.com" value={form.email}
              onChange={handleChange} autoComplete="email" disabled={loading}
            />
            {fieldErrors.email && (
              <span className="form-error" role="alert">⚠ {fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div style={styles.pwWrap}>
              <input
                id="reg-password" name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="At least 6 characters" value={form.password}
                onChange={handleChange} autoComplete="new-password"
                disabled={loading} style={{ paddingRight: '2.8rem' }}
              />
              <button type="button" id="toggle-password"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn} aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="form-error" role="alert">⚠ {fieldErrors.password}</span>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <div style={styles.pwWrap}>
              <input
                id="reg-confirm" name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password" value={form.confirmPassword}
                onChange={handleChange} autoComplete="new-password"
                disabled={loading} style={{ paddingRight: '2.8rem' }}
              />
              <button type="button" id="toggle-confirm"
                onClick={() => setShowConfirm(v => !v)}
                style={styles.eyeBtn} aria-label={showConfirm ? 'Hide' : 'Show'}
                disabled={loading}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="form-error" role="alert">⚠ {fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Sport type */}
          <div className="form-group">
            <label className="form-label">Sport Type</label>
            <div style={styles.sportRow}>
              {['ski', 'snowboard'].map(sport => (
                <label key={sport} htmlFor={`reg-sport-${sport}`} style={{
                  ...styles.sportOpt,
                  ...(form.sportType === sport ? styles.sportOptActive : {}),
                }}>
                  <input id={`reg-sport-${sport}`} type="radio" name="sportType"
                    value={sport} checked={form.sportType === sport}
                    onChange={handleChange} disabled={loading}
                    style={{ display: 'none' }} />
                  {sport === 'ski' ? '⛷️ Ski' : '🏂 Snowboard'}
                </label>
              ))}
            </div>
            {fieldErrors.sportType && (
              <span className="form-error" role="alert">⚠ {fieldErrors.sportType}</span>
            )}
          </div>

          {/* Skill level */}
          <div className="form-group">
            <label htmlFor="reg-skillLevel" className="form-label">
              Skill Level
              <span style={{ color: 'var(--accent-light)', fontWeight: 400, fontSize: '0.8rem' }}>
                &nbsp;({SKILL_LABELS[form.skillLevel]})
              </span>
            </label>
            <select id="reg-skillLevel" name="skillLevel"
              className={`form-input ${fieldErrors.skillLevel ? 'error' : ''}`}
              value={form.skillLevel} onChange={handleChange} disabled={loading}>
              <option value="1">1 — First-Timer (nursery slopes only)</option>
              <option value="2">2 — Novice (green / easy blue runs)</option>
              <option value="3">3 — Intermediate (red / blue runs)</option>
              <option value="4">4 — Expert (black diamonds)</option>
              <option value="5">5 — Pro / Freeride (off-piste)</option>
            </select>
            {fieldErrors.skillLevel && (
              <span className="form-error" role="alert">⚠ {fieldErrors.skillLevel}</span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" id="register-submit"
            className="btn btn-primary btn-full"
            disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading
              ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Creating account…</>
              : '🏔️ Create Account'}
          </button>
        </form>

        {/* Link to login */}
        <div style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" id="go-to-login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
            Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SKILL_LABELS = {
  '1': 'First-Timer', '2': 'Novice', '3': 'Intermediate',
  '4': 'Expert', '5': 'Pro / Freeride',
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  card: {
    position: 'relative', zIndex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '2.25rem 2rem',
    width: '100%', maxWidth: '460px',
    boxShadow: '0 8px 60px rgba(0,0,0,0.5), 0 0 40px rgba(79,142,247,0.08)',
  },
  brand: { textAlign: 'center', marginBottom: '1.25rem' },
  brandIcon: {
    fontSize: '2.4rem', display: 'block', marginBottom: '0.35rem',
    filter: 'drop-shadow(0 0 12px rgba(79,142,247,0.6))',
  },
  brandName: {
    fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800,
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    marginBottom: '0.25rem',
  },
  brandTagline: { fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 },
  divider: { height: '1px', background: 'var(--border-subtle)', margin: '0 -2rem 1.25rem' },
  heading: {
    fontSize: '1.2rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: '1.25rem',
  },
  nameRow: { display: 'flex', gap: '0.75rem' },
  pwWrap:  { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
    padding: 0, color: 'var(--text-muted)',
  },
  sportRow: { display: 'flex', gap: '0.6rem' },
  sportOpt: {
    flex: 1, textAlign: 'center', padding: '0.6rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
    cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
    color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s ease',
  },
  sportOptActive: {
    background: 'rgba(79,142,247,0.12)',
    borderColor: 'var(--accent-primary)', color: 'var(--accent-light)',
  },
  loginLink: {
    marginTop: '1.25rem', textAlign: 'center',
    fontSize: '0.85rem', color: 'var(--text-muted)',
  },
};

export default RegisterPage;
