import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { ReportContext } from '../context/ReportContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import { useNavigate } from 'react-router-dom';
import { formatDate, toUTCKey, createUTCDate, getStartOfWeekUTC, addDaysUTC } from '../utils/dateUtils';
import './Calendar.css';

const colourMap = {
  Red: '#ffcccb',
  Blue: '#add8e6',
  Orange: '#ffa500',
  Yellow: '#ffff00',
  Green: '#90ee90',
};

const Bookings = () => {
  const { myBookings, activeCount, openDrawer, fetchMyBookings } = useBookings();
  const [publicBookings, setPublicBookings] = useState([]);
  const [colourSchedule, setColourSchedule] = useState([]);
  const [selection, setSelection] = useState({ start: null, end: null });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const { generateUserReport, reportLoading, reportError } = useContext(ReportContext);
  const navigate = useNavigate();

  const handlePrintUserReportClick = async () => {
    await generateUserReport();
    if (reportError) {
        alert(reportError);
    }
  };

  const userBookableColours = useMemo(() => {
    if (user?.role === 'SU') {
      return ['Blue', 'Red', 'Orange', 'Yellow', 'Green'];
    }
    return user?.allowedBookableColours || [];
  }, [user]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const monthsToShow = useMemo(() => {
    const months = [];
    // Start 2 months in the past, render a total of 26 months (2 past + current + 23 future)
    for (let i = -2; i < 24; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      months.push({ year: date.getFullYear(), month: date.getMonth() });
    }
    return months;
  }, [currentYear, currentMonth]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [scheduleRes, publicBookingsRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/bookings/public'),
      ]);
      setColourSchedule(scheduleRes.data);
      setPublicBookings(publicBookingsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load booking data.');
    } 
    finally { setLoadingData(false); }
  };

  // Keep publicBookings calendar display in sync if user changes booking status in drawer
  useEffect(() => {
    if (!loadingData && isAuthenticated) {
      api.get('/bookings/public')
        .then(res => setPublicBookings(res.data))
        .catch(err => console.error('Failed to sync calendar bookings:', err));
    }
  }, [myBookings, loadingData, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      fetchAllData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, authLoading]);

  // Auto-scroll to current month
  useEffect(() => {
    if (!loadingData && !authLoading && isAuthenticated) {
      const targetId = `month-${currentYear}-${currentMonth}`;
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loadingData, authLoading, isAuthenticated, currentYear, currentMonth]);

  const scheduleMap = useMemo(() => {
    const map = new Map();
    colourSchedule.forEach(entry => {
        // Use UTC date logic
        let current = getStartOfWeekUTC(new Date(entry.startDate));
        const endDate = new Date(entry.endDate);
        // endDate is from DB (UTC string), new Date() parses it.
        // If entry.endDate is '2026-10-10T00:00:00.000Z', new Date is local.
        // We should ensure endDate is treated as UTC timestamp or object
        // Actually, toUTCKey works on date objects regardless of how they were created 
        // IF we are consistent.
        // But getStartOfWeekUTC expects a date object and treats its UTC components as the truth.
        // So we must ensure 'current' and 'endDate' are comparable.
        // Let's rely on toUTCKey for the key, and UTC timestamp comparison for the loop.
        
        // Re-parsing to ensure we strictly use the UTC values
        // If entry.startDate is "2026-01-01T00:00:00Z"
        // new Date() might be shifted. 
        // Safer: createUTCDate from the string components? 
        // Actually, standard ISO strings are parsed as UTC by new Date(string).
        // The issue is methods like getDay() vs getUTCDay().
        // getStartOfWeekUTC uses getUTCDay(), so it works on the UTC time.
        
        while (current <= endDate) {
            map.set(toUTCKey(current), entry.color);
            current = addDaysUTC(current, 7);
        }
    });
    return map;
  }, [colourSchedule]);

  const bookingMap = useMemo(() => {
    const map = new Map();
    publicBookings.forEach(booking => {
        let current = new Date(booking.dateFrom);
        const endDate = new Date(booking.dateTo);
        while (current <= endDate) {
            map.set(toUTCKey(current), {
                username: booking.user?.username || 'Unknown',
                status: booking.status,
            });
            current = addDaysUTC(current, 1);
        }
    });
    return map;
  }, [publicBookings]);

  const handleDayClick = (date, booking) => {
    // date here is passed from renderMonth, so it is a UTC midnight date object.
    
    if (booking && ['confirmed', 'pending', 'cancellation_pending'].includes(booking.status)) {
        alert(`Booking Details:\nUser: ${booking.username}\nStatus: ${booking.status}`);
        return;
    }

    if (!selection.start || (selection.start && selection.end)) {
      setSelection({ start: date, end: null });
    } else {
      if (date < selection.start) {
        setSelection({ start: date, end: selection.start });
      } else {
        setSelection({ start: selection.start, end: date });
      }
    }
  };
  
  const handleRequestBooking = async () => {
    if (!selection.start || !selection.end) return;

    let current = new Date(selection.start); // Clone the UTC date
    while (current <= selection.end) {
        const dateKey = toUTCKey(current);
        const weekStartKey = toUTCKey(getStartOfWeekUTC(current));
        
        const bookingStatus = bookingMap.get(dateKey)?.status;
        if (bookingStatus && ['confirmed', 'pending', 'cancellation_pending'].includes(bookingStatus)) {
            alert('Error: Your selection overlaps with an existing confirmed or pending booking.');
            return;
        }

        const weekColor = scheduleMap.get(weekStartKey) || '';
        if (!userBookableColours.includes(weekColor)) {
            alert(`Error: Your selection includes dates in ${weekColor || 'an unconfigured'} period which you are not authorized to book.`);
            return;
        }
        current = addDaysUTC(current, 1);
    }

    try {
      // Send UTC ISO strings (which backend should respect as dates)
      await api.post('/bookings', { 
          service: 'Date Range Booking', 
          dateFrom: selection.start.toISOString(), // Send strict ISO string
          dateTo: selection.end.toISOString() 
      });
      await fetchAllData();
      await fetchMyBookings();
      setSelection({ start: null, end: null });
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to send request.');
    }
  };

  const renderMonth = (year, monthIndex) => {
    // IMPORTANT: Create dates as UTC to match DB and avoid timezone shifts
    const firstDay = createUTCDate(year, monthIndex, 1);
    const monthName = firstDay.toLocaleString('default', { month: 'long', timeZone: 'UTC' }); 
    // Calculate days in month using UTC logic
    // Day 0 of next month gives last day of current month
    const daysInMonth = createUTCDate(year, monthIndex + 1, 0).getUTCDate(); 
    const startingDay = firstDay.getUTCDay(); // 0-6

    const days = [];
    for (let i = 0; i < startingDay; i++) { days.push(<div key={`empty-${i}`} className="day-cell not-current-month"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = createUTCDate(year, monthIndex, day);
        const dateKey = toUTCKey(date);
        const weekStartKey = toUTCKey(getStartOfWeekUTC(date));
        
        const colour = scheduleMap.get(weekStartKey) || '';
        const booking = bookingMap.get(dateKey);

        let className = "day-cell";
        if (booking) {
            className += ` ${booking.status}`;
        } else if (userBookableColours.includes(colour)) {
            className += ' bookable';
        }
        
        // Use getTime() for comparisons as it returns absolute ms timestamp
        if (selection.start && selection.end && date.getTime() >= selection.start.getTime() && date.getTime() <= selection.end.getTime()) {
            if(date.getTime() === selection.start.getTime()) className += ' selection-start';
            else if(date.getTime() === selection.end.getTime()) className += ' selection-end';
            else className += ' selection-mid';
        } else if (selection.start && !selection.end && date.getTime() === selection.start.getTime()) {
            className += ' selection-start';
        }

        days.push(
            <div
              key={day}
              className={className}
              onClick={() => handleDayClick(date, booking)}
              style={{ backgroundColor: colour ? colourMap[colour] : null }}
              title={booking ? `Status: ${booking.status}\nUser: ${booking.username}` : ''}
            >
                {selection.start && date.getTime() === selection.start.getTime() ? (
                  <div className="selection-text">From Night of {day}</div>
                ) : selection.end && date.getTime() === selection.end.getTime() ? (
                  <div className="selection-text">To Night of {day}</div>
                ) : (
                  <div className="day-number">{day}</div>
                )}
                {booking && (
                    <div className="booking-status-icon">
                        {booking.status === 'confirmed' ? '✓' : booking.status === 'pending' ? '?' : ''}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="month-container" key={monthIndex} id={`month-${year}-${monthIndex}`}>
            <div className="month-header">{monthName} {year}</div>
            <div className="day-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="day-header">{d}</div>)}
                {days}
            </div>
        </div>
    );
  };
  
  if (authLoading || loadingData) return <p>Loading Calendar...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <div className="bookings-sticky-header">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="header-title-column" style={{ flex: '1 1 300px', minWidth: '240px' }}>
            <div className="bookings-request-notice" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="notice-icon">💡</span>
                <span className="notice-text">
                  <strong>Blue, Orange & Yellow - ONLY!</strong><br />
                  Bookings are for nights. (e.g. Fri - Sun means you leave Monday morning)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="btn-my-requests-trigger"
                  title="View your booking requests and status"
                >
                  📋 My Requests {activeCount > 0 && <span className="bookings-header-badge">{activeCount}</span>}
                </button>
                <button 
                  onClick={handlePrintUserReportClick} 
                  disabled={reportLoading}
                  className="btn-print-report"
                >
                  📄 {reportLoading ? 'Generating...' : 'Print Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="header-instructions-column instructions-box" style={{ flex: '1 1 350px' }}>
            <h3 style={{ margin: '0', padding: 0, lineHeight: 1.2 }}>How to Request a Booking:</h3>
            <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
              <li style={{ marginBottom: '0.5rem' }}>• Click your first Night to start a booking.</li>
              <li style={{ marginBottom: '0.5rem' }}>• Click your last Night to complete the selection.</li>
              <li style={{ marginBottom: '0.5rem' }}>• Use the "Clear Selection" button if incorrect.</li>
              <li>• Click "Request Booking" to send for approval.</li>
            </ul>
          </div>
        </div>

        {selection.start && selection.end && (
          <div className="header-action-area" style={{textAlign: 'center', margin: '1rem 0'}}>
            <button onClick={handleRequestBooking}>Request Booking: {formatDate(selection.start)} - {formatDate(selection.end)}</button>
            <button onClick={() => setSelection({start: null, end: null})} style={{marginLeft: '10px'}}>Clear Selection</button>
          </div>
        )}
      </div>

      {/* Floating Action Pill on Mobile for quick access anywhere on the calendar */}
      <button
        className="mobile-bookings-fab"
        onClick={openDrawer}
        type="button"
        aria-label="View My Requests"
      >
        📋 My Requests {activeCount > 0 && <span className="fab-badge">{activeCount}</span>}
      </button>

      <div className="calendar-grid-container">
        {monthsToShow.map(({ year, month }) => (
          <React.Fragment key={`${year}-${month}`}>
            {renderMonth(year, month)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Bookings;
