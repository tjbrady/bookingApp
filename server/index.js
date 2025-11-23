const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// --- TEMPORARY DIAGNOSTIC CODE ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('**************************************');
    console.log('*** DATABASE CONNECTION SUCCESSFUL ***');
    console.log('**************************************');
  } catch (err) {
    console.error('**************************************');
    console.error('*** DATABASE CONNECTION FAILED ***');
    console.error('Full error object:', err);
    console.error('**************************************');
  }
};
connectDB();
// --- END TEMPORARY DIAGNOSTIC CODE ---

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/notifications', require('./routes/notification.routes.js'));
app.use('/api/schedule', require('./routes/schedule.routes.js'));
app.use('/api/settings', require('./routes/setting.routes.js'));
app.use('/api/admin', require('./routes/admin.routes.js'));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
