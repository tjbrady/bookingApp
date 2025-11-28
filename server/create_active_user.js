const mongoose = require('mongoose');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const createActiveUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = `active_test_${Date.now()}@example.com`;
    const password = 'password123';
    const username = `active_test_${Date.now()}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      status: 'active', // DIRECTLY SETTING STATUS TO ACTIVE
      role: 'user'
    });

    await user.save();
    console.log(`User created: ${email} / ${password}`);
    
    // Output for the shell script to read
    console.log(`__JSON__:${JSON.stringify({ email, password })}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createActiveUser();
