#!/bin/bash

API_URL="http://localhost:5000/api"

echo "1. Creating ACTIVE user via direct DB access..."
OUTPUT=$(node booking-app/server/create_active_user.js)
echo "$OUTPUT"

# Extract JSON from the specific line
USER_JSON=$(echo "$OUTPUT" | grep "__JSON__" | cut -d':' -f2-)

if [ -z "$USER_JSON" ]; then
  echo "❌ Failed to create user."
  exit 1
fi

# Parse email and password (simple grep/sed hack to avoid jq dependency)
EMAIL=$(echo $USER_JSON | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
PASSWORD="password123" # Hardcoded in the JS script too

echo -e "\n2. Logging in as $EMAIL..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o "\"token\":\"[^\"]*\"" | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "   Token received."

echo -e "\n3. Creating booking..."
# Valid date: Blue, 08-Mar-26 to 18-Apr-26
BOOKING_RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"service": "Test Email Trigger", "dateFrom": "2026-03-09", "dateTo": "2026-03-10"}')

echo "   Response: $BOOKING_RESPONSE"
echo -e "\n✅ CHECK SERVER LOGS NOW. You should see 'Email sent: ...' if successful."
