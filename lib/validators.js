const {
  EMAIL_REGEX,
  STATUS_TRANSITIONS,
  SHARE_CHANNELS,
  DEFAULTS,
} = require('./constants');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_REGEX.test(value.trim());

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isValidTransition = (from, to) =>
  Array.isArray(STATUS_TRANSITIONS[from]) && STATUS_TRANSITIONS[from].includes(to);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
  const page = query.page === undefined ? DEFAULTS.PAGE : Number(query.page);
  const limit = query.limit === undefined ? DEFAULTS.LIMIT : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    return { error: 'page must be a positive integer' };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > DEFAULTS.MAX_LIMIT) {
    return { error: `limit must be an integer between 1 and ${DEFAULTS.MAX_LIMIT}` };
  }

  return { page, limit };
};

const parseDateParam = (value, name, { endOfDay = false } = {}) => {
  if (value === undefined) {
    return { value: null };
  }

  const date = typeof value === 'string' ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) {
    return { error: `${name} must be a valid ISO date string` };
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return { value: date };
};

const parseNumberParam = (value, name) => {
  if (value === undefined) {
    return { value: null };
  }

  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isFinite(number) || number < 1 || number > 5) {
    return { error: `${name} must be a number between 1 and 5` };
  }

  return { value: number };
};

const validateTestimonialInput = (body, { requireName }) => {
  const errors = [];
  const values = {};

  if (requireName || body.customerName !== undefined) {
    if (!isNonEmptyString(body.customerName)) {
      errors.push('customerName is required and must be a non-empty string');
    } else {
      values.customerName = body.customerName.trim();
    }
  }

  ['customerPhone', 'text'].forEach((field) => {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        errors.push(`${field} must be a string`);
      } else {
        values[field] = body[field].trim();
      }
    }
  });

  if (body.customerEmail !== undefined) {
    if (!isValidEmail(body.customerEmail)) {
      errors.push('customerEmail must be a valid email address');
    } else {
      values.customerEmail = body.customerEmail.trim();
    }
  }

  if (body.videoUrl !== undefined) {
    if (typeof body.videoUrl !== 'string' || !isValidUrl(body.videoUrl.trim())) {
      errors.push('videoUrl must be a valid http(s) URL');
    } else {
      values.videoUrl = body.videoUrl.trim();
    }
  }

  if (body.rating !== undefined) {
    if (typeof body.rating !== 'number' || !Number.isFinite(body.rating) || body.rating < 1 || body.rating > 5) {
      errors.push('rating must be a number between 1 and 5');
    } else {
      values.rating = body.rating;
    }
  }

  if (body.consentGiven !== undefined) {
    if (typeof body.consentGiven !== 'boolean') {
      errors.push('consentGiven must be a boolean');
    } else {
      values.consentGiven = body.consentGiven;
    }
  }

  return { errors, values };
};

const validateSettingsInput = (body) => {
  const errors = [];
  const updates = {};

  if (body.isEnabled !== undefined) {
    if (typeof body.isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean');
    } else {
      updates.isEnabled = body.isEnabled;
    }
  }

  if (body.defaultVideoLength !== undefined) {
    if (!isPositiveInteger(body.defaultVideoLength)) {
      errors.push('defaultVideoLength must be a positive integer (seconds)');
    } else {
      updates.defaultVideoLength = body.defaultVideoLength;
    }
  }

  if (body.videoLengthOptions !== undefined) {
    if (
      !Array.isArray(body.videoLengthOptions) ||
      body.videoLengthOptions.length === 0 ||
      !body.videoLengthOptions.every(isPositiveInteger)
    ) {
      errors.push('videoLengthOptions must be a non-empty array of positive integers');
    } else {
      updates.videoLengthOptions = body.videoLengthOptions;
    }
  }

  if (body.questionnaire !== undefined) {
    if (!Array.isArray(body.questionnaire) || !body.questionnaire.every(isNonEmptyString)) {
      errors.push('questionnaire must be an array of non-empty strings');
    } else {
      updates.questionnaire = body.questionnaire.map((question) => question.trim());
    }
  }

  if (body.sendingOptions !== undefined) {
    if (
      !Array.isArray(body.sendingOptions) ||
      !body.sendingOptions.every((option) => SHARE_CHANNELS.includes(option))
    ) {
      errors.push(`sendingOptions must be an array with values from: ${SHARE_CHANNELS.join(', ')}`);
    } else {
      updates.sendingOptions = [...new Set(body.sendingOptions)];
    }
  }

  if (body.thankYouMessage !== undefined) {
    if (!isNonEmptyString(body.thankYouMessage)) {
      errors.push('thankYouMessage must be a non-empty string');
    } else {
      updates.thankYouMessage = body.thankYouMessage.trim();
    }
  }

  if (body.contactConsent !== undefined) {
    if (!isPlainObject(body.contactConsent)) {
      errors.push('contactConsent must be an object');
    } else {
      if (body.contactConsent.enabled !== undefined) {
        if (typeof body.contactConsent.enabled !== 'boolean') {
          errors.push('contactConsent.enabled must be a boolean');
        } else {
          updates['contactConsent.enabled'] = body.contactConsent.enabled;
        }
      }
      if (body.contactConsent.text !== undefined) {
        if (!isNonEmptyString(body.contactConsent.text)) {
          errors.push('contactConsent.text must be a non-empty string');
        } else {
          updates['contactConsent.text'] = body.contactConsent.text.trim();
        }
      }
    }
  }

  if (
    updates.defaultVideoLength !== undefined &&
    updates.videoLengthOptions !== undefined &&
    !updates.videoLengthOptions.includes(updates.defaultVideoLength)
  ) {
    errors.push('defaultVideoLength must be one of videoLengthOptions');
  }

  return { errors, updates };
};

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidTransition,
  escapeRegex,
  parsePagination,
  parseDateParam,
  parseNumberParam,
  validateTestimonialInput,
  validateSettingsInput,
};
