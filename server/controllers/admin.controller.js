const User = require('../models/user.model');
const Booking = require('../models/booking.model');

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

module.exports = {
  getUsers,
  updateUser,
  getAllBookings,
  deleteAllBookings,
  deleteBookingsByYear,
};