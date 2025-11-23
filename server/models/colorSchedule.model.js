const mongoose = require('mongoose');

// This schema stores a single color-coded period.
// The entire 4-year schedule will be composed of many of these documents.
const colorScheduleSchema = new mongoose.Schema({
  color: {
    type: String,
    enum: ['Red', 'Blue', 'Orange', 'Yellow', 'Green', ''], // Allow empty for unassigned
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

// Create a compound index to ensure no overlapping date ranges can be created.
// This is an advanced feature but good for data integrity. For simplicity,
// we will rely on frontend logic and bulk-delete for now. A unique index 
// on startDate and endDate could also be an option if ranges were fixed.

const ColorSchedule = mongoose.model('ColorSchedule', colorScheduleSchema);

module.exports = ColorSchedule;
