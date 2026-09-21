'use strict';

import { useContext } from 'react';
import { SessionContext } from './SessionContext.jsx';

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
