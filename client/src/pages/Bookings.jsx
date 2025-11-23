import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
// Removed html2canvas and jsPDF imports
import './Calendar.css';

const colourMap = { // Changed to colourMap
  Red: '#ffcccb',
  Blue: '#add8e6',
  Orange: '#ffd700',
  Yellow: '#ffffe0',
  Green: '#90ee90',
};
const bookableColours = ['Blue', 'Orange', 'Yellow']; // Changed to bookableColours

const getStartOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

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
        let current = getStartOfWeek(new Date(entry.startDate));
        const endDate = new Date(entry.endDate);
        while (current <= endDate) {
            map.set(current.toISOString().substring(0, 10), entry.color);
            current.setDate(current.getDate() + 7);
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
            map.set(current.toISOString().substring(0, 10), {
                username: booking.user.username,
                status: booking.status,
            });
            current.setDate(current.getDate() + 1);
        }
    });
    return map;
  }, [publicBookings]);

  const handleDayClick = (date, booking) => {
    if (booking?.status === 'confirmed') return;

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

    let current = new Date(selection.start);
    while (current <= selection.end) {
        const dateKey = current.toISOString().substring(0, 10);
        const weekStartKey = getStartOfWeek(current).toISOString().substring(0, 10);
        
        if (bookingMap.get(dateKey)?.status === 'confirmed') {
            alert('Error: Your selection overlaps with a confirmed booking.');
            return;
        }

        const weekColor = scheduleMap.get(weekStartKey) || '';
        if (!bookableColours.includes(weekColor)) {
            alert('Error: Your selection includes dates that are not in a bookable colour period (Blue, Orange, or Yellow).');
            return;
        }
        current.setDate(current.getDate() + 1);
    }

    try {
      const res = await api.post('/bookings', { service: 'Date Range Booking', dateFrom: selection.start, dateTo: selection.end });
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
    const firstDay = new Date(year, monthIndex, 1);
    const monthName = firstDay.toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) { days.push(<div key={`empty-${i}`} className="day-cell not-current-month"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        date.setHours(0,0,0,0);
        const dateKey = date.toISOString().substring(0, 10);
        const weekStartKey = getStartOfWeek(date).toISOString().substring(0, 10);
        const colour = scheduleMap.get(weekStartKey) || '';
        const booking = bookingMap.get(dateKey);

        let className = "day-cell";
        if (booking) {
            className += ` ${booking.status}`;
        } else if (bookableColours.includes(colour)) {
            className += ' bookable';
        }
        
        if (selection.start && selection.end && date >= selection.start && date <= selection.end) {
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
            >
                <div className="day-number">{day}</div>
                {booking && (
                    <div className="booking-status-icon" title={`Status: ${booking.status}\nUser: ${booking.username}`}>
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
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <h2 style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>Booking Calendar & My Requests</h2>
            </div>

            {/* Column 2: My Bookings List */}
            <div style={{ flex: '2 1 400px', minWidth: '300px' }}>
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
                      {new Date(booking.dateFrom).toLocaleDateString()} to {new Date(booking.dateTo).toLocaleDateString()} - <strong>{booking.status}</strong>
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
            <div style={{ flex: '1 1 300px' }} className="instructions-box">
              <h3 style={{ margin: '0', padding: 0, lineHeight: 1.2 }}>How to Request a Booking:</h3>
              <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
                <li style={{ marginBottom: '0.5rem' }}>• Click a start date on the calendar.</li>
                <li style={{ marginBottom: '0.5rem' }}>• Click an end date to complete your selection.</li>
                <li style={{ marginBottom: '0.5rem' }}>• Use the "Clear Selection" button if incorrect.</li>
                <li>• Click "Request Booking" to send for approval.</li>
              </ul>
            </div>
          </div>
          
          {/* Selection and Request buttons remain at the bottom */}
          {selection.start && selection.end && (
            <div style={{textAlign: 'center', margin: '1rem 0'}}>
              <button onClick={handleRequestBooking}>Request Booking: {selection.start.toLocaleDateString()} - {selection.end.toLocaleDateString()}</button>
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