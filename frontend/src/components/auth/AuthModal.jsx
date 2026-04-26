import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useT } from '../LangContext';

export default function AuthModal({ onClose, initialMode = 'signin' }) {
  const { t } = useT();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError(t('auth_error_invalid_email'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth_error_short_password'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        // Show "check your email" panel instead of closing the modal,
        // so the user knows they must confirm before they can sign in.
        setRegisteredEmail(email);
        setSignupSuccess(true);
      }
    } catch (err) {
      // Handle various error formats from Supabase
      const message = err?.message || err?.error_description || err?.msg || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick} data-testid="auth-modal-overlay">
      <div className="auth-modal" data-testid="auth-modal">
        <button className="auth-close" onClick={onClose} data-testid="auth-close-btn" aria-label="Close">
          ×
        </button>

        {signupSuccess ? (
          <div data-testid="auth-check-email" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
              color: 'var(--brass)',
              lineHeight: 1,
            }}>
              ✉
            </div>
            <h3 style={{
              fontFamily: 'var(--fraunces)',
              fontVariationSettings: "'opsz' 144, 'WONK' 1",
              fontWeight: 900,
              fontSize: 24,
              color: 'var(--bone)',
              letterSpacing: '-0.01em',
              margin: '0 0 12px',
            }}>
              {t('auth_check_email_title')}
            </h3>
            <p style={{
              fontFamily: 'var(--plex)',
              fontSize: 14,
              color: 'var(--linen)',
              lineHeight: 1.5,
              margin: '0 0 8px',
            }}>
              {t('auth_check_email_body_1', { email: registeredEmail })}
            </p>
            <p style={{
              fontFamily: 'var(--plex)',
              fontSize: 13,
              color: 'var(--smoke)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              margin: '0 0 24px',
            }}>
              {t('auth_check_email_body_2')}
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={() => { setSignupSuccess(false); onClose(); }}
              data-testid="auth-check-email-close"
            >
              {t('auth_check_email_close')}
            </button>
          </div>
        ) : (
          <>
            <div className="auth-tabs" data-testid="auth-tabs">
              <button
                className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => { setMode('signin'); setError(''); }}
                data-testid="auth-tab-signin"
              >
                {t('auth_sign_in')}
              </button>
              <button
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); }}
                data-testid="auth-tab-signup"
              >
                {t('auth_sign_up')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">{t('auth_email')}</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  data-testid="auth-input-email"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">{t('auth_password')}</label>
                <input
                  type="password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  data-testid="auth-input-password"
                />
                <span className="auth-hint">{t('auth_password_hint')}</span>
              </div>

              {error && <div className="auth-error" data-testid="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? '...' : mode === 'signin' ? t('auth_submit_signin') : t('auth_submit_signup')}
              </button>
            </form>

            <button
              className="auth-switch"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              data-testid="auth-switch-btn"
            >
              {mode === 'signin' ? t('auth_switch_to_signup') : t('auth_switch_to_signin')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
