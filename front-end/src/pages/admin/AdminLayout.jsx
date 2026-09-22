'use strict';

import { Outlet } from 'react-router-dom';
import SharedNav from '../../components/layout/SharedNav.jsx';
import { useSession } from '../../auth/useSession.js';
import { usePageStyles } from '../../hooks/usePageStyles.js';
import adminCss from '../../styles/admin/admin.css?inline';

/**
 * Ported from Admin/shared-nav.js. Link order and module gates are unchanged -
 * note that "People" (screen-05) sits before "Roles & Staff" (screen-04).
 */
const LINKS = [
  { href: '/Admin/screen-01-dashboard.html', label: 'Dashboard' },
  { href: '/Admin/screen-02-departments.html', label: 'Departments', module: 'ADMISSIONS' },
  { href: '/Admin/screen-03-inventory.html', label: 'Inventory Catalog', module: 'INVENTORY' },
  { href: '/Admin/screen-05-people.html', label: 'People' },
  { href: '/Admin/screen-04-admin.html', label: 'Roles & Staff' },
];

export default function AdminLayout() {
  usePageStyles(adminCss);
  const { tenant } = useSession();
  return (
    <>
      <SharedNav
        roleName="Admin"
        brandName={tenant?.organization_name || 'Federico'}
        links={LINKS}
      />
      <Outlet />
    </>
  );
}

