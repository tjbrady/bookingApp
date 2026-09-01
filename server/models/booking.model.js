const mongoose = require('mongoose');

const editHistorySchema = new mongoose.Schema({
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousDateFrom: {
    type: Date,
    required: true
  },
  previousDateTo: {
    type: Date,
    required: true
  },
  newDateFrom: {
    type: Date,
    required: true
  },
  newDateTo: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  }
});

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    required: true
  },
  dateFrom: {
    type: Date,
    required: true
  },
  dateTo: {
    type: Date,
    required: true
  },
  colours: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'denied', 'cancellation_pending'],
    default: 'pending'
  },
  editHistory: {
    type: [editHistorySchema],
    default: []
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;