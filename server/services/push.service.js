const webpush = require('web-push');
const PushSubscription = require('../models/pushSubscription.model');

// Initialize Web Push with VAPID keys from environment variables
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@yourdomain.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not configured. Push notifications are disabled.');
}

/**
 * Sends a push notification to all stored device subscriptions of a specific user.
 * @param {string} userId - ID of the target user
 * @param {object} payload - Notification payload { title, body, url }
 */
const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify(payload);

    const sendPromises = subscriptions.map((sub) => {
      return webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(async (err) => {
          // Status 410 (Gone) or 404 (Not Found) indicates expired or unregistered subscription
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Removing expired push subscription: ${sub._id}`);
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error(`Error sending push to subscription ${sub._id}:`, err.message);
          }
        });
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error(`Error sending push notification batch to user ${userId}:`, err.message);
  }
};

module.exports = {
  sendPushNotification,
};
