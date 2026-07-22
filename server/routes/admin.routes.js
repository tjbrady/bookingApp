const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  updateUser, 
  deleteUser,
  getAllBookings, 
  deleteAllBookings, 
  deleteBookingsByYear,
  exportBookings,
  exportUsers,
  exportScheduleSummary,
  exportScheduleDetail,
  getEmailStatus,
  getProjectSummary,
  sendTestEmail,
  sendTestPush
} = require('../controllers/admin.controller');
const { getSchedule, setSchedule, saveScheduleByYear } = require('../controllers/schedule.controller');
const { updateSetting } = require('../controllers/setting.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// All routes in this file are protected and for admins only
router.use(auth, admin);

// ----- Report Routes -----
router.get('/reports/bookings', exportBookings);
router.get('/reports/users', exportUsers);
router.get('/reports/schedule-summary', exportScheduleSummary);
router.get('/reports/schedule-detail', exportScheduleDetail);

// ----- Status Routes -----
router.get('/email-status', getEmailStatus);
router.get('/project-summary', getProjectSummary);
router.post('/test-email', sendTestEmail);
router.post('/test-push', sendTestPush);

// ----- User Management Routes -----
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

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