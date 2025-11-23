const express = require('express');
const router = express.Router();
const {
  getMyBookings,
  getPublicBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/booking.controller');
const auth = require('../middleware/auth.middleware');

// Public route to get all confirmed bookings
router.get('/public', getPublicBookings);

// Protected routes
router.get('/', auth, getMyBookings);
router.post('/', auth, createBooking);
router.put('/:id', auth, updateBooking);
router.delete('/:id', auth, deleteBooking);

module.exports = router;