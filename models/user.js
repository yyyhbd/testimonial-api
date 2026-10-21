const mongoose = require('mongoose');
const { USER_ROLES, EMAIL_REGEX } = require('../lib/constants');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: [true, 'userId is required'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    businessName: {
      type: String,
      required: [true, 'businessName is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: { values: USER_ROLES, message: 'role must be one of: ' + USER_ROLES.join(', ') },
      default: 'owner',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
