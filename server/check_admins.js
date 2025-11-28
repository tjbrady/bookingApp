const mongoose = require('mongoose');
const User = require('./models/user.model');
require('dotenv').config({ path: './.env' }); // Ensure dotenv loads from the correct .env file

const checkAdmins = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI not found in .env file. Please ensure it is set.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' });
    console.log(`Found ${admins.length} admin(s).`);
    admins.forEach(admin => {
        console.log(`- Username: ${admin.username}, Email: ${admin.email}`);
    });

    if (admins.length === 0) {
        console.log('WARNING: No admins found in the database with role: "admin".');
        console.log('Emails will NOT be sent until at least one user is assigned the "admin" role.');
        const allUsers = await User.find({});
        if (allUsers.length > 0) {
            console.log(`Total users in DB: ${allUsers.length}. Consider changing a user's role to "admin".`);
        } else {
            console.log('No users found in the database at all.');
        }
    }

    process.exit();
  } catch (error) {
    console.error('Error during admin check:', error);
    process.exit(1);
  }
};

checkAdmins();
