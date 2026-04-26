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
      } else {
        await signUp(email, password);
      }
      onClose();
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
      </div>
    </div>
  );
}
