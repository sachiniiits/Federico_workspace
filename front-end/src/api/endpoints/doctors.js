'use strict';

import { request } from '../client.js';
import { withNormalizedPhones } from '../../lib/phone.js';

export const doctors = {
  list() {
    return request('GET', '/doctor');
  },
  create(payload) {
    return request('POST', '/doctor', withNormalizedPhones(payload, ['phone']));
  },
  update(id, patch) {
    return request('PUT', '/doctor/' + id, patch);
  },
  remove(id) {
    return request('DELETE', '/doctor/' + id);
  },
  availabilityAll() {
    return request('GET', '/doctor/availability/all');
  },
  availabilityForDoctor(id) {
    return request('GET', '/doctor/' + id + '/availability');
  },
};

