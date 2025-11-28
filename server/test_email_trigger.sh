#!/bin/bash

# Base URL
API_URL="http://localhost:5000/api"

# Timestamp for unique user
TS=$(date +%s)
EMAIL="testuser_${TS}@example.com"
PASSWORD="password123"
USERNAME="testuser_${TS}"

echo "1. Registering user: $EMAIL..."
curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}"

echo -e "\n\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract token using grep/sed (simple parsing)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o "\"token\":\"[^\"]*\"" | grep -o "\"[^\"]*\"$" | tr -d '"')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "   Token received."

# 3. Create Booking
# Valid date: Orange, 28-Dec-25 to 03-Jan-26
# Using 2025-12-29 to 2025-12-30
echo -e "\n3. Creating booking..."
BOOKING_RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"service": "Test Email Trigger", "dateFrom": "2025-12-29", "dateTo": "2025-12-30"}')

echo "   Response: $BOOKING_RESPONSE"
echo -e "\n✅ CHECK SERVER LOGS NOW. You should see 'Email sent: ...' if successful."
