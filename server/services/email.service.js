const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  try {
    // Create a transporter
    // For Gmail, you might need to use an App Password if 2FA is enabled.
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
      host: process.env.EMAIL_HOST,       // e.g., 'smtp.gmail.com' (if not using 'service')
      port: process.env.EMAIL_PORT,       // e.g., 587
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // We don't throw the error here to prevent the booking flow from crashing if email fails
    // But you might want to handle it differently depending on requirements
  }
};

module.exports = sendEmail;
