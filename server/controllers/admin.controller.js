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



  // Prevent admin from modifying their own account status/role to avoid lockout

  if (req.params.id === req.user.id) {

    return res.status(403).json({ msg: 'Action Forbidden: You cannot modify your own account privileges.' });

  }



  try {

    const user = await User.findById(req.params.id);

    if (!user) {

      return res.status(404).json({ msg: 'User not found' });

    }



    // Protect the Super Admin account

    if (user.email === 'bradytj@gmail.com') {

        return res.status(403).json({ msg: 'Action Forbidden: This Super Admin account cannot be modified.' });

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



// @route   DELETE /api/admin/users/:id

// @desc    Delete a user and their associated bookings

// @access  Admin

const deleteUser = async (req, res) => {

  try {

    const userId = req.params.id;

    

    // Prevent admin from deleting their own account

    if (userId === req.user.id) {

        return res.status(403).json({ msg: 'Action Forbidden: You cannot delete your own account.' });

    }



    const user = await User.findById(userId);



    if (!user) {

      return res.status(404).json({ msg: 'User not found' });

    }



    // Protect the Super Admin account

    if (user.email === 'bradytj@gmail.com') {

        return res.status(403).json({ msg: 'Action Forbidden: This Super Admin account cannot be deleted.' });

    }



    // Delete associated bookings first

    await Booking.deleteMany({ user: userId });



    // Delete the user

    await User.findByIdAndDelete(userId);



    res.json({ msg: 'User and associated bookings deleted' });

  } catch (err) {

    console.error('Error in deleteUser:', err.message);

    res.status(500).json({ msg: 'Server Error deleting user' });

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

    // Format the dates before converting to CSV
    const formattedSchedule = schedule.map(entry => ({
      ...entry,
      startDate: entry.startDate.toISOString().split('T')[0],
      endDate: entry.endDate.toISOString().split('T')[0],
    }));

    const fields = [
        { label: 'colour', value: 'color' },
        { label: 'startDate', value: 'startDate' },
        { label: 'endDate', value: 'endDate' }
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedSchedule);
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
    const years = [2026, 2027, 2028, 2029];
    const colors = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];
    
    const summary = {};
    colors.forEach(color => {
      summary[color] = { Colour: color, '2026': 0, '2027': 0, '2028': 0, '2029': 0 };
    });

    const totals = { Colour: 'Totals', '2026': 0, '2027': 0, '2028': 0, '2029': 0 };

    schedule.forEach(entry => {
      const year = new Date(entry.startDate).getUTCFullYear();
      if (colors.includes(entry.color) && years.includes(year)) {
        // Use iterative counting to match frontend logic and avoid rounding errors
        let weekCount = 0;
        let currentDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);
        while(currentDate <= endDate) {
            if (currentDate.getUTCFullYear() === year) {
                weekCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        }

        summary[entry.color][year] += weekCount;
        totals[year] += weekCount;
      }
    });

    const summaryArray = [...Object.values(summary), totals];
    const fields = ['Colour', '2026', '2027', '2028', '2029'];
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

const getEmailStatus = async (req, res) => {
  try {
    const requiredVars = [
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET',
      'GMAIL_REFRESH_TOKEN',
      'EMAIL_FROM'
    ];
    
    const status = {
      configured: true,
      missingVars: [],
      details: {}
    };

    requiredVars.forEach(v => {
      if (!process.env[v]) {
        status.configured = false;
        status.missingVars.push(v);
      } else {
        // Just return the first few chars for verification if it exists
        status.details[v] = process.env[v].substring(0, 5) + '...';
      }
    });

    res.json(status);
  } catch (err) {
    console.error('Error checking email status:', err.message);
    res.status(500).json({ msg: 'Error checking email status' });
  }
};

const sendTestEmail = async (req, res) => {
  const { recipientEmail } = req.body;
  const sendEmail = require('../services/email.service');
  
  if (!recipientEmail) {
    return res.status(400).json({ msg: 'Recipient email is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    const adminName = user ? user.username : 'Admin';

    const subject = 'Test Email from Booking App';
    const text = `Hello, this is a test email sent by ${adminName} to confirm the Gmail API configuration is working correctly!`;
    const html = `<p>Hello,</p><p>This is a test email sent by <strong>${adminName}</strong> to confirm the <strong>Gmail API configuration</strong> is working correctly!</p>`;

    const result = await sendEmail(recipientEmail, subject, text, html);
    
    if (result && result.id) {
      res.json({ msg: `Test email sent successfully to ${recipientEmail}!`, id: result.id });
    } else {
      res.status(500).json({ msg: 'Failed to send test email. Check server logs.' });
    }
  } catch (err) {
    console.error('Error sending test email:', err.message);
    // Provide a more descriptive error back to the frontend
    const errorMsg = err.response?.data?.error_description || err.message || 'Error sending test email';
    res.status(500).json({ msg: 'Email error: ' + errorMsg });
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  deleteAllBookings,
  deleteBookingsByYear,
  exportBookings,
  exportUsers,
  exportScheduleDetail,
  exportScheduleSummary,
  getEmailStatus,
  sendTestEmail,
};