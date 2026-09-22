'use strict';

import { useSession } from '../../auth/useSession.js';
import { moduleLabel, MODULE_UNAVAILABLE_BODY } from '../../lib/entitlements.js';
import { alert } from '../feedback/feedback.js';
import './ModuleLock.css';

/**
 * Replaces shared/rbac.js#lockElement / applyModuleLocks.
 *
 * The legacy version walked the DOM for [data-requires-module], greyed matching
 * elements, attached a capturing click listener and overwrote any inline
 * onclick with "return false;". Here a component wraps the thing being gated
 * and simply doesn't let the click through.
 *
 * `mode="hide"` mirrors the old data-lock-mode="hide" opt-in.
 */
export function showModuleUnavailable(moduleCode) {
  alert({ title: 'Module Not Available', body: MODULE_UNAVAILABLE_BODY });
  return false;
}

export default function ModuleLock({ module: moduleCode, mode = 'lock', children, className = '' }) {
  const { hasModule } = useSession();

  if (!moduleCode || hasModule(moduleCode)) return children;
  if (mode === 'hide') return null;

  return (
    <span
      className={['module-locked', className].filter(Boolean).join(' ')}
      aria-disabled="true"
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showModuleUnavailable(moduleCode);
      }}
    >
      {children}
    </span>
  );
}

/** Convenience for nav links, which are the overwhelming majority of lock sites. */
export function useModuleLabel() {
  return moduleLabel;
}

