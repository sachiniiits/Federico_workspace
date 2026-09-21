'use strict';

import { Outlet } from 'react-router-dom';

/* Placeholder - replaced in this portal's phase. */
export default function PatientLayout() {
  return (
    <>
      <header style={{ padding: 16, borderBottom: '1px solid var(--color-border, #ddd)' }}>
        Patient
      </header>
      <Outlet />
    </>
  );
}
