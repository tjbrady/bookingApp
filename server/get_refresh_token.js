const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Get Gmail API Refresh Token ---');

rl.question('Enter your Client ID: ', (clientId) => {
  rl.question('Enter your Client Secret: ', (clientSecret) => {
    
    const oauth2Client = new google.auth.OAuth2(
      clientId.trim(),
      clientSecret.trim(),
      'http://127.0.0.1:3000' // This MUST match the Redirect URI you set in Google Cloud Console
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Crucial! This ensures we get a Refresh Token
      scope: scopes
    });

    console.log('\n1. Open this URL in your browser:');
    console.log(url);
    console.log('\n2. Log in with your Google Account (bradytj@gmail.com).');
    console.log('3. If you see a warning "Google hasn\'t verified this app", click "Advanced" -> "Go to Booking App (unsafe)". (This is normal for testing apps).');
    console.log('4. After authorizing, you will be redirected to http://localhost:3000/?code=...');
    console.log('5. Copy the value of the "code" parameter from the URL bar.');
    
    rl.question('\nEnter the code here: ', async (code) => {
      try {
        const { tokens } = await oauth2Client.getToken(code.trim());
        console.log('\nSUCCESS! Here is your Refresh Token:');
        console.log('--------------------------------------------------');
        console.log(tokens.refresh_token);
        console.log('--------------------------------------------------');
        console.log('Save this Refresh Token securely! You will use it in your .env file.');
      } catch (error) {
        console.error('Error retrieving access token:', error);
      }
      rl.close();
    });
  });
});
