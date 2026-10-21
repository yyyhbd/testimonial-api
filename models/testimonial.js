const mongoose = require('mongoose');
const { TESTIMONIAL_STATUSES, SHARE_CHANNELS, EMAIL_REGEX } = require('../lib/constants');

const testimonialSchema = new mongoose.Schema(
  {
    testimonialId: {
      type: String,
      required: [true, 'testimonialId is required'],
      unique: true,
    },
    userId: {
      type: Number,
      required: [true, 'userId is required'],
    },
    customerName: {
      type: String,
      required: [true, 'customerName is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Invalid customerEmail format'],
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, 'rating must be at least 1'],
      max: [5, 'rating must be at most 5'],
    },
    text: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: { values: TESTIMONIAL_STATUSES, message: 'status must be one of: ' + TESTIMONIAL_STATUSES.join(', ') },
      default: 'draft',
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    sharedAt: {
      type: Date,
    },
    sharedChannels: {
      type: [{ type: String, enum: { values: SHARE_CHANNELS, message: 'channel must be one of: ' + SHARE_CHANNELS.join(', ') } }],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

testimonialSchema.index({ userId: 1 });
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
