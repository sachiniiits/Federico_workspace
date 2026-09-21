'use strict';

import { Outlet } from 'react-router-dom';
import SharedNav from '../../components/layout/SharedNav.jsx';
import { useSession } from '../../auth/useSession.js';
import '../../styles/hom/global.css';

/** Ported from HOM/shared-nav.js. Same five links, same module gates. */
const LINKS = [
  { href: '/HOM/screen-01-dashboard.html', label: 'Dashboard' },
  { href: '/HOM/screen-02-bed-management.html', label: 'Bed Management', module: 'ADMISSIONS' },
  { href: '/HOM/screen-03-patient-flow.html', label: 'Patient Flow', module: 'ADMISSIONS' },
  { href: '/HOM/screen-04-inventory.html', label: 'Inventory', module: 'INVENTORY' },
  { href: '/HOM/screen-05-billing.html', label: 'Billing', module: 'BILLING' },
];

export default function HomLayout() {
  const { session } = useSession();
  const hospitalName =
    session?.tenant?.hospital_name || session?.tenant?.organization_name || 'City General Hospital';

  return (
    <>
      <SharedNav roleName="HOM" brandName="Federico" hospitalName={hospitalName} links={LINKS} />
      <Outlet />
    </>
  );
}

