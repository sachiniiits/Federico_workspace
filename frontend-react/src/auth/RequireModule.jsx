'use strict';

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSession } from './useSession.js';
import { getActorHome, LOGIN_PATH } from './actorHome.js';
import { toast } from '../components/feedback/feedback.js';

const REDIRECT_DELAY_MS = 1100;

/**
 * Replaces shared/auth-guard.js plus RoleAccess.enforceModuleAccess.
 *
 * Legacy behaviour, preserved:
 *  - no session at all -> straight to the login page, no message;
 *  - signed in but wrong actor for this portal -> show the snackbar, leave it
 *    on screen for 1100ms, then redirect to that actor's own home. The delay
 *    existed so the message was readable instead of being wiped by a native
 *    alert; it is not incidental.
 *
 * window.APP_MODULE and the window.PatientSession it used to build are gone
 * (DEC-8): the module is a prop, and patient identity comes from the session.
 */
export default function RequireModule({ module: moduleName, children }) {
  const { isAuthenticated, actor, hasModuleAccess } = useSession();
  const navigate = useNavigate();
  const [denied, setDenied] = useState(false);
  const firedRef = useRef(false);

  const allowed = isAuthenticated && hasModuleAccess(moduleName);

  useEffect(() => {
    if (!isAuthenticated || allowed || firedRef.current) return undefined;
    firedRef.current = true;
    setDenied(true);
    toast('Access denied — ' + actor + ' cannot open the ' + moduleName + ' module.', 'error');
    const t = setTimeout(() => navigate(getActorHome(actor), { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAuthenticated, allowed, actor, moduleName, navigate]);

  if (!isAuthenticated) return <Navigate to={LOGIN_PATH} replace />;
  if (denied || !allowed) return null;
  return children;
}

/** Platform Super User console has its own auth realm, separate from the actor system. */
export function RequirePlatformUser({ children }) {
  const { isPlatformUser } = useSession();
  if (!isPlatformUser) return <Navigate to="/platform/platform-login.html" replace />;
  return children;
}

