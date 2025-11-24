const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const ColorSchedule = require('../models/colorSchedule.model');
const { Parser } = require('json2csv');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error in getUsers:', err.message);
    res.status(500).json({ msg: err.message || 'Server Error fetching users' });
  }
};

// @route   PATCH /api/admin/users/:id
// @desc    Update a user's status and/or role
// @access  Admin
const updateUser = async (req, res) => {
  const { status, role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update status if provided and valid
    if (status) {
      if (!['pending', 'active', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided.' });
      }
      user.status = status;
    }

    // Update role if provided and valid
    if (role) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role provided.' });
      }
      user.role = role;
    }

    await user.save();
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error('Error in updateUser:', err.message);
    res.status(500).json({ msg: err.message || 'Server Error updating user' });
  }
};


// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Admin
  const getAllBookings = async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate('user', 'username email')
        .sort({ createdAt: -1 });
      res.json(bookings);
    } catch (err) {
      console.error('Error in getAllBookings:', err.message);
      res.status(500).json({ msg: err.message || 'Server Error fetching bookings' });
    }
  };

const deleteAllBookings = async (req, res) => {
  try {
    await Booking.deleteMany({});
    res.json({ msg: 'All bookings have been deleted.' });
  } catch (err) {
    console.error('Error in deleteAllBookings:', err.message);
    res.status(500).json({ msg: 'Server Error deleting all bookings' });
  }
};

const deleteBookingsByYear = async (req, res) => {
  const { year } = req.params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) {
    return res.status(400).json({ msg: 'Invalid year provided.' });
  }

  try {
    const startDate = new Date(Date.UTC(yearNum, 0, 1));
    const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));

    await Booking.deleteMany({
      dateFrom: { $gte: startDate, $lte: endDate },
    });

    res.json({ msg: `All bookings for the year ${year} have been deleted.` });
  } catch (err) {
    console.error(`Error in deleteBookingsByYear for year ${year}:`, err.message);
    res.status(500).json({ msg: `Server Error deleting bookings for year ${year}` });
  }
};

// --- Reporting Functions ---

const exportBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'username email').lean();
    const fields = [
      { label: 'Booking ID', value: '_id' },
      { label: 'User ID', value: 'user._id' },
      { label: 'Username', value: 'user.username' },
      { label: 'Email', value: 'user.email' },
      { label: 'From Date', value: 'dateFrom' },
      { label: 'To Date', value: 'dateTo' },
      { label: 'Status', value: 'status' },
      { label: 'Requested At', value: 'createdAt' },
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(bookings);
    res.header('Content-Type', 'text/csv');
    res.attachment('booking_report.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting bookings:', err.message);
    res.status(500).send('Server Error');
  }
};

const exportUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    const fields = ['_id', 'username', 'email', 'role', 'status', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);
    res.header('Content-Type', 'text/csv');
    res.attachment('user_report.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting users:', err.message);
    res.status(500).send('Server Error');
  }
};

const exportScheduleDetail = async (req, res) => {
  try {
    const schedule = await ColorSchedule.find().sort({ startDate: 1 }).lean();
    const fields = ['color', 'startDate', 'endDate'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(schedule);
    res.header('Content-Type', 'text/csv');
    res.attachment('4yr_detail_report.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting schedule detail:', err.message);
    res.status(500).send('Server Error');
  }
};

const exportScheduleSummary = async (req, res) => {
  try {
    const schedule = await ColorSchedule.find().lean();
    const summary = {};

    schedule.forEach(entry => {
      const year = new Date(entry.startDate).getFullYear();
      if (!summary[year]) {
        summary[year] = { year, Blue: 0, Red: 0, Orange: 0, Yellow: 0, Green: 0 };
      }
      if (summary[year][entry.color] !== undefined) {
        // Simple count of blocks
        summary[year][entry.color]++;
      }
    });

    const summaryArray = Object.values(summary).sort((a, b) => a.year - b.year);
    const fields = ['year', 'Blue', 'Red', 'Orange', 'Yellow', 'Green'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(summaryArray);
    res.header('Content-Type', 'text/csv');
    res.attachment('4yr_summary_report.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting schedule summary:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getUsers,
  updateUser,
  getAllBookings,
  deleteAllBookings,
  deleteBookingsByYear,
  exportBookings,
  exportUsers,
  exportScheduleDetail,
  exportScheduleSummary,
};
