const express = require('express');
const router = express.Router();
const { getSchedule } = require('../controllers/schedule.controller');

// This is a public route for any logged-in user to see the schedule
// The controller function is the same one the admin uses, but the route is public
router.get('/', getSchedule);

module.exports = router;
