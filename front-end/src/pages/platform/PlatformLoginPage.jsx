'use strict';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/index.js';
import { useSession } from '../../auth/useSession.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { toast } from '../../components/feedback/feedback.js';
import { usePageStyles } from '../../hooks/usePageStyles.js';
import platformCss from '../../styles/platform/platform.css?inline';

const DEMO_EMAIL = 'platform@federico.com';
const DEMO_PASSWORD = 'Federico@Platform123';

/**
 * Ported from platform/platform-login.html + platform-login.js.
 *
 * Platform Super Users are a separate auth realm from the hospital actors: a
 * different endpoint, and a session marked isPlatformUser that the actor-based
 * RequireModule never looks at.
 */
export default function PlatformLoginPage() {
  usePageStyles(platformCss);
  useDocumentTitle('Federico Platform — Sign In');
  const navigate = useNavigate();
  const { setSession, isPlatformUser } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in as platform? Skip straight to the dashboard.
  useEffect(() => {
    if (isPlatformUser) navigate('/platform/platform-dashboard.html', { replace: true });
  }, [isPlatformUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Please enter both email and password.', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.platform.auth.login(email.trim(), password);
      setSession({
        token: result.token,
        actor: 'PLATFORM',
        role: 'PLATFORM',
        isPlatformUser: true,
        displayName: result.user.name,
        email: result.user.email,
        platformUserId: result.user.platform_user_id,
      });
      navigate('/platform/platform-dashboard.html');
    } catch (err) {
      toast(err.status === 401 ? 'Invalid email or password.' : err.message || 'Login failed.', 'error');
      setSubmitting(false);
    }
  }

  return (
    <div className="platform-auth-body">
      <div className="md-blur-shape md-blur-primary" style={{ width: 480, height: 480, top: -160, left: -140 }} aria-hidden="true" />
      <div className="md-blur-shape md-blur-tertiary" style={{ width: 360, height: 360, bottom: -140, right: -100 }} aria-hidden="true" />

      <main className="platform-login-card md-glass">
        <div className="platform-brand">
          <span className="md-brand-mark">F</span>
          <div>
            <div className="platform-brand-title">Federico Cloud</div>
            <div className="label">Platform Super User</div>
          </div>
        </div>

        <form id="platform-login-form" className="platform-login-form" onSubmit={handleSubmit}>
          <div className="md-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="Enter your email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="md-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Enter your password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="md-btn md-btn-filled md-btn-lg" id="submit-btn" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div
          id="platform-demo-cred"
          className="md-glass"
          style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, cursor: 'pointer' }}
          title="Click to autofill"
          onClick={() => {
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);
          }}
        >
          <strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
            Demo access
          </strong>
          Email: <code>{DEMO_EMAIL}</code>
          <br />
          Password: <code>{DEMO_PASSWORD}</code>
        </div>

        <Link className="md-btn md-btn-text" to="/landing/landing-page.html" style={{ marginTop: 8 }}>
          {'←'} Back to Federico
        </Link>
      </main>
    </div>
  );
}

