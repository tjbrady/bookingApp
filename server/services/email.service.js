const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  try {
    // Resend requires a verified 'from' domain.
    // For testing, 'onboarding@resend.dev' works if your 'to' address is your Resend account email.
    // Otherwise, ensure process.env.EMAIL_FROM is a domain you've verified with Resend.
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'; 

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to], // Resend 'to' expects an array
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return;
    }

    console.log('Email sent successfully with Resend:', data);
    return data;
  } catch (error) {
    console.error('Error in Resend sendEmail function:', error);
  }
};

module.exports = sendEmail;
