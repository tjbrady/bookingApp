const Notification = require('../models/notification.model');
const PushSubscription = require('../models/pushSubscription.model');

// @desc    Get all unread notifications for the logged-in user
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
      isRead: false,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Ensure the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get VAPID public key
const getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(404).json({ msg: 'VAPID public key is not configured' });
    }
    res.json({ publicKey });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Subscribe device for web push
const subscribeDevice = async (req, res) => {
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ msg: 'Invalid subscription object' });
  }

  try {
    // Upsert subscription record based on user and endpoint
    const updatedSub = await PushSubscription.findOneAndUpdate(
      { user: req.user.id, 'subscription.endpoint': subscription.endpoint },
      { subscription },
      { new: true, upsert: true }
    );
    res.status(201).json(updatedSub);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Unsubscribe device from web push
const unsubscribeDevice = async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ msg: 'Endpoint is required' });
  }

  try {
    await PushSubscription.deleteOne({ user: req.user.id, 'subscription.endpoint': endpoint });
    res.json({ msg: 'Unsubscribed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  getVapidPublicKey,
  subscribeDevice,
  unsubscribeDevice,
};
