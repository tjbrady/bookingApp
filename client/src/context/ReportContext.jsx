import React, { createContext, useContext, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const { user } = useContext(AuthContext);

  // Helper function to render HTML content to PDF with specific options
  const printHtmlToPdf = async (htmlContent, reportFileName, options = {}) => {
    setReportLoading(true);
    setReportError('');

    const { fontSize = '8pt' } = options;

    const reportContentElement = document.createElement('div');
    // Use a fixed pixel width that's larger, to be scaled down.
    reportContentElement.style.width = '1000px'; 
    reportContentElement.style.padding = '20px';
    reportContentElement.style.backgroundColor = 'white';
    reportContentElement.style.fontFamily = 'sans-serif';
    reportContentElement.style.color = '#333';
    reportContentElement.style.fontSize = fontSize;


    const style = `
      <style>
        table { table-layout: fixed; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; word-wrap: break-word; font-size: 8pt; }
        h1 { font-size: 14pt; margin-bottom: 10px; }
        h2 { font-size: 12pt; margin-bottom: 8px; }
        p { font-size: 8pt; }
      </style>
    `;

    reportContentElement.innerHTML = style + htmlContent;
    document.body.appendChild(reportContentElement);

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        await pdf.html(reportContentElement, {
            callback: function (doc) {
                doc.save(reportFileName);
            },
            // Force the render to start at top-left, with a specific width in mm
            x: 10,
            y: 10,
            width: 190, // A4 is 210mm wide, 10mm margin each side
            windowWidth: 1000 // Should match the element width
        });
    } catch (e) {
        setReportError("Failed to generate PDF report.");
        console.error("Error generating PDF:", e);
    } finally {
        document.body.removeChild(reportContentElement);
        setReportLoading(false);
    }
  };


  const generateCsvContent = (data, headers, fileName) => {
      const csvRows = [];
      csvRows.push(headers.map(h => `"${h}"`).join(','));
      data.forEach(row => {
          csvRows.push(headers.map(h => `"${row[h]}"`).join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };


  const generateUserReport = async () => {
      setReportLoading(true);
      setReportError('');
      try {
          const [publicBookingsRes, myBookingsRes] = await Promise.all([
              api.get('/bookings/public'),
              api.get('/bookings'),
          ]);
          
          const reportTitle = `Booking Report - ${new Date().toLocaleDateString()}`;
          const reportFileName = `booking_report_${new Date().toISOString().substring(0, 10)}.pdf`;
          let html = `<h1>${reportTitle}</h1>`;
          html += `<h2>My Bookings (${user?.username || 'Guest'})</h2>`;
          if (myBookingsRes.data.length === 0) {
              html += '<p>No personal booking requests.</p>';
          } else {
              html += `<table><thead><tr><th>From</th><th>To</th><th>Service</th><th>Status</th></tr></thead><tbody>`;
              myBookingsRes.data.forEach(b => {
                  html += `<tr><td>${new Date(b.dateFrom).toLocaleDateString()}</td><td>${new Date(b.dateTo).toLocaleDateString()}</td><td>${b.service}</td><td>${b.status}</td></tr>`;
              });
              html += '</tbody></table>';
          }

          html += '<h2>All Public Bookings (Confirmed & Pending)</h2>';
          if (publicBookingsRes.data.length === 0) {
              html += '<p>No public bookings yet.</p>';
          } else {
              html += `<table><thead><tr><th>User</th><th>From</th><th>To</th><th>Service</th><th>Status</th></tr></thead><tbody>`;
              publicBookingsRes.data.forEach(b => {
                  html += `<tr><td>${b.user?.username || 'N/A'}</td><td>${new Date(b.dateFrom).toLocaleDateString()}</td><td>${new Date(b.dateTo).toLocaleDateString()}</td><td>${b.service}</td><td>${b.status}</td></tr>`;
              });
              html += '</tbody></table>';
          }
          // User report options: larger font, less aggressive scale
          await printHtmlToPdf(html, reportFileName, { fontSize: '10pt', scale: 0.9, x: 10, y: 10, width: '190mm' });

      } catch (err) {
          setReportError('Failed to fetch data for user report.');
          console.error(err);
      } finally {
          setReportLoading(false);
      }
  };


  const generateAdminPdfReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
        const [usersRes, allBookingsRes, colourScheduleRes] = await Promise.all([
            api.get('/admin/users'),
            api.get('/admin/bookings'),
            api.get('/admin/schedule'),
        ]);

        const reportTitle = `Admin Report - ${new Date().toLocaleDateString()}`;
        const reportFileName = `admin_report_${new Date().toISOString().substring(0, 10)}.pdf`;
        let html = `<h1>${reportTitle}</h1>`;

        // Section 1: All Users
        html += '<h2>All Users</h2>';
        if (usersRes.data.length === 0) {
            html += '<p>No users found.</p>';
        } else {
            html += `<table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>`;
            usersRes.data.forEach(u => {
                html += `<tr><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td>${u.status}</td></tr>`;
            });
            html += '</tbody></table>';
        }

        // Section 2: All Bookings
        html += '<h2>All Bookings</h2>';
        if (allBookingsRes.data.length === 0) {
            html += '<p>No bookings found.</p>';
        } else {
            html += `<table><thead><tr><th>User</th><th>From</th><th>To</th><th>Service</th><th>Status</th></tr></thead><tbody>`;
            allBookingsRes.data.forEach(b => {
                html += `<tr><td>${b.user?.username || 'N/A'}</td><td>${new Date(b.dateFrom).toLocaleDateString()}</td><td>${new Date(b.dateTo).toLocaleDateString()}</td><td>${b.service}</td><td>${b.status}</td></tr>`;
            });
            html += '</tbody></table>';
        }

        // Section 3: Colour Schedule Settings
        html += '<h2>Colour Schedule Settings (4-Year Rolling)</h2>';
        if (colourScheduleRes.data.length === 0) {
            html += '<p>No schedule settings found.</p>';
        } else {
            html += `<table><thead><tr><th>Colour</th><th>Start Date</th><th>End Date</th></tr></thead><tbody>`;
            colourScheduleRes.data.forEach(s => {
                html += `<tr><td>${s.color}</td><td>${new Date(s.startDate).toLocaleDateString()}</td><td>${new Date(s.endDate).toLocaleDateString()}</td></tr>`;
            });
            html += '</tbody></table>';
        }

        // Admin report options: smaller font, more aggressive scale
        await printHtmlToPdf(html, reportFileName, { fontSize: '7pt', scale: 0.7, x: 5, y: 5, width: '200mm' });

    } catch (err) {
        setReportError('Failed to fetch data for admin PDF report.');
        console.error(err);
    } finally {
        setReportLoading(false);
    }
  };


  const generateAdminCsvReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
        const [usersRes, allBookingsRes, colourScheduleRes] = await Promise.all([
            api.get('/admin/users'),
            api.get('/admin/bookings'),
            api.get('/admin/schedule'),
        ]);

        const date = new Date().toISOString().substring(0, 10);
        
        // Users CSV
        if (usersRes.data.length > 0) {
            const userHeaders = ['_id', 'username', 'email', 'role', 'status', 'createdAt'];
            generateCsvContent(usersRes.data, userHeaders, `admin_users_report_${date}.csv`);
        }

        // Bookings CSV
        if (allBookingsRes.data.length > 0) {
            const bookingHeaders = ['_id', 'user_username', 'dateFrom', 'dateTo', 'service', 'status', 'createdAt'];
            // Flatten user object for CSV
            const flatBookings = allBookingsRes.data.map(b => ({
                ...b,
                user_username: b.user?.username || 'N/A',
                dateFrom: new Date(b.dateFrom).toLocaleDateString(),
                dateTo: new Date(b.dateTo).toLocaleDateString(),
            }));
            generateCsvContent(flatBookings, bookingHeaders, `admin_bookings_report_${date}.csv`);
        }

        // Colour Schedule CSV
        if (colourScheduleRes.data.length > 0) {
            const scheduleHeaders = ['_id', 'colour', 'startDate', 'endDate']; // Changed 'color' to 'colour'
            const flatSchedule = colourScheduleRes.data.map(s => ({
                ...s,
                colour: s.color, // Map s.color to s.colour for CSV header consistency
                startDate: new Date(s.startDate).toLocaleDateString(),
                endDate: new Date(s.endDate).toLocaleDateString(),
            }));
            generateCsvContent(flatSchedule, scheduleHeaders, `admin_schedule_report_${date}.csv`);
        }

        alert('Admin reports (CSV) generated successfully!');

    } catch (err) {
        setReportError('Failed to fetch data for admin CSV report.');
        console.error(err);
    } finally {
        setReportLoading(false);
    }
  };


  return (
    <ReportContext.Provider value={{ generateUserReport, generateAdminPdfReport, generateAdminCsvReport, reportLoading, reportError }}>
      {children}
    </ReportContext.Provider>
  );
};