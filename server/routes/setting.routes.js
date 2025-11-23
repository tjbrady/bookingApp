const express = require('express');
const router = express.Router();
const { getSetting } = require('../controllers/setting.controller');

// @route   GET /api/settings/:key
// @desc    Get a public setting by its key
router.get('/:key', getSetting);

module.exports = router;
