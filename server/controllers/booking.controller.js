const Booking = require('../models/booking.model');
const ColorSchedule = require('../models/colorSchedule.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// @desc    Get bookings for the logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ dateFrom: 1 });
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
  const { service, dateFrom, dateTo } = req.body;

  try {
    if (new Date(dateFrom) >= new Date(dateTo)) {
      return res.status(400).json({ msg: '"Date To" must be after "Date From".' });
    }

    const allowedColors = ['Blue', 'Orange', 'Yellow'];
    const requestedMidpoint = new Date(new Date(dateFrom).getTime() + (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 2);

    const colorPeriod = await ColorSchedule.findOne({
      startDate: { $lte: requestedMidpoint },
      endDate: { $gte: requestedMidpoint },
    });

    if (!colorPeriod || !allowedColors.includes(colorPeriod.color)) {
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
      status: 'pending',
    });

    const booking = await newBooking.save();
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

    if (loggedInUser.role === 'admin') {
        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ msg: 'Admin can only set status to "confirmed" or "cancelled".' });
        }
        booking.status = status;

        if (originalStatus !== status && ['pending', 'cancellation_pending'].includes(originalStatus)) {
            const dateFrom = new Date(booking.dateFrom).toLocaleDateString();
            const dateTo = new Date(booking.dateTo).toLocaleDateString();
            await Notification.create({
                user: booking.user._id, // Use _id here
                message: `Your booking request for ${dateFrom} - ${dateTo} has been ${status}.`
            });
        }
    } 
    else if (booking.user._id.toString() === req.user.id) { // User is trying to update their own booking
        if (status === 'cancelled') { // User wants to cancel
            if (originalStatus === 'pending') {
                booking.status = 'cancelled'; // User can directly cancel pending
            } else if (originalStatus === 'confirmed') {
                booking.status = 'cancellation_pending'; // User can request cancellation for confirmed
                const dateFrom = new Date(booking.dateFrom).toLocaleDateString();
                const dateTo = new Date(booking.dateTo).toLocaleDateString();
                // Notify admin of cancellation request (optional, can be added later)
                // For now, notify user about their request status
                await Notification.create({
                    user: booking.user._id,
                    message: `Your request to cancel booking ${dateFrom} - ${dateTo} has been submitted for admin review.`
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
    if (loggedInUser.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getMyBookings,
  getPublicBookings,
  createBooking,
  updateBooking,
  deleteBooking,
};