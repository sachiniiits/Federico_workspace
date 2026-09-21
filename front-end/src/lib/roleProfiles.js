'use strict';

/**
 * Actor profiles and demo credentials, lifted from shared/rbac.js.
 *
 * `FA.accessRole` is the legacy label "ADMIN" and is deliberately distinct from
 * the Admin actor's "ORG_ADMIN", so the two can never collide in an
 * authorize(['ADMIN', ...]) check. Do not "harmonise" these strings.
 */
export const actorProfiles = {
  Admin: {
    actor: 'Admin',
    accessRole: 'ORG_ADMIN',
    label: 'Admin',
    modules: [
      'ADMIN',
      'ANALYTICS',
      'ADMISSIONS',
      'INVENTORY',
      'DOCTOR',
      'PATIENT',
      'BILLING',
      'APPOINTMENTS',
      'INSURANCE',
      'LEADERSHIP',
    ],
  },
  Patient: { actor: 'Patient', accessRole: 'PATIENT', label: 'Patient', modules: ['PATIENT'] },
  PRE: { actor: 'PRE', accessRole: 'OPERATIONS', label: 'PRE Operator', modules: ['PRE'] },
  HOM: {
    actor: 'HOM',
    accessRole: 'SUPER_USER',
    label: 'Super User',
    modules: ['HOM', 'FA', 'PRE', 'PATIENT'],
  },
  FA: { actor: 'FA', accessRole: 'ADMIN', label: 'Admin', modules: ['FA'] },
};

/**
 * Demo credentials for the login page's helper panel, keyed by organization_id
 * because a role's demo login differs by which hospital is selected.
 */
export const mockAccountsByOrg = {
  1: {
    Admin: [{ email: 'owner@hosp.com', password: 'Owner@123', displayName: 'Hospital Owner' }],
    Patient: [
      { email: 'arjun.k@hosp.com', password: 'Hamiz@123', displayName: 'Arjun Kapoor' },
      { email: 'priyanka.n@hosp.com', password: 'Salma@123', displayName: 'Priyanka Nair' },
      { email: 'rohan.m@hosp.com', password: 'John@123', displayName: 'Rohan Mehta' },
    ],
    PRE: [
      { email: 'rekha.pre@hosp.com', password: 'Pre@123', displayName: 'Rekha Nair' },
      {
        email: 'billing.assist@hosp.com',
        password: 'Assist@123',
        displayName: 'Billing Assist (custom-role demo)',
      },
    ],
    HOM: [{ email: 'admin@hosp.com', password: 'Hom@123', displayName: 'Admin User' }],
    FA: [{ email: 'farah.fa@hosp.com', password: 'Fa@123', displayName: 'Farah Ansari' }],
  },
  2: {
    Admin: [
      { email: 'owner@apollo.hosp.com', password: 'Apollo@123', displayName: 'Apollo Owner' },
    ],
    Patient: [
      { email: 'meera@apollo.hosp.com', password: 'Apollo@123', displayName: 'Meera Subramaniam' },
    ],
    PRE: [
      { email: 'priya.pre@apollo.hosp.com', password: 'Apollo@123', displayName: 'Priya Krishnan' },
    ],
    HOM: [{ email: 'admin@apollo.hosp.com', password: 'Apollo@123', displayName: 'Apollo Admin' }],
    FA: [{ email: 'rajesh.fa@apollo.hosp.com', password: 'Apollo@123', displayName: 'Rajesh Iyer' }],
  },
};

/**
 * Falls back to organization 1's accounts for an org the panel doesn't know
 * (e.g. a freshly provisioned one), showing the shape rather than nothing.
 * Returns null for a known-but-unlisted org id, which the login page renders as
 * its "no pre-configured demo users" message.
 */
export function mockAccountsFor(organizationId) {
  if (!organizationId) return mockAccountsByOrg[1];
  return mockAccountsByOrg[organizationId] || null;
}

export function getProfile(actor) {
  return actorProfiles[actor] || null;
}

/** Actor -> portal access check (RBAC), distinct from org module entitlement. */
export function hasModuleAccess(moduleName, actor) {
  const profile = getProfile(actor);
  return Boolean(profile && profile.modules.includes(moduleName));
}

