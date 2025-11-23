const ColorSchedule = require('../models/colorSchedule.model');

// @route   GET /api/admin/schedule
// @desc    Get the entire colour schedule
// @access  Admin
const getSchedule = async (req, res) => {
  try {
    const schedule = await ColorSchedule.find().sort({ startDate: 1 });
    res.json(schedule);
  } catch (err) {
    console.error('Error in getSchedule:', err.message);
    res.status(500).json({ msg: err.message || 'Server Error fetching schedule' });
  }
};

// @route   POST /api/admin/schedule
// @desc    Set the entire colour schedule
// @access  Admin
const setSchedule = async (req, res) => {
  const scheduleData = req.body;

  if (!Array.isArray(scheduleData)) {
    return res.status(400).json({ msg: 'Request body must be an array of schedule objects.' });
  }

  try {
    await ColorSchedule.deleteMany({});

    if (scheduleData.length > 0) {
      await ColorSchedule.insertMany(scheduleData);
    }

    res.status(201).json({ msg: 'Schedule has been updated successfully.' });
  } catch (err) {
    console.error('Error in setSchedule:', err.message);
    res.status(500).json({ msg: err.message || 'Server Error setting schedule' });
  }
};

const saveScheduleByYear = async (req, res) => {
  const { year } = req.params;
  const scheduleDataForYear = req.body;
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) {
    return res.status(400).json({ msg: 'Invalid year provided.' });
  }

  if (!Array.isArray(scheduleDataForYear)) {
    return res.status(400).json({ msg: 'Request body must be an array of schedule objects for the year.' });
  }

  try {
    // Define start and end of the year
    const startDate = new Date(Date.UTC(yearNum, 0, 1));
    const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));

    // Delete existing entries for that year
    await ColorSchedule.deleteMany({
      startDate: { $gte: startDate, $lte: endDate },
    });

    // Insert new entries if any are provided
    if (scheduleDataForYear.length > 0) {
      await ColorSchedule.insertMany(scheduleDataForYear);
    }

    res.status(201).json({ msg: `Schedule for year ${year} has been updated successfully.` });
  } catch (err) {
    console.error(`Error in saveScheduleByYear for year ${year}:`, err.message);
    res.status(500).json({ msg: `Server Error setting schedule for year ${year}` });
  }
};

module.exports = {
  getSchedule,
  setSchedule,
  saveScheduleByYear,
};