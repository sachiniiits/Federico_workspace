'use strict';

import { Outlet } from 'react-router-dom';

/* Placeholder - replaced in this portal's phase. */
export default function AdminLayout() {
  return (
    <>
      <header style={{ padding: 16, borderBottom: '1px solid var(--color-border, #ddd)' }}>
        Admin
      </header>
      <Outlet />
    </>
  );
}
