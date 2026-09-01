const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'SU'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  permissions: {
    canEditApprovedBookings: {
      type: Boolean,
      default: true
    },
    canDeleteUsers: {
      type: Boolean,
      default: true
    },
    canClearSchedules: {
      type: Boolean,
      default: true
    }
  },
  managedColours: {
    type: [String],
    default: []
  },
  allowedBookableColours: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
