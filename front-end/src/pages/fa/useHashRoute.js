'use strict';

import { useCallback, useEffect, useState } from 'react';

/**
 * Replaces FA/js/router.js. The FA portal is the one page in the app that was
 * already a SPA, and its six views live at `fa-dashboard.html#/dashboard` …
 * `#/receipts`, with an optional admission id as a third segment
 * (`#/ledger/42`). DEC-2 keeps those URLs exactly, so this is a hash listener
 * rather than a nested router - a HashRouter inside the BrowserRouter would
 * fight over `location`.
 */
export function parseHashRoute(rawHashInput) {
  const rawHash = rawHashInput || '#/dashboard';
  const parts = rawHash.split('/');
  const mainRoute = parts.slice(0, 2).join('/');
  const param = parts[2] ? Number(parts[2].split('?')[0]) : null;
  return { rawHash, mainRoute, param };
}

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/dashboard');

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash || '#/dashboard');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /**
   * navigate(hash, admissionId): appends the id to the hash unless it is
   * already there, same as the legacy router. The caller sets
   * currentAdmissionId; here we only move the URL.
   */
  const navigate = useCallback((target, admissionId = null) => {
    let targetHash = target;
    if (admissionId && !targetHash.includes('/' + admissionId)) {
      targetHash = target + '/' + admissionId;
    }
    if (window.location.hash === targetHash) {
      // Same hash means no hashchange event, so nudge state directly.
      setHash(targetHash);
      return;
    }
    window.location.hash = targetHash;
  }, []);

  return { ...parseHashRoute(hash), navigate, setHash };
}

