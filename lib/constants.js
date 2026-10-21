const TESTIMONIAL_STATUSES = ['draft', 'recording', 'processing', 'completed', 'shared'];

const STATUS_TRANSITIONS = {
  draft: ['recording'],
  recording: ['processing'],
  processing: ['completed'],
  completed: ['shared'],
  shared: [],
};

const SHARE_CHANNELS = ['email', 'sms', 'facebook', 'instagram'];

const USER_ROLES = ['owner', 'staff'];

const SORT_FIELDS = ['createdAt', 'updatedAt', 'customerName', 'rating', 'status'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SALT_ROUNDS = 10;

const MIN_PASSWORD_LENGTH = 8;

const DEFAULTS = {
  PORT: 3000,
  JWT_EXPIRY: '7d',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/testimonial_api',
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  MAX_BULK_IDS: 100,
};

const RATE_LIMITS = {
  LOGIN: { windowMs: 60 * 1000, limit: 5 },
  REGISTER: { windowMs: 60 * 1000, limit: 10 },
};

module.exports = {
  TESTIMONIAL_STATUSES,
  STATUS_TRANSITIONS,
  SHARE_CHANNELS,
  USER_ROLES,
  SORT_FIELDS,
  EMAIL_REGEX,
  SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  DEFAULTS,
  RATE_LIMITS,
};
