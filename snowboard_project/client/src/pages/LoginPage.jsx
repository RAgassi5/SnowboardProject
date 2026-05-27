import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getStoredUser } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

// ── Validation helpers ────────────────────────────────────────────────────────

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim())          errors.email    = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!password)              errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  return errors;
};

// ── Component ─────────────────────────────────────────────────────────────────

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, skip login page
  useEffect(() => {
    if (getStoredUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const data = await login(form.email.trim(), form.password);
      // data = { message: "Login successful.", user: { userId, firstName, ... } }
      const user = data.user;

      // Persist user (including role) to localStorage
      localStorage.setItem('snowtrip_user', JSON.stringify(user));

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="login-page-bg">

      {/* Card */}
      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>❄️</span>
          <h1 style={styles.brandName}>SnowTrip Planner</h1>
          <p style={styles.brandTagline}>Your personalized ski &amp; snowboard trip assistant</p>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.heading}>Sign In</h2>
        <p style={styles.subheading}>Enter your credentials to access your dashboard</p>

        {/* Server error */}
        <ErrorMessage
          message={serverError}
          onDismiss={() => setServerError('')}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate id="login-form">

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <span id="email-error" className="form-error" role="alert">
                ⚠ {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: '2.8rem' }}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" className="form-error" role="alert">
                ⚠ {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                Signing in…
              </>
            ) : (
              '🏔️  Sign In'
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>🧪 Demo Credentials</p>
          <div style={styles.demoGrid}>
            <DemoCredential
              label="Admin"
              email="roii@example.com"
              password="password123"
              onUse={(email, password) => {
                setForm({ email, password });
                setFieldErrors({});
                setServerError('');
              }}
            />
            <DemoCredential
              label="User"
              email="lebron@example.com"
              password="password123"
              onUse={(email, password) => {
                setForm({ email, password });
                setFieldErrors({});
                setServerError('');
              }}
            />
          </div>
        </div>

        {/* Sign-up link */}
        <div style={styles.registerLink}>
          Don’t have an account?{' '}
          <Link to="/register" id="go-to-register"
            style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
            Sign Up →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: demo credential tile ──────────────────────────────────────

function DemoCredential({ label, email, password, onUse }) {
  return (
    <button
      type="button"
      onClick={() => onUse(email, password)}
      style={styles.demoTile}
      title={`Use ${label} credentials`}
    >
      <span style={styles.demoLabel}>{label}</span>
      <span style={styles.demoEmail}>{email}</span>
      <span style={styles.demoHint}>Click to fill</span>
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  blobTopLeft: {
    position: 'fixed',
    top: '-120px',
    left: '-120px',
    width: '480px',
    height: '480px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  blobBottomRight: {
    position: 'fixed',
    bottom: '-100px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,217,192,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 60px rgba(0,0,0,0.5), 0 0 40px rgba(79,142,247,0.08)',
  },
  brand: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  brandIcon: {
    fontSize: '2.8rem',
    display: 'block',
    marginBottom: '0.4rem',
    filter: 'drop-shadow(0 0 12px rgba(79,142,247,0.6))',
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 800,
    background: 'var(--grad-accent)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.3rem',
  },
  brandTagline: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  divider: {
    height: '1px',
    background: 'var(--border-subtle)',
    margin: '0 -2rem 1.5rem',
  },
  heading: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.3rem',
  },
  subheading: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '1.5rem',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '0',
    color: 'var(--text-muted)',
  },
  demoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
  },
  demoTitle: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginBottom: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  demoTile: {
    background: 'rgba(79,142,247,0.06)',
    border: '1px solid rgba(79,142,247,0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.75rem',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    transition: 'all 0.15s ease',
  },
  demoLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--accent-light)',
  },
  demoEmail: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    wordBreak: 'break-all',
  },
  demoHint: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
  },
  registerLink: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
};

export default LoginPage;
