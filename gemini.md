# Gemini Booking App Development Summary

This file summarizes the development progress of the Booking App as of the last session.

## Current Status

The application is a full-stack booking system with advanced, role-based scheduling and approval workflows.

### Backend (`/server`)

*   **Framework:** Node.js with Express.
*   **Database:** MongoDB, connected via Mongoose.
*   **Authentication:** JWT-based. User registration requires admin approval.
*   **Features:**
    *   **Admin User Management:** Admins can approve, reject, or revoke access for any user.
    *   **Color-Coded Scheduling:** Admins can define a 4-year schedule. The backend now supports both overwriting the entire schedule and updating it on a year-by-year basis.
    *   **Booking Workflow:** Users request bookings, which admins can approve, reject, or delete. Backend endpoints also exist to delete all bookings or bookings for a specific year.
    *   **Notification System:** The backend automatically generates notifications for users when an admin acts on their booking requests.
    *   **Site Settings:** An endpoint for admins to save and retrieve site-wide settings, such as a message of the day.
*   **How to Run:**
    1.  Navigate to the `/server` directory.
    2.  Ensure your `MONGO_URI` in the `.env` file points to your `bookingAppDB`.
    3.  Run `npm run dev`.

### Frontend (`/client`)

*   **Framework:** React (using Vite).
*   **State Management:** React Context (`AuthContext`).
*   **Features:**
    *   **Split Admin Dashboard:** Admin tasks are now split into two pages for clarity:
        *   **Admin Dashboard (`/admin`):** For frequent tasks like booking management, user management, and updating the Message of the Day.
        *   **4 Year Cycle Setup (`/admin/cycle-setup`):** For the rare task of setting up the 4-year color schedule.
    *   **New Schedule Editor:** The previous "paint-the-weeks" calendar has been replaced by a form-based table editor (`ScheduleTableEditor`), allowing direct entry of start/end dates for 3 booking slots per color, per year.
    *   **Schedule Summary Table:** A summary table on the "4 Year Cycle Setup" page provides an at-a-glance overview of the total weeks allocated for each colour per year.
    *   **Granular Saving & Deletion:** The UI now supports saving the schedule on a per-year basis and includes (non-functional) buttons for clearing booking data by year or all at once.
    *   **Polished UI:** A pleasant `lightcyan` background, with styled, professional-looking forms.
    *   **Custom Interactive Calendar:** The user-facing calendar on the "My Bookings" page displays the schedule set by the admin.
    *   **Enhanced PDF Reports:** Implemented robust PDF generation for user and admin reports.
*   **How to Run:**
    1.  Navigate to the `/client` directory.
    2.  Run `npm run dev`. The app will be available at the local address provided (usually `http://localhost:5173`).

## To Resume Development

1.  **Start the Backend:** Open a terminal in the `/server` directory and run `npm run dev`.
2.  **Start the Frontend:** Open a second terminal in the `/client` directory and run `npm run dev`.
3.  Open your browser to the frontend address.

---

## How to Test the Full Application Workflow

When you return, here is the process to test all the features we've built:

1.  **Log in as an Admin user.**
2.  **Navigate to the "4 Year Cycle Setup" page** via the "Admin Dashboard" dropdown in the navbar.
    *   Enter start and end dates for various colors across the years 2026 and 2027.
    *   Notice the "Schedule Summary" table at the top updates as you enter dates.
    *   Click "Save 2026 Changes" and "Save 2027 Changes".
3.  **Navigate to the main "Admin Dashboard" page.**
    *   Update the "Message of the Day".
    *   Approve any pending users in the "User Management" section.
4.  **Log out and log in as a normal user.**
    *   You should land on the Home page and see the "Message of the Day".
5.  **Navigate to the "My Bookings" page.**
    *   The calendar should display the colored weeks you just configured.
    *   Request a booking within a valid (e.g., Blue, Orange, Yellow) week.
6.  **Log back in as an Admin.**
    *   Go to the "Admin Dashboard" and approve the booking request.
7.  **Log back in as the normal user.**
    *   You should see a notification on the Home page.
    *   The "My Bookings" calendar should now show the booking as confirmed (green triangle and a ✓).

## Major Refactoring & New Features (as of 2025-11-22)

*   **Admin Dashboard Split:**
    *   The Admin Dashboard was split into two distinct pages: `AdminDashboard` (for frequent tasks like booking/user management) and `FourYearCycleSetup` (for the rare task of setting up the colour schedule).
    *   The navigation and routing were updated to reflect this separation.
*   **New Schedule Editor:**
    *   The "paint-the-weeks" `ScheduleManager` was completely replaced with a new form-based `ScheduleTableEditor` component, allowing direct entry of start and end dates.
*   **Schedule Summary & Granular Saving:**
    *   A `ScheduleSummaryTable` was added to the `FourYearCycleSetup` page to provide an at-a-glance overview of week allocations.
    *   The backend and frontend were updated to support saving the schedule on a **per-year basis**.
*   **Destructive Action UI:**
    *   A "Danger Zone" with placeholder buttons for clearing booking data was added to the `AdminDashboard`, with built-in confirmation dialogs.
*   **Bug Fixes & Refinements:**
    *   Resolved critical rendering bugs that were causing a blank screen.
    *   Fixed the calculation logic in the `ScheduleSummaryTable`.
    *   Corrected various UI alignment and spelling issues.
    *   Fixed a persistent login issue by identifying that the user's role in the database was the root cause, and adding server-side logging to prove it, guiding the user to the correct data-side fix.