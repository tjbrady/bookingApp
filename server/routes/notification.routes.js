const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
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

module.exports = router;
