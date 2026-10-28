const {
  isValidEmail,
  parsePagination,
  parseDateParam,
  validateTestimonialInput,
  validateSettingsInput,
} = require('../lib/validators');

describe('isValidEmail', () => {
  test('accepts valid and rejects invalid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('user example@x.com')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('parsePagination', () => {
  test('uses defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10 });
  });

  test('rejects invalid values', () => {
    expect(parsePagination({ page: '0' }).error).toBeDefined();
    expect(parsePagination({ limit: '1000' }).error).toBeDefined();
    expect(parsePagination({ limit: 'abc' }).error).toBeDefined();
  });
});

describe('parseDateParam', () => {
  test('moves a date-only endDate to the end of the day', () => {
    const { value } = parseDateParam('2025-12-31', 'endDate', { endOfDay: true });
    expect(value.toISOString()).toBe('2025-12-31T23:59:59.999Z');
  });

  test('rejects garbage', () => {
    expect(parseDateParam('nope', 'startDate').error).toBeDefined();
  });
});

describe('validateTestimonialInput', () => {
  test('requires customerName on create', () => {
    expect(validateTestimonialInput({}, { requireName: true }).errors).toHaveLength(1);
  });

  test('rejects rating out of range', () => {
    expect(validateTestimonialInput({ customerName: 'A', rating: 6 }, { requireName: true }).errors).toHaveLength(1);
    expect(validateTestimonialInput({ customerName: 'A', rating: 0 }, { requireName: true }).errors).toHaveLength(1);
  });

  test('ignores fields that must not be edited by the client', () => {
    const { values } = validateTestimonialInput(
      { customerName: 'A', userId: 99, status: 'shared', isDeleted: true },
      { requireName: true }
    );
    expect(values).toEqual({ customerName: 'A' });
  });
});

describe('validateSettingsInput', () => {
  test('keeps only provided fields', () => {
    const { errors, updates } = validateSettingsInput({ isEnabled: true });
    expect(errors).toHaveLength(0);
    expect(updates).toEqual({ isEnabled: true });
  });

  test('rejects unknown sending channels', () => {
    expect(validateSettingsInput({ sendingOptions: ['pigeon'] }).errors).toHaveLength(1);
  });

  test('supports partial contactConsent updates', () => {
    const { updates } = validateSettingsInput({ contactConsent: { enabled: false } });
    expect(updates).toEqual({ 'contactConsent.enabled': false });
  });
});
