const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  try {
    let transportConfig = {
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    // Prioritize explicit Host/Port settings over 'service'
    if (process.env.EMAIL_HOST) {
      transportConfig.host = process.env.EMAIL_HOST;
      transportConfig.port = Number(process.env.EMAIL_PORT) || 587;
      
      // Smart secure detection: True if env var says so (case-insensitive) OR if port is 465
      const secureEnv = process.env.EMAIL_SECURE ? String(process.env.EMAIL_SECURE).toLowerCase() : 'false';
      transportConfig.secure = secureEnv === 'true' || transportConfig.port === 465;

      console.log(`Raw EMAIL_SECURE env: '${process.env.EMAIL_SECURE}'`);
      console.log(`Using Custom SMTP Config: Host=${transportConfig.host}, Port=${transportConfig.port}, Secure=${transportConfig.secure}`);
    } else if (process.env.EMAIL_SERVICE) {
      transportConfig.service = process.env.EMAIL_SERVICE; // e.g., 'gmail'
      console.log(`Using Service Config: ${transportConfig.service}`);
    } else {
      console.warn('No EMAIL_HOST or EMAIL_SERVICE defined in environment variables.');
    }

    // Create a transporter
    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    console.log(`Attempting to send email to: ${to}`);
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
