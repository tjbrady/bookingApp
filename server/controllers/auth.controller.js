const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Notify Admins via Email
    const admins = await User.find({ role: 'admin' });
    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length > 0) {
      console.log('Sending registration notification to admins:', adminEmails);
      const subject = 'New User Registration Pending Approval';
      const dashboardLink = 'http://bookingapp-static.onrender.com';
      const text = `A new user has registered.\n\nUsername: ${username}\nEmail: ${email}\n\nPlease log in to the admin dashboard to approve or reject this user: ${dashboardLink}`;
      const html = `<p>A new user has registered and is awaiting approval.</p>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p>Please <a href="${dashboardLink}">log in to the admin dashboard</a> to manage this request.</p>`;
      
      // Send emails sequentially with delay to avoid rate limits
      for (const email of adminEmails) {
        await sendEmail(email, subject, text, html);
        // Wait 1 second between emails to respect Resend's 2 req/sec limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.status(201).json({ msg: 'Registration successful. Your account is pending admin approval.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ msg: 'Your account is pending admin approval.' });
    }
    
    if (user.status === 'rejected') {
      return res.status(403).json({ msg: 'Your account has been rejected. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('User found on login:', user); // For debugging

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  register,
  login,
};
