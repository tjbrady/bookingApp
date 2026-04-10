# Booking App: Project Development Summary & History

This document provides a comprehensive history of the development of the Quinta de São Roque (QSR) Booking Application, consolidating various status reports and plans.

---

## 1. Original Development Plan (web-app-plan.md)

I will build a web application for managing bookings based on the "4 Year Cycle" schedule. Here's the plan:

### Technology Stack
*   **Frontend:** React (with a UI library like Material-UI for a modern look and feel)
*   **Backend:** Node.js with Express.js
*   **Database:** MongoDB

### Project Structure
```
/
├── client/         # React frontend
└── server/         # Node.js/Express.js backend
```

---

## 2. Early Development Status (booking-app/gemini.md - Nov 2025)

The application is a full-stack booking system with advanced, role-based scheduling and approval workflows.

### System Components
*   **Backend:** Node.js, Express, MongoDB/Mongoose, JWT Auth.
*   **Frontend:** React (Vite), Context API.
*   **Key Features:** Admin User Management, Color-Coded Scheduling, Notification System, and PDF Reports.

---

## 3. Advanced Implementation Phase (status_26nov25.md - Jan 2026)

### Infrastructure & Updates
*   **Email:** Gmail API implemented for notifications. Google Cloud App promoted to **"Publish" (Production)** status.
*   **API:** Comprehensive REST endpoints for bookings, schedules, and settings.
*   **Frontend:** Dedicated Admin dashboards and User booking flows.

---

## 4. Current Status & Core Logic (gemini.md - Apr 2026)

### Current Status (2026-04-10)
- **Application State:** Operational MERN stack application.
- **Infrastructure:** Stable email notifications via Gmail API.

### 4-Year Cycle Logic & Manual Maintenance
The application uses a rotating occupancy schedule based on a "Four Owner" model: **Red, Yellow, Green, Blue**.

#### Core Rules & Pattern:
- **Share Split:** The "Yellow" share is split between **Orange** and **Yellow** owners.
- **Rotation Pattern:** `Red -> Yellow (Orange/Yellow) -> Green -> Blue`.
- **Block Structure:** 11 blocks per year with lengths: `4, 6, 6, 5, 6, 2, 2, 8, 4, 6, 3` weeks.
- **Cycle Balancing:** Balanced every 4 years for equal distribution.

#### Manual Maintenance Requirement:
- **No Internal Algorithm:** The 4-year cycle is **not** automatically calculated by the application. It is defined by an external management organization.
- **Admin Responsibility:** Admin users are responsible for manually entering and updating the schedule data based on the provided management documentation.
- **Annual Reset:** Every January, admins must reset and update the years visible in the app. Currently, the application is configured to present a **two-year window** (e.g., 2026 and 2027) to users, although the management interface supports data entry for up to four years (2026-2029).

### Implementation Status:
- **Year 1 (2026):** Fully defined.
- **Year 2 (2027):** Fully defined.
- **Future Years (2028-2029):** Data entry supported in Admin UI; manual update required by Admin in Jan of each year to shift the user-facing visibility.

### Next Steps
1.  **Dynamic Year Implementation (Dec/Jan):** A necessary development for the December/January timeframe is to modify the hardcoded years (2026/2027) in the frontend. The app should subtly shift to reflect "Year 1" and "Year 2" based on the data captured in the admin section.
2.  Verify 2027-2030 cycle rotation balancing using the Admin Summary Table.
3.  Continue UI/UX refinements for the schedule editor.

---

## 5. Recent Infrastructure & Feature Enhancements (April 2026)

### Git & Sync Management
- **GitHub PAT Sync:** Configured the environment with a GitHub Personal Access Token (PAT) stored in `~/.git-credentials` using the `credential.helper store`. This allows for seamless pushing and pulling without password prompts.
- **Repository Integrity:** All local changes, including the complex 4-year cycle logic and recent UI fixes, have been synchronized to the `main` branch of the `tjbrady/bookingApp` repository.

### Render Hosting Architecture
The application is hosted on Render across two distinct services, ensuring scalability and efficient delivery:
- **`bookingApp-static` (Static Site):** Hosts the React/Vite frontend. It is configured to build from the `client/` directory and publish the `dist` folder.
- **`bookingApp` (Web Service):** Hosts the Node.js/Express backend. It manages API requests, database connections, and the email service.
- **Deployment:** Continuous Deployment (CD) is active, with manual triggers verified to ensure both frontend and backend are running the latest synchronized code.

### Email & Notification System Overhaul
- **Gmail API Production Migration:** Successfully migrated from the "Testing" phase to "Publish" (Production) in the Google Cloud Console. This removes the 7-day refresh token expiration, ensuring long-term stability.
- **Automated Communication Hooks:**
    - **Admin Alerts:** Admins are automatically emailed for new user registrations and new booking requests.
    - **User Feedback:** Users now receive professional automated emails when their account is approved/rejected or when their booking status is updated by an admin.
- **Styled HTML Templates:** Implemented a unified branding system for all emails.
    - **Visual Identity:** Includes a professional palm tree logo (`palm-tree.png`).
    - **Design:** Modern, clean layout with a mid-grey header background and clear call-to-action buttons.
- **Admin Diagnostic Tools:**
    - **Email Status Checker:** A new component in the Admin Dashboard that monitors the health of the email system and environment variables.
    - **Send Test Email:** A robust tool for admins to send a test email to any address, choosing from various system templates (Account Approved, Booking Rejected, etc.) to verify the look and functionality before real users receive them.