
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testEmailTrigger() {
  try {
    // 1. Register/Login a test user
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';
    const username = `testuser_${Date.now()}`;

    console.log(`1. Registering user: ${email}...`);
    try {
        await axios.post(`${API_URL}/auth/register`, {
            username,
            email,
            password
        });
    } catch (e) {
        // If user exists (unlikely with timestamp), try login
        console.log('User might exist, proceeding to login...');
    }

    console.log('2. Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
    });
    const token = loginRes.data.token;
    console.log('   Token received.');

    // 2. Create a booking
    // Valid date according to csv: Orange, 28-Dec-25 to 03-Jan-26
    const bookingData = {
        service: 'Test Email Trigger Service',
        dateFrom: '2025-12-29', // Mon
        dateTo: '2025-12-30'    // Tue
    };

    console.log('3. Creating booking...');
    const bookingRes = await axios.post(`${API_URL}/bookings`, bookingData, {
        headers: {
            'x-auth-token': token
        }
    });

    console.log('   Booking created successfully!');
    console.log('   Response:', bookingRes.data);
    console.log('\n✅ CHECK SERVER LOGS NOW. You should see "Email sent: ..."');

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testEmailTrigger();
