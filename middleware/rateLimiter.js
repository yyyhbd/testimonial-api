const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../lib/constants');
const { failure } = require('../lib/response');

const createLimiter = ({ windowMs, limit }, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => failure(res, 429, message),
  });

const loginLimiter = createLimiter(RATE_LIMITS.LOGIN, 'Too many login attempts. Please try again in a minute');
const registerLimiter = createLimiter(RATE_LIMITS.REGISTER, 'Too many registration attempts. Please try again in a minute');

module.exports = { loginLimiter, registerLimiter };
