const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const sendEmail = async (to, subject, text, html) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Create a Nodemailer transporter that just streams the raw message
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows' // Gmail requires windows newlines
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    // Build the raw email using Nodemailer
    const info = await transporter.sendMail(mailOptions);

    // Convert the stream to a Buffer
    const rawEmail = await new Promise((resolve, reject) => {
      const chunks = [];
      info.message.on('data', chunk => chunks.push(chunk));
      info.message.on('end', () => resolve(Buffer.concat(chunks)));
      info.message.on('error', reject);
    });

    // Encode the raw email for the Gmail API (base64url)
    const encodedMessage = rawEmail.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Email sent via Gmail API id:', res.data.id);
    return res.data;
  } catch (error) {
    console.error('Error sending email:', error);
    // We don't throw the error here to prevent the booking flow from crashing if email fails
  }
};

module.exports = sendEmail;