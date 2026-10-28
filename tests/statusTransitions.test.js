const { isValidTransition } = require('../lib/validators');
const { TESTIMONIAL_STATUSES } = require('../lib/constants');

describe('isValidTransition', () => {
  const allowed = [
    ['draft', 'recording'],
    ['recording', 'processing'],
    ['processing', 'completed'],
    ['completed', 'shared'],
  ];

  test.each(allowed)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(true);
  });

  test('rejects every other transition', () => {
    TESTIMONIAL_STATUSES.forEach((from) => {
      TESTIMONIAL_STATUSES.forEach((to) => {
        const isAllowed = allowed.some(([a, b]) => a === from && b === to);
        expect(isValidTransition(from, to)).toBe(isAllowed);
      });
    });
  });

  test('rejects skipping steps', () => {
    expect(isValidTransition('draft', 'completed')).toBe(false);
  });

  test('rejects going backwards', () => {
    expect(isValidTransition('completed', 'draft')).toBe(false);
  });

  test('shared is a terminal status', () => {
    expect(isValidTransition('shared', 'completed')).toBe(false);
  });

  test('rejects unknown statuses', () => {
    expect(isValidTransition('unknown', 'draft')).toBe(false);
    expect(isValidTransition('draft', 'unknown')).toBe(false);
  });
});
