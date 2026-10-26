const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { success, failure, handleError } = require('../lib/response');
const { isNonEmptyString, isValidEmail } = require('../lib/validators');
const { SALT_ROUNDS, MIN_PASSWORD_LENGTH, DEFAULTS } = require('../lib/constants');

const MAX_USER_ID_ATTEMPTS = 5;

const signToken = (user) =>
  jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || DEFAULTS.JWT_EXPIRY,
  });

const toPublicUser = (user) => ({
  userId: user.userId,
  email: user.email,
  businessName: user.businessName,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getNextUserId = async () => {
  const lastUser = await User.findOne().sort({ userId: -1 }).select('userId').lean();
  return lastUser ? lastUser.userId + 1 : 1;
};

const createUserWithNextId = async (data) => {
  for (let attempt = 1; attempt <= MAX_USER_ID_ATTEMPTS; attempt += 1) {
    try {
      const userId = await getNextUserId();
      return await User.create({ ...data, userId });
    } catch (err) {
      const isUserIdConflict = err.code === 11000 && err.keyPattern && err.keyPattern.userId;
      if (!isUserIdConflict || attempt === MAX_USER_ID_ATTEMPTS) {
        throw err;
      }
    }
  }
  return null;
};

const register = async (req, res) => {
  try {
    const { email, password, businessName } = req.body || {};
    const errors = [];

    if (email === undefined) {
      errors.push('email is required');
    } else if (!isValidEmail(email)) {
      errors.push('email must be a valid email address');
    }

    if (password === undefined) {
      errors.push('password is required');
    } else if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`password must be a string of at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    if (businessName === undefined) {
      errors.push('businessName is required');
    } else if (!isNonEmptyString(businessName)) {
      errors.push('businessName must be a non-empty string');
    }

    if (errors.length) {
      return failure(res, 400, errors.join('; '));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return failure(res, 400, 'Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await createUserWithNextId({
      email: normalizedEmail,
      password: hashedPassword,
      businessName: businessName.trim(),
    });

    return success(res, 201, 'User registered successfully', {
      user: toPublicUser(user),
      token: signToken(user),
    });
  } catch (err) {
    return handleError(res, err, 'auth.register');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      return failure(res, 400, 'A valid email and a password are required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return failure(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return failure(res, 403, 'Account is deactivated');
    }

    return success(res, 200, 'Login successful', {
      user: toPublicUser(user),
      token: signToken(user),
    });
  } catch (err) {
    return handleError(res, err, 'auth.login');
  }
};

module.exports = { register, login };
