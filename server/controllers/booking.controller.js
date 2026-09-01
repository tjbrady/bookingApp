require('dotenv').config({ path: './.env' }); // Ensure environment variables are loaded
const Booking = require('../models/booking.model');
const ColorSchedule = require('../models/colorSchedule.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const sendEmail = require('../services/email.service');
const { sendPushNotification } = require('../services/push.service');
const { formatDate } = require('../utils/dateUtils');
const { getBaseTemplate } = require('../utils/emailTemplates');

// @desc    Get bookings for the logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('editHistory.editedBy', 'username')
      .sort({ dateFrom: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all confirmed and pending bookings for public display
const getPublicBookings = async (req, res) => {
    try {
      const bookings = await Booking.find({ status: { $in: ['confirmed', 'pending', 'cancellation_pending'] } }) // Include cancellation_pending
        .populate('user', 'username')
        .sort({ dateFrom: 1 });
      res.json(bookings);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

// @desc    Create a new booking request
const createBooking = async (req, res) => {
  console.log('--> createBooking controller HIT'); // Debug Log
  const { service, dateFrom, dateTo } = req.body;

  try {
    if (new Date(dateFrom) >= new Date(dateTo)) {
      return res.status(400).json({ msg: '"Date To" must be after "Date From".' });
    }

    const allowedColors = ['Blue', 'Orange', 'Yellow'];
    
    // Find all schedule periods that overlap with the requested dates
    const overlappingPeriods = await ColorSchedule.find({
      $or: [
        { startDate: { $lte: dateFrom }, endDate: { $gte: dateFrom } }, // Start date inside a period
        { startDate: { $lte: dateTo }, endDate: { $gte: dateTo } },     // End date inside a period
        { startDate: { $gte: dateFrom }, endDate: { $lte: dateTo } }    // Period fully inside requested range
      ]
    });

    if (overlappingPeriods.length === 0) {
      return res.status(400).json({ msg: 'No schedule found for the selected dates.' });
    }

    const assignedColours = [...new Set(overlappingPeriods.map(p => p.color))].filter(c => c !== '');
    const containsRestricted = assignedColours.some(c => ['Red', 'Green'].includes(c));

    if (containsRestricted || !assignedColours.every(c => allowedColors.includes(c))) {
      return res.status(400).json({ msg: 'Bookings can only be requested for Blue, Orange, or Yellow periods.' });
    }

    const conflictingBooking = await Booking.findOne({
      service,
      status: { $in: ['confirmed', 'pending', 'cancellation_pending'] },
      $or: [
        { dateFrom: { $lte: dateFrom }, dateTo: { $gt: dateFrom } },
        { dateFrom: { $lt: dateTo }, dateTo: { $gte: dateTo } },
        { dateFrom: { $gte: dateFrom }, dateTo: { $lte: dateTo } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ msg: 'These dates conflict with an existing confirmed or pending booking.' });
    }

    const newBooking = new Booking({
      user: req.user.id,
      service,
      dateFrom,
      dateTo,
      colours: assignedColours,
      status: 'pending',
    });

    const booking = await newBooking.save();

    // Notify Admins and SUs via Email
    const admins = await User.find({ role: { $in: ['admin', 'SU'] } });
    const adminEmails = admins.map(admin => admin.email);
    const requestingUser = await User.findById(req.user.id); // Get username

    if (adminEmails.length > 0) {
      console.log('Attempting to send emails to:', adminEmails);
      console.log('EMAIL_USER from .env:', process.env.EMAIL_USER); // Debugging .env variable access
      const subject = `New [${assignedColours.join(', ')}] Booking Request`;
      const dashboardLink = 'http://bookingapp-static.onrender.com';
      const text = `User ${requestingUser.username} has requested a booking in [${assignedColours.join(', ')}] from ${formatDate(dateFrom)} to ${formatDate(dateTo)}. Please log in to the admin dashboard to approve or reject: ${dashboardLink}`;
      const html = getBaseTemplate(
        `New [${assignedColours.join(', ')}] Booking Request`,
        `<p>User <strong>${requestingUser.username}</strong> has requested a booking.</p>
         <p><strong>Colours:</strong> ${assignedColours.join(', ')}</p>
         <p><strong>Dates:</strong> ${formatDate(dateFrom)} - ${formatDate(dateTo)}</p>
         <p>Please log in to the admin dashboard to manage this request.</p>`,
        dashboardLink,
        'Go to Admin Dashboard'
      );      
      // Send to all admins (sequentially with delay to avoid rate limits)
      for (const email of adminEmails) {
        await sendEmail(email, subject, text, html);
        // Wait 1 second between emails to respect Resend's 2 req/sec limit
        await new Promise(resolve => setTimeout(resolve, 1000)); 
      }
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a booking's status (for admins) or cancel/request cancel (for users)
const updateBooking = async (req, res) => {
  const { status } = req.body;
  try {
    let booking = await Booking.findById(req.params.id).populate('user', 'username'); // Populate user for notification
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    
    const loggedInUser = await User.findById(req.user.id);
    const originalStatus = booking.status;
    const sendEmail = require('../services/email.service');

    if (loggedInUser.role === 'admin' || loggedInUser.role === 'SU') {
        if (!['confirmed', 'cancelled', 'denied'].includes(status)) {
            return res.status(400).json({ msg: 'Admin can only set status to "confirmed", "cancelled", or "denied".' });
        }
        booking.status = status;

        if (originalStatus !== status && (['pending', 'cancellation_pending', 'confirmed'].includes(originalStatus))) {
            const dateFrom = formatDate(booking.dateFrom);
            const dateTo = formatDate(booking.dateTo);
            const user = await User.findById(booking.user._id);

            // In-app notification
            const messageText = `Your booking request for ${dateFrom} - ${dateTo} has been ${status === 'denied' ? 'denied' : status}.`;
            await Notification.create({
                user: booking.user._id,
                message: messageText
            });

            // Send Push Notification
            await sendPushNotification(booking.user._id, {
                title: 'Booking Status Update',
                body: messageText,
                url: '/bookings'
            });

            // Email notification
            if (user && user.email) {
                const subject = `Booking Update: Your request has been ${status === 'confirmed' ? 'Approved' : (status === 'denied' ? 'Denied' : 'Cancelled')}`;
                const text = `Hello ${user.username}, your booking request for ${dateFrom} to ${dateTo} has been ${status === 'confirmed' ? 'approved' : (status === 'denied' ? 'denied' : 'cancelled')}.`;
                const html = getBaseTemplate(
                    `Booking ${status === 'confirmed' ? 'Approved' : (status === 'denied' ? 'Denied' : 'Cancelled')}`,
                    `<p>Hello <strong>${user.username}</strong>,</p>
                     <p>Your booking request for the period <strong>${dateFrom}</strong> to <strong>${dateTo}</strong> has been <strong>${status === 'confirmed' ? 'approved' : (status === 'denied' ? 'denied' : 'cancelled')}</strong>.</p>`,
                    'https://bookingapp-static.onrender.com/bookings',
                    'View Bookings'
                );
                try {
                    await sendEmail(user.email, subject, text, html);
                } catch (err) {
                    console.error('Failed to send booking status email:', err.message);
                }
            }
        }
    } 
    else if (booking.user._id.toString() === req.user.id) { // User is trying to update their own booking
        if (status === 'cancelled') { // User wants to cancel
            if (originalStatus === 'pending') {
                booking.status = 'cancelled'; // User can directly cancel pending
            } else if (originalStatus === 'confirmed') {
                booking.status = 'cancellation_pending'; // User can request cancellation for confirmed
                const dateFrom = formatDate(booking.dateFrom);
                const dateTo = formatDate(booking.dateTo);
                const cancelMsgText = `Your request to cancel booking ${dateFrom} - ${dateTo} has been submitted for admin review.`;
                await Notification.create({
                    user: booking.user._id,
                    message: cancelMsgText
                });

                // Send Push Notification
                await sendPushNotification(booking.user._id, {
                    title: 'Cancellation Submitted',
                    body: cancelMsgText,
                    url: '/bookings'
                });
            } else {
                return res.status(403).json({ msg: 'Cannot cancel a booking with status: ' + originalStatus });
            }
        } else {
            return res.status(403).json({ msg: 'You can only request to cancel your own bookings.' });
        }
    } 
    else {
      return res.status(401).json({ msg: 'Not authorized to update this booking.' });
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a booking (for admins)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    const loggedInUser = await User.findById(req.user.id);
    if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'SU') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Adjust booking dates (for admins and SUs) with full auditing and alerts
const adjustBookingDates = async (req, res) => {
  const { dateFrom, dateTo, reason } = req.body;

  try {
    // 1. Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'SU') {
      return res.status(403).json({ msg: 'Access denied. Administrative privileges required.' });
    }

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ msg: 'Both "dateFrom" and "dateTo" are required.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ msg: 'A reason for adjustment is required.' });
    }

    if (new Date(dateFrom) >= new Date(dateTo)) {
      return res.status(400).json({ msg: '"Date To" must be after "Date From".' });
    }

    // Find the current booking
    const booking = await Booking.findById(req.params.id).populate('user', 'username email');
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found.' });
    }

    // 2. Schedule Color Validation (Blue, Orange, Yellow only)
    const allowedColors = ['Blue', 'Orange', 'Yellow'];
    const overlappingPeriods = await ColorSchedule.find({
      $or: [
        { startDate: { $lte: dateFrom }, endDate: { $gte: dateFrom } }, // Start date inside a period
        { startDate: { $lte: dateTo }, endDate: { $gte: dateTo } },     // End date inside a period
        { startDate: { $gte: dateFrom }, endDate: { $lte: dateTo } }    // Period fully inside requested range
      ]
    });

    if (overlappingPeriods.length === 0) {
      return res.status(400).json({ msg: 'No schedule found for the selected dates.' });
    }

    const assignedColours = [...new Set(overlappingPeriods.map(p => p.color))].filter(c => c !== '');
    const containsRestricted = assignedColours.some(c => ['Red', 'Green'].includes(c));

    if (containsRestricted || !assignedColours.every(c => allowedColors.includes(c))) {
      return res.status(400).json({ msg: 'Adjusted dates can only fall inside Blue, Orange, or Yellow periods.' });
    }

    // 3. Conflict validation (excl. current booking)
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      service: booking.service,
      status: { $in: ['confirmed', 'pending', 'cancellation_pending'] },
      $or: [
        { dateFrom: { $lte: dateFrom }, dateTo: { $gt: dateFrom } },
        { dateFrom: { $lt: dateTo }, dateTo: { $gte: dateTo } },
        { dateFrom: { $gte: dateFrom }, dateTo: { $lte: dateTo } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ msg: 'The adjusted dates conflict with another active booking.' });
    }

    // Keep backup of previous values for auditing
    const previousDateFrom = booking.dateFrom;
    const previousDateTo = booking.dateTo;

    // Update booking fields
    booking.dateFrom = dateFrom;
    booking.dateTo = dateTo;
    booking.colours = assignedColours;

    // Add entry to editHistory
    booking.editHistory.push({
      editedBy: req.user.id,
      previousDateFrom,
      previousDateTo,
      newDateFrom: dateFrom,
      newDateTo: dateTo,
      reason: reason.trim()
    });

    await booking.save();

    // Re-fetch populated to get the editor's username for UI updates
    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email')
      .populate('editHistory.editedBy', 'username');

    // 4. Alert & Notify Originator
    const owner = updatedBooking.user;
    const editor = updatedBooking.editHistory[updatedBooking.editHistory.length - 1].editedBy;
    const editorName = editor ? editor.username : 'Admin';

    // Internal In-App Notification
    const notificationMessage = `Your booking was adjusted by ${editorName}. Reason: "${reason.trim()}".`;
    const inAppNotification = new Notification({
      user: owner._id,
      message: notificationMessage,
      type: 'system'
    });
    await inAppNotification.save();

    // Email Notification
    if (owner.email) {
      const subject = 'Booking Date Adjustment Notification';
      const dashboardLink = 'http://bookingapp-static.onrender.com';
      const text = `Hello ${owner.username},\n\nYour booking request has been adjusted by Administrator ${editorName}.\n\nReason: ${reason.trim()}\n\nPrevious Dates: ${formatDate(previousDateFrom)} to ${formatDate(previousDateTo)}\nNew Dates: ${formatDate(dateFrom)} to ${formatDate(dateTo)}\n\nPlease log in to view: ${dashboardLink}`;
      const html = getBaseTemplate(
        'Booking Adjusted',
        `<p>Hello <strong>${owner.username}</strong>,</p>
         <p>Your booking has been directly adjusted by Administrator <strong>${editorName}</strong>.</p>
         <p><strong>Reason for change:</strong> "${reason.trim()}"</p>
         <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
           <tr style="background-color: #f2f2f2;">
             <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Detail</th>
             <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Old Value</th>
             <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">New Value</th>
           </tr>
           <tr>
             <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Dates</td>
             <td style="padding: 8px; border: 1px solid #ddd; color: #888; text-decoration: line-through;">${formatDate(previousDateFrom)} - ${formatDate(previousDateTo)}</td>
             <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #4CAF50;">${formatDate(dateFrom)} - ${formatDate(dateTo)}</td>
           </tr>
           <tr>
             <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Colours</td>
             <td style="padding: 8px; border: 1px solid #ddd; color: #888;">[${booking.colours.join(', ')}]</td>
             <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #4CAF50;">[${assignedColours.join(', ')}]</td>
           </tr>
         </table>`,
        dashboardLink,
        'View My Bookings'
      );

      try {
        await sendEmail(owner.email, subject, text, html);
      } catch (err) {
        console.error('Failed to send booking adjustment email:', err.message);
      }
    }

    // Web Push Notification
    try {
      await sendPushNotification(owner._id, {
        title: 'Booking Dates Adjusted',
        body: `Your booking was adjusted by ${editorName}: ${formatDate(dateFrom)} to ${formatDate(dateTo)}.`,
        url: '/bookings'
      });
    } catch (pushErr) {
      console.error(`Failed to send push notification to owner ${owner._id}:`, pushErr.message);
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error('Error in adjustBookingDates:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getMyBookings,
  getPublicBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  adjustBookingDates,
};