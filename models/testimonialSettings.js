const mongoose = require('mongoose');
const { SHARE_CHANNELS } = require('../lib/constants');

const testimonialSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: [true, 'userId is required'],
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    defaultVideoLength: {
      type: Number,
      default: 10,
      min: [1, 'defaultVideoLength must be at least 1 second'],
    },
    videoLengthOptions: {
      type: [Number],
      default: () => [5, 10, 15, 20, 25],
    },
    questionnaire: {
      type: [String],
      default: () => ['What do you like about our service?'],
    },
    sendingOptions: {
      type: [{ type: String, enum: { values: SHARE_CHANNELS, message: 'sendingOptions values must be one of: ' + SHARE_CHANNELS.join(', ') } }],
      default: () => ['email', 'sms'],
    },
    thankYouMessage: {
      type: String,
      default: 'Thank you!',
    },
    contactConsent: {
      enabled: {
        type: Boolean,
        default: true,
      },
      text: {
        type: String,
        default: 'Join our mailing list',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestimonialSettings', testimonialSettingsSchema);
