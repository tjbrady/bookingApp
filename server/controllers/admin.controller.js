const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const ColorSchedule = require('../models/colorSchedule.model');
const { Parser } = require('json2csv');
const { getBaseTemplate } = require('../utils/emailTemplates');

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
// @desc    Update a user's status, role, permissions, or colour scopes
// @access  Admin/SU
const updateUser = async (req, res) => {
  const { status, role, permissions, managedColours, allowedBookableColours } = req.body;

  // Prevent admin from modifying their own account status/role to avoid lockout
  if (req.params.id === req.user.id) {
    return res.status(403).json({ msg: 'Action Forbidden: You cannot modify your own account privileges.' });
  }

  // Only SUs are allowed to modify permissions or scopes
  if (permissions || managedColours || allowedBookableColours) {
    if (req.user.role !== 'SU') {
      return res.status(403).json({ msg: 'Action Forbidden: Only Super Users (SU) can configure granular permissions or scopes.' });
    }
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Protect SU accounts from modification by non-SUs, and ensure the specific Super Admin email is protected
    if ((user.role === 'SU' && req.user.role !== 'SU') || user.email === 'bradytj@gmail.com') {
        return res.status(403).json({ msg: 'Action Forbidden: Super User accounts cannot be modified by non-SUs.' });
    }

    // Update status if provided and valid
    if (status) {
      if (!['pending', 'active', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided.' });
      }
      const originalStatus = user.status;
      user.status = status;

      // Email notification for status change
      if (originalStatus !== status && (status === 'active' || status === 'rejected')) {
        const sendEmail = require('../services/email.service');
        const subject = status === 'active' ? 'Account Approved' : 'Account Rejected/Revoked';
        const text = status === 'active' 
          ? `Hello ${user.username}, your account for the Booking App has been approved! You can now log in and request bookings.`
          : `Hello ${user.username}, your account access for the Booking App has been rejected or revoked.`;
        const html = getBaseTemplate(
          status === 'active' ? 'Account Approved' : 'Account Update',
          status === 'active'
            ? `<p>Hello <strong>${user.username}</strong>,</p><p>Your account for the Booking App has been <strong>approved</strong>!</p><p>You can now start requesting bookings.</p>`
            : `<p>Hello <strong>${user.username}</strong>,</p><p>Your account access for the Booking App has been <strong>rejected or revoked</strong>.</p>`,
          status === 'active' ? 'http://bookingapp-static.onrender.com/login' : null,
          status === 'active' ? 'Login Now' : null
        );

        try {          await sendEmail(user.email, subject, text, html);
        } catch (err) {
          console.error('Failed to send user status email:', err.message);
        }
      }
    }

    // Update role if provided and valid
    if (role) {
      if (!['user', 'admin', 'SU'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role provided.' });
      }
      user.role = role;
    }

    // Update granular permissions if provided and valid
    if (permissions) {
      if (typeof permissions.canEditApprovedBookings === 'boolean') {
        user.permissions.canEditApprovedBookings = permissions.canEditApprovedBookings;
      }
      if (typeof permissions.canDeleteUsers === 'boolean') {
        user.permissions.canDeleteUsers = permissions.canDeleteUsers;
      }
      if (typeof permissions.canClearSchedules === 'boolean') {
        user.permissions.canClearSchedules = permissions.canClearSchedules;
      }
    }

    const validColours = ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];

    // Update managed colours (for approvals)
    if (managedColours) {
      if (!Array.isArray(managedColours) || !managedColours.every(c => validColours.includes(c))) {
        return res.status(400).json({ msg: 'Invalid managed colours scope provided.' });
      }
      user.managedColours = managedColours;
    }

    // Update allowed bookable colours (for requests)
    if (allowedBookableColours) {
      if (!Array.isArray(allowedBookableColours) || !allowedBookableColours.every(c => validColours.includes(c))) {
        return res.status(400).json({ msg: 'Invalid allowed bookable colours scope provided.' });
      }
      user.allowedBookableColours = allowedBookableColours;
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

    // Enforce canDeleteUsers permission check for non-SUs
    const actor = await User.findById(req.user.id);
    if (actor.role !== 'SU' && !actor.permissions?.canDeleteUsers) {
        return res.status(403).json({ msg: 'Access Denied: You do not have permission to delete users.' });
    }

    const user = await User.findById(userId);



    if (!user) {

      return res.status(404).json({ msg: 'User not found' });

    }



    // Protect SU accounts from deletion by non-SUs, and ensure the specific Super Admin email is protected
    if ((user.role === 'SU' && req.user.role !== 'SU') || user.email === 'bradytj@gmail.com') {
        return res.status(403).json({ msg: 'Action Forbidden: Super User accounts cannot be deleted by non-SUs.' });
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
        .populate('editHistory.editedBy', 'username')
        .sort({ createdAt: -1 });
      res.json(bookings);
    } catch (err) {
      console.error('Error in getAllBookings:', err.message);
      res.status(500).json({ msg: err.message || 'Server Error fetching bookings' });
    }
  };

const deleteAllBookings = async (req, res) => {
  try {
    const actor = await User.findById(req.user.id);
    if (actor.role !== 'SU' && !actor.permissions?.canClearSchedules) {
      return res.status(403).json({ msg: 'Access Denied: You do not have permission to clear schedules or bookings.' });
    }

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
    const actor = await User.findById(req.user.id);
    if (actor.role !== 'SU' && !actor.permissions?.canClearSchedules) {
      return res.status(403).json({ msg: 'Access Denied: You do not have permission to clear schedules or bookings.' });
    }

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
    const { formatDate } = require('../utils/dateUtils');
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('editHistory.editedBy', 'username')
      .lean();

    const fields = [
      { label: 'Booking ID', value: '_id' },
      { label: 'User ID', value: 'user._id' },
      { label: 'Username', value: 'user.username' },
      { label: 'Email', value: 'user.email' },
      { label: 'From Date', value: (row) => formatDate(row.dateFrom) },
      { label: 'To Date', value: (row) => formatDate(row.dateTo) },
      { label: 'Colour', value: (row) => row.colours ? row.colours.join(', ') : 'N/A' },
      { label: 'Status', value: 'status' },
      { label: 'Requested At', value: (row) => formatDate(row.createdAt) },
      { 
        label: 'Is Adjusted', 
        value: (row) => (row.editHistory && row.editHistory.length > 0) ? 'Yes' : 'No' 
      },
      { 
        label: 'Adjustment Count', 
        value: (row) => (row.editHistory && row.editHistory.length > 0) ? row.editHistory.length : 0 
      },
      { 
        label: 'Adjustment History', 
        value: (row) => {
          if (!row.editHistory || row.editHistory.length === 0) return 'None';
          return row.editHistory.map((h, idx) => {
            const editorName = h.editedBy?.username || 'Admin';
            return `[#${idx + 1} at ${formatDate(h.editedAt)} by ${editorName}] Was: ${formatDate(h.previousDateFrom)} to ${formatDate(h.previousDateTo)}. Reason: "${h.reason}"`;
          }).join(' | ');
        }
      }
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
        { label: 'Colour', value: 'color' },
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

const getProjectSummary = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const summaryPath = path.join(__dirname, '../projectSummary.md');
    
    console.log('Attempting to read project summary from:', summaryPath);
    
    if (!fs.existsSync(summaryPath)) {
      console.error('Project summary file not found at:', summaryPath);
      return res.status(404).json({ 
        msg: 'Project summary file not found.',
        path: summaryPath 
      });
    }

    const content = fs.readFileSync(summaryPath, 'utf8');
    res.json({ content });
  } catch (err) {
    console.error('Error reading project summary:', err.message);
    res.status(500).json({ 
      msg: 'Server error reading project summary',
      error: err.message 
    });
  }
};

const sendTestEmail = async (req, res) => {
  const { recipientEmail, template } = req.body;
  const sendEmail = require('../services/email.service');
  
  if (!recipientEmail) {
    return res.status(400).json({ msg: 'Recipient email is required' });
  }

  try {
    const adminUser = await User.findById(req.user.id);
    const adminName = adminUser ? adminUser.username : 'Admin';

    let subject, text, html;

    switch (template) {
      case 'user_approved':
        subject = 'Account Approved (Test)';
        text = `Hello, your account for the Booking App has been approved! You can now log in and request bookings.`;
        html = getBaseTemplate(
          'Account Approved',
          '<p>Hello, your account for the Booking App has been <strong>approved</strong>!</p><p>You can now start requesting bookings.</p>',
          'http://bookingapp-static.onrender.com/login',
          'Login Now'
        );
        break;
      case 'user_rejected':
        subject = 'Account Update (Test)';
        text = `Hello, your account access for the Booking App has been rejected or revoked.`;
        html = getBaseTemplate(
          'Account Update',
          '<p>Hello, your account access for the Booking App has been <strong>rejected or revoked</strong>.</p>'
        );
        break;
      case 'booking_approved':
        subject = 'Booking Update: Your request has been Approved (Test)';
        text = `Hello, your booking request for the period 2026-05-01 to 2026-05-07 has been approved.`;
        html = getBaseTemplate(
          'Booking Approved',
          '<p>Hello, your booking request for the period <strong>2026-05-01</strong> to <strong>2026-05-07</strong> has been <strong>approved</strong>.</p>',
          'https://bookingapp-static.onrender.com/bookings',
          'View Bookings'
        );
        break;
      case 'booking_rejected':
        subject = 'Booking Update: Your request has been Rejected/Cancelled (Test)';
        text = `Hello, your booking request for the period 2026-05-01 to 2026-05-07 has been rejected or cancelled.`;
        html = getBaseTemplate(
          'Booking Rejected',
          '<p>Hello, your booking request for the period <strong>2026-05-01</strong> to <strong>2026-05-07</strong> has been <strong>rejected or cancelled</strong>.</p>',
          'https://bookingapp-static.onrender.com/bookings',
          'View Bookings'
        );
        break;
      default:
        subject = 'Test Email from Booking App';
        text = `Hello, this is a basic test email sent by ${adminName} to confirm the Gmail API configuration is working correctly!`;
        html = getBaseTemplate(
          'Basic Test Email',
          `<p>Hello, this is a basic test email sent by <strong>${adminName}</strong> to confirm the <strong>Gmail API configuration</strong> is working correctly!</p>`
        );
    }

    const result = await sendEmail(recipientEmail, subject, text, html);
    
    if (result && result.id) {
      res.json({ msg: `Test email (${template || 'basic'}) sent successfully to ${recipientEmail}!`, id: result.id });
    } else {
      res.status(500).json({ msg: 'Failed to send test email. Check server logs.' });
    }
  } catch (err) {
    console.error('Error sending test email:', err.message);
    const googleError = err.response?.data?.error?.message;
    const errorMsg = googleError || err.response?.data?.error_description || err.message || 'Error sending test email';
    res.status(500).json({ msg: 'Email error: ' + errorMsg });
  }
};

const sendTestPush = async (req, res) => {
  const { message, target, username } = req.body;
  const { sendPushNotification, sendPushNotificationToAll } = require('../services/push.service');

  try {
    const adminUser = await User.findById(req.user.id);
    const adminName = adminUser ? adminUser.username : 'Admin';
    const testMessage = message || `Test push alert from admin dashboard!`;

    const payload = {
      title: 'Dashboard Admin Alert',
      body: testMessage,
      url: '/'
    };

    if (target === 'all') {
      await sendPushNotificationToAll(payload);
      return res.json({ msg: `Test push broadcast successfully sent to ALL registered devices!` });
    }

    if (target === 'user') {
      if (!username) {
        return res.status(400).json({ msg: 'Target username is required.' });
      }
      const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (!targetUser) {
        return res.status(404).json({ msg: `User "${username}" not found.` });
      }
      await sendPushNotification(targetUser._id, payload);
      return res.json({ msg: `Test push successfully sent to registered devices of "${targetUser.username}"!` });
    }

    // Default: 'self'
    await sendPushNotification(req.user.id, {
      title: 'Dashboard Test Push',
      body: testMessage,
      url: '/'
    });

    res.json({ msg: `Test push notification successfully dispatched to your registered devices!` });
  } catch (err) {
    console.error('Error sending test push notification:', err.message);
    res.status(500).json({ msg: 'Push notification error: ' + err.message });
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
  getProjectSummary,
  sendTestEmail,
  sendTestPush
};