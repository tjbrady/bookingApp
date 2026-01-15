import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
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

const bookableColours = ['Blue', 'Orange', 'Yellow'];

const Bookings = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [publicBookings, setPublicBookings] = useState([]);
  const [colourSchedule, setColourSchedule] = useState([]);
  const [selection, setSelection] = useState({ start: null, end: null });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [scheduleRes, publicBookingsRes, myBookingsRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/bookings/public'),
        api.get('/bookings'),
      ]);
      setColourSchedule(scheduleRes.data);
      setPublicBookings(publicBookingsRes.data);

      let finalMyBookings = myBookingsRes.data;
      if (sessionStorage.getItem('hideCancelledBookings') === 'true') {
        finalMyBookings = myBookingsRes.data.filter(b => b.status !== 'cancelled');
      }
      setMyBookings(finalMyBookings);

    } catch (err) { setError('Failed to load booking data.'); } 
    finally { setLoadingData(false); }
  };

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      fetchAllData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, authLoading]);

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
        if (!bookableColours.includes(weekColor)) {
            alert('Error: Your selection includes dates that are not in a bookable colour period (Blue, Orange, or Yellow).');
            return;
        }
        current = addDaysUTC(current, 1);
    }

    try {
      // Send UTC ISO strings (which backend should respect as dates)
      const res = await api.post('/bookings', { 
          service: 'Date Range Booking', 
          dateFrom: selection.start.toISOString(), // Send strict ISO string
          dateTo: selection.end.toISOString() 
      });
      await fetchAllData();
      setSelection({ start: null, end: null });
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to send request.');
    }
  };

  const handleCancelBooking = async (bookingId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'pending' ? 'cancel' : 'request cancellation for'} this booking?`)) {
      return;
    }

    try {
      const res = await api.put(`/bookings/${bookingId}`, { status: 'cancelled' });
      setMyBookings(myBookings.map(b => b._id === bookingId ? res.data : b));
      if (currentStatus === 'confirmed' && res.data.status === 'cancellation_pending') {
          setPublicBookings(prevPublic => prevPublic.map(pb => pb._id !== bookingId ? pb : { ...pb, status: res.data.status }));
      } else if (res.data.status === 'cancelled') {
          setPublicBookings(prevPublic => prevPublic.filter(pb => pb._id !== bookingId));
      }
      alert(`Booking ${currentStatus === 'pending' ? 'cancelled' : 'cancellation requested'} successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || `Failed to ${currentStatus === 'pending' ? 'cancel' : 'request cancellation'}.`);
    }
  };

  const handleClearCancelled = () => {
    sessionStorage.setItem('hideCancelledBookings', 'true');
    setMyBookings(currentBookings => currentBookings.filter(b => b.status !== 'cancelled'));
  };

  const handleShowAll = () => {
    sessionStorage.removeItem('hideCancelledBookings');
    fetchAllData();
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
        } else if (bookableColours.includes(colour)) {
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
        <div className="month-container" key={monthIndex}>
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

  const hasCancelledBookings = myBookings.some(b => b.status === 'cancelled');
  const isHidingCancelled = sessionStorage.getItem('hideCancelledBookings') === 'true';

    return (
      <div>
        <div className="bookings-sticky-header">

          {/* Single Row, Three-Column Layout */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline', flexWrap: 'wrap' }}>

            {/* Column 1: Main Heading */}
            <div className="header-title-column" style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <h2 style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>Booking Calendar & My Requests</h2>
            </div>

            {/* Column 2: My Bookings List */}
            <div className="header-bookings-list-column" style={{ flex: '2 1 400px', minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0' }}>
                <h3 style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>My Booking Requests</h3>
                {hasCancelledBookings && (
                  <button onClick={handleClearCancelled} style={{ padding: '4px 8px', fontSize: '0.8em', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Clear Cancelled
                  </button>
                )}
                {isHidingCancelled && !hasCancelledBookings && (
                  <button onClick={handleShowAll} style={{ padding: '4px 8px', fontSize: '0.8em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Show All
                  </button>
                )}
              </div>
              {myBookings.length === 0 ? <p style={{marginTop: '0'}}>You have no booking requests.</p> : (
                <ul style={{marginBottom: '1rem', marginTop: '0', listStyle: 'none', padding: 0}}>
                  {myBookings.map((booking) => (
                    <li key={booking._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                      Night of {formatDate(booking.dateFrom)} to Night of {formatDate(booking.dateTo)} - <strong>{booking.status}</strong>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button onClick={() => handleCancelBooking(booking._id, booking.status)} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                              {booking.status === 'pending' ? 'Cancel' : 'Request Cancellation'}
                          </button>
                      )}
                      {booking.status === 'cancellation_pending' && (
                          <span style={{ marginLeft: '10px', color: '#ffc107' }}>Awaiting Admin Review</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Column 3: Instructions */}
            <div className="header-instructions-column instructions-box" style={{ flex: '1 1 450px' }}>
              <h3 style={{ margin: '0', padding: 0, lineHeight: 1.2 }}>How to Request a Booking:</h3>
              <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
                <li style={{ marginBottom: '0.5rem' }}>• Click your first Night to start a booking.</li>
                <li style={{ marginBottom: '0.5rem' }}>• Click your last Night to complete the selection.</li>
                <li style={{ marginBottom: '0.5rem' }}>• Use the "Clear Selection" button if incorrect.</li>
                <li>• Click "Request Booking" to send for approval.</li>
              </ul>
            </div>
          </div>
          
          {/* Selection and Request buttons remain at the bottom */}
          {selection.start && selection.end && (
            <div className="header-action-area" style={{textAlign: 'center', margin: '1rem 0'}}>
              <button onClick={handleRequestBooking}>Request Booking: {formatDate(selection.start)} - {formatDate(selection.end)}</button>
              <button onClick={() => setSelection({start: null, end: null})} style={{marginLeft: '10px'}}>Clear Selection</button>
            </div>
          )}

        </div> {/* End bookings-sticky-header */}

        <div className="calendar-grid-container">
          {Array.from({ length: 12 }, (_, i) => renderMonth(2026, i))}
        </div>
        <div className="calendar-grid-container" style={{marginTop: '2rem'}}>
          {Array.from({ length: 12 }, (_, i) => renderMonth(2027, i))}
        </div>
      </div>
    );
};

export default Bookings;
