#!/bin/bash

API_URL="http://localhost:5000/api"
TS=$(date +%s)
EMAIL="new_reg_user_${TS}@example.com"
PASSWORD="password123"
USERNAME="new_reg_user_${TS}"

echo "1. Registering NEW user: $EMAIL..."
echo "   This should trigger an email to admins."

RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "   Response: $RESPONSE"
echo -e "\n✅ CHECK SERVER LOGS. You should see 'Sending registration notification to admins...' and 'Email sent: ...'"
