'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/**
 * These three helpers used to live at front-end/shared/{formatters,sanitizer,
 * insurance}.js as UMD factories, which this suite could `require()` directly.
 * The React migration moved them to front-end/src/lib/ as plain ES modules, so
 * they can no longer be required from this CommonJS suite.
 *
 * Rather than change how the backend runs its tests (jest here has no ESM
 * flag and no babel transform), each module is read and evaluated in a vm
 * context. All three are dependency-free — no imports, only exported function
 * declarations — so stripping the `export` keyword leaves valid script source.
 * The assertions below are unchanged.
 */
function loadEsmModule(relativePath) {
  const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  const exportedNames = [...source.matchAll(/^export\s+(?:function|const|let)\s+([A-Za-z0-9_$]+)/gm)].map(
    (match) => match[1],
  );
  const script = source.replace(/^export\s+/gm, '');
  // The trailing expression is the script's completion value, which gives us
  // the exported bindings whether they were declared with function or const.
  return vm.runInNewContext(`${script}\n;({ ${exportedNames.join(', ')} });`);
}

const LIB = '../../../front-end/src/lib';

describe('Frontend Shared Utilities', () => {
  beforeAll(() => {
    global.window = global;
    window.Formatters = loadEsmModule(`${LIB}/formatters.js`);
    window.Sanitizer = loadEsmModule(`${LIB}/sanitizer.js`);
    window.InsuranceCalc = loadEsmModule(`${LIB}/insurance.js`);
  });

  describe('Formatters', () => {
    it('escapes html properly', () => {
      expect(window.Formatters.escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('formats Indian currency', () => {
      expect(window.Formatters.formatCurrency(5000)).toMatch(/Rs\s*5,000/);
    });

    it('formats age correctly from date of birth', () => {
      const today = new Date();
      const thirtyYearsAgo = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      expect(window.Formatters.formatAge(thirtyYearsAgo.toISOString())).toBe('30');
    });
  });

  describe('Sanitizer', () => {
    it('sanitizes patient fields from records', () => {
      const record = {
        patient_id: 10,
        name: 'Patient Test',
        ledger_id: 801,
        billing_link: 'http://test',
      };
      const sanitized = window.Sanitizer.forRole(record, 'PATIENT');
      expect(sanitized.patient_id).toBe(10);
      expect(sanitized.name).toBe('Patient Test');
      expect(sanitized.ledger_id).toBeUndefined();
      expect(sanitized.billing_link).toBeUndefined();
    });
  });

  describe('Insurance Calculator', () => {
    it('computes patient share and coverage correctly', () => {
      const policy = {
        coverage_limit: 10000,
        copay_percentage: 20,
      };
      const res = window.InsuranceCalc.computePatientShare(5000, policy, ['General Consultation']);
      expect(res.isValid).toBe(true);
      expect(res.coveredAmount).toBe(4000); // 80% of 5000
      expect(res.patientShare).toBe(1000); // 20% of 5000
    });
  });
});
