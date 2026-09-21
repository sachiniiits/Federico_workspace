'use strict';

import { request } from '../client.js';

export const rbac = {
  roles() {
    return request('GET', '/rbac/roles');
  },
  createRole(payload) {
    return request('POST', '/rbac/roles', payload);
  },
  permissions() {
    return request('GET', '/rbac/permissions');
  },
  permissionsForRole(roleId) {
    return request('GET', '/rbac/roles/' + roleId + '/permissions');
  },
  assignPermission(roleId, permissionId) {
    return request('POST', '/rbac/roles/' + roleId + '/permissions', {
      permission_id: permissionId,
    });
  },
  unassignPermission(roleId, permissionId) {
    return request('DELETE', '/rbac/roles/' + roleId + '/permissions/' + permissionId);
  },
  assignStaffRole(userId, customRoleId) {
    return request('POST', '/rbac/staff/' + userId + '/role', { custom_role_id: customRoleId });
  },
  unassignStaffRole(userId, customRoleId) {
    return request('DELETE', '/rbac/staff/' + userId + '/role/' + customRoleId);
  },
  staff() {
    return request('GET', '/rbac/staff');
  },
  createStaff(payload) {
    return request('POST', '/rbac/staff', payload);
  },
  setStaffActive(userId, isActive) {
    return request('PUT', '/rbac/staff/' + userId + '/active', { is_active: isActive });
  },
};

