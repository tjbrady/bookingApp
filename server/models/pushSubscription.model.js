const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
}, {
  timestamps: true,
});

// Avoid duplicate entries of the same device/endpoint subscription for a user
pushSubscriptionSchema.index({ user: 1, 'subscription.endpoint': 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

module.exports = PushSubscription;
