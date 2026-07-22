const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
  getVapidPublicKey,
  subscribeDevice,
  unsubscribeDevice,
} = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

// All routes here are protected
router.use(auth);

// @route   GET /api/notifications
// @desc    Get all unread notifications for the user
router.get('/', getMyNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', markNotificationAsRead);

// @route   GET /api/notifications/vapid-public-key
// @desc    Get VAPID public key
router.get('/vapid-public-key', getVapidPublicKey);

// @route   POST /api/notifications/subscribe
// @desc    Subscribe device for web push
router.post('/subscribe', subscribeDevice);

// @route   POST /api/notifications/unsubscribe
// @desc    Unsubscribe device from web push
router.post('/unsubscribe', unsubscribeDevice);

module.exports = router;
