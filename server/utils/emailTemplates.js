const getBaseTemplate = (title, content, actionLink = null, actionText = null) => {
  const logoUrl = 'https://bookingapp-static.onrender.com/palm-tree.png';
  const primaryColor = '#2c3e50';
  const secondaryColor = '#3498db';
  const backgroundColor = '#f4f7f6';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: ${backgroundColor};
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background-color: ${primaryColor};
          padding: 30px;
          text-align: center;
          color: #ffffff;
        }
        .header img {
          width: 60px;
          margin-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
          background-color: #ffffff;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          padding: 12px 25px;
          background-color: ${secondaryColor};
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin-top: 25px;
        }
        .footer-links a {
          color: ${secondaryColor};
          text-decoration: none;
          margin: 0 10px;
        }
        hr {
          border: 0;
          border-top: 1px solid #eee;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Logo">
          <h1>Booking App</h1>
        </div>
        <div class="content">
          <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
          ${content}
          ${actionLink && actionText ? `
            <div style="text-align: center;">
              <a href="${actionLink}" class="button">${actionText}</a>
            </div>
          ` : ''}
          <hr>
          <p style="font-size: 14px; color: #666;">
            Best regards,<br>
            <strong>The Booking App Team</strong>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Quinta de São Roque</p>
          <div class="footer-links">
            <a href="https://bookingapp-static.onrender.com">Home</a> | 
            <a href="https://bookingapp-static.onrender.com/bookings">My Bookings</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getBaseTemplate };
