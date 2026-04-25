# Booking App: Project Evolution & Summary

This document serves as the authoritative "living record" of the Quinta de São Roque (QSR) Booking Application. It captures the project's purpose, technical infrastructure, core business logic, and a detailed chronological evolution log.

---

## 1. Executive Summary
The QSR Booking App is a bespoke management system designed to coordinate owner occupancy for a shared property in Portugal. It replaces manual spreadsheets with a secure, automated platform that manages user registrations, booking requests, and complex rotating schedules.

## 2. Infrastructure & Technical Stack
The application is built using the **MERN** stack and hosted on **Render** for high availability and automated deployment.

*   **Frontend:** React (Vite) hosted on `bookingApp-static`.
*   **Backend:** Node.js & Express hosted on `bookingApp`.
*   **Database:** MongoDB Atlas (NoSQL) for flexible data storage.
*   **Notifications:** Gmail API (Production Status) for reliable automated email communication.
*   **Source Control:** GitHub (`tjbrady/bookingApp`) with PAT-based synchronization.

## 3. Core Business Logic (The 4-Year Cycle)
The heart of the application is the rotating occupancy schedule, which follows a strict 4-year cycle defined by management.

*   **Owner Shares:** Red, Yellow (Split into Orange/Yellow), Green, and Blue.
*   **Rotation Pattern:** `Red -> Yellow (Orange/Yellow) -> Green -> Blue`.
*   **Block Structure:** 11 blocks per year with specific week lengths (`4, 6, 6, 5, 6, 2, 2, 8, 4, 6, 3`).
*   **Maintenance:** The schedule is **not** algorithmic. Admin users manually input dates from management documentation into the `FourYearCycleSetup` dashboard.

## 4. Roadmap & Future Developments
*   **Advanced Analytics:** Enhanced reporting on occupancy rates and owner usage patterns.
*   **UI/UX Refinements:** Ongoing polish of the mobile experience and schedule editor responsiveness.

## 5. Evolution Log (Chronological)

### 25Apr26
*   **UX:** Implemented **Dynamic Year Shifting** on the Bookings page, ensuring the calendar always displays the current and subsequent year automatically.
*   **UX:** Added **Auto-Scrolling** functionality that smoothly centers the current month in the viewport upon page load, improving navigation efficiency.
*   **UX:** Enhanced the **Project Summary Modal** with a persistent header and close button, ensuring easy dismissal regardless of scroll depth.

### 16Apr26
*   **Feature:** Integrated "Project Evolution Summary" viewer into the Admin Dashboard.
*   **Implementation:** Added a full-screen modal with on-the-fly Markdown rendering using `react-markdown`.
*   **Security:** Moved `projectSummary.md` to the server root and protected the access via Admin-only API endpoints.

### 10Apr26
*   **Infrastructure:** Successfully migrated Gmail API to "Publish" (Production) status in Google Cloud.
*   **Verification:** Verified that refresh tokens no longer expire every 7 days, ensuring long-term notification stability.

### 05Apr26
*   **Feature:** Implemented Admin Diagnostic Tools, including the "Email Status Checker" and "Send Test Email" utility with styled HTML templates.

### 22Nov25
*   **UX:** Performed a major split of the Admin Dashboard. Separated frequent tasks (approvals) from rare tasks (4-year cycle setup).
*   **Feature:** Introduced the `ScheduleTableEditor` for direct date entry, replacing the previous "paint-the-weeks" interface.

### 01Nov25
*   **Inception:** Initial setup of the React frontend and Node.js backend. Established the MongoDB schema for Users, Bookings, and Schedules.
