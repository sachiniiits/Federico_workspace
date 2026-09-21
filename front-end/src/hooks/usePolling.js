'use strict';

import { useEffect, useRef } from 'react';

/**
 * The HOM portal's refresh behaviour, ported exactly: every `intervalMs` run
 * the callback unless the tab is hidden, and run it again whenever the window
 * regains focus.
 *
 * Five HOM pages do this at 15s with 6-8 parallel requests each. That is
 * observable behaviour, so it is preserved verbatim rather than optimised
 * (DEC-10).
 */
export function usePolling(callback, intervalMs = 15000) {
  const savedRef = useRef(callback);
  savedRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) savedRef.current();
    }, intervalMs);

    const onFocus = () => savedRef.current();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs]);
}

