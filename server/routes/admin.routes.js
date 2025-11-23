const express = require('express');
const router = express.Router();
const { getUsers, updateUser, getAllBookings, deleteAllBookings, deleteBookingsByYear } = require('../controllers/admin.controller');
const { getSchedule, setSchedule, saveScheduleByYear } = require('../controllers/schedule.controller');
const { updateSetting } = require('../controllers/setting.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// All routes in this file are protected and for admins only
router.use(auth, admin);

// ----- User Management Routes -----
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);

// ----- Schedule Management Routes -----
router.get('/schedule', getSchedule);
router.post('/schedule', setSchedule);
router.post('/schedule/year/:year', saveScheduleByYear);

// ----- Booking Management Routes -----
router.get('/bookings', getAllBookings);
router.delete('/bookings/all', deleteAllBookings);
router.delete('/bookings/year/:year', deleteBookingsByYear);

// ----- Settings Management Routes -----
router.post('/settings', updateSetting);

module.exports = router;