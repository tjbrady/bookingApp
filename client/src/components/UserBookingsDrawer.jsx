import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBookings } from '../context/BookingContext';
import { formatDate, toUTCKey } from '../utils/dateUtils';
import './UserBookingsDrawer.css';

const colourMap = {
  Red: '#fee2e2',
  Blue: '#e0f2fe',
  Orange: '#fef3c7',
  Yellow: '#fef9c3',
  Green: '#dcfce7',
};

const colourTextMap = {
  Red: '#991b1b',
  Blue: '#0369a1',
  Orange: '#b45309',
  Yellow: '#854d0e',
  Green: '#166534',
};

const UserBookingsDrawer = () => {
  const {
    myBookings,
    activeBookings,
    historyBookings,
    activeCount,
    loading,
    isDrawerOpen,
    closeDrawer,
    handleCancelBooking,
    fetchMyBookings,
  } = useBookings();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history' | 'all'
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const todayKey = new Date().toISOString().split('T')[0];

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock background scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const displayedBookings =
    activeTab === 'active'
      ? activeBookings
      : activeTab === 'history'
      ? historyBookings
      : myBookings;

  const onCancelClick = async (bookingId, currentStatus) => {
    setActionInProgressId(bookingId);
    try {
      await handleCancelBooking(bookingId, currentStatus);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleNavigateToBookings = () => {
    closeDrawer();
    if (location.pathname !== '/bookings') {
      navigate('/bookings');
    }
  };

  const getStatusBadge = (status, isPast) => {
    if (isPast) {
      if (status === 'confirmed') {
        return <span className="drawer-badge badge-completed">✓ Completed</span>;
      }
      if (status === 'pending' || status === 'cancellation_pending') {
        return <span className="drawer-badge badge-expired">⏱ Expired</span>;
      }
      if (status === 'denied') {
        return <span className="drawer-badge badge-denied">✕ Rejected</span>;
      }
      if (status === 'cancelled') {
        return <span className="drawer-badge badge-cancelled">⊘ Cancelled</span>;
      }
    }

    switch (status) {
      case 'confirmed':
        return <span className="drawer-badge badge-confirmed">✓ Approved</span>;
      case 'pending':
        return <span className="drawer-badge badge-pending">⏳ Pending</span>;
      case 'cancellation_pending':
        return <span className="drawer-badge badge-cancellation-pending">⚠️ Cancellation Requested</span>;
      case 'denied':
        return <span className="drawer-badge badge-denied">✕ Rejected</span>;
      case 'cancelled':
        return <span className="drawer-badge badge-cancelled">⊘ Cancelled</span>;
      default:
        return <span className="drawer-badge badge-default">{status}</span>;
    }
  };

  return (
    <div className="drawer-portal">
      {/* Backdrop overlay */}
      <div className="drawer-backdrop" onClick={closeDrawer} aria-label="Close drawer" />

      {/* Main Drawer Container */}
      <aside className="drawer-container" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        {/* Mobile handle indicator */}
        <div className="drawer-mobile-handle" onClick={closeDrawer}>
          <div className="drawer-handle-bar" />
        </div>

        {/* Header */}
        <header className="drawer-header">
          <div>
            <h2 id="drawer-title" className="drawer-title">
              📋 My Bookings & Requests
            </h2>
            <p className="drawer-subtitle">
              Review your requested, approved, and past reservations
            </p>
          </div>
          <button className="drawer-close-btn" onClick={closeDrawer} title="Close">
            ✕
          </button>
        </header>

        {/* Filter Navigation Tabs */}
        <nav className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            {activeCount > 0 && <span className="drawer-tab-count">{activeCount}</span>}
          </button>
          <button
            className={`drawer-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Past / History
            {historyBookings.length > 0 && (
              <span className="drawer-tab-count subtle">{historyBookings.length}</span>
            )}
          </button>
          <button
            className={`drawer-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({myBookings.length})
          </button>
          <button
            className="drawer-refresh-btn"
            onClick={fetchMyBookings}
            title="Refresh bookings"
            disabled={loading}
          >
            🔄
          </button>
        </nav>

        {/* Content list */}
        <div className="drawer-body">
          {loading && myBookings.length === 0 ? (
            <div className="drawer-empty-state">
              <p>Loading your bookings...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="drawer-empty-state">
              <span className="empty-state-icon">🏖️</span>
              <h3>No bookings found</h3>
              <p>
                {activeTab === 'active'
                  ? "You don't have any upcoming pending or approved bookings."
                  : activeTab === 'history'
                  ? 'No past, completed, or rejected bookings recorded.'
                  : 'You have not made any booking requests yet.'}
              </p>
              <button className="drawer-action-btn primary" onClick={handleNavigateToBookings}>
                📅 Open Calendar to Book
              </button>
            </div>
          ) : (
            <div className="drawer-cards-list">
              {displayedBookings.map((booking) => {
                const startKey = toUTCKey(booking.dateFrom);
                const isPast = startKey <= todayKey;
                const isPending = booking.status === 'pending';
                const isConfirmed = booking.status === 'confirmed';
                const isCancellationPending = booking.status === 'cancellation_pending';
                const isDenied = booking.status === 'denied';
                const isCancelled = booking.status === 'cancelled';
                const isProcessing = actionInProgressId === booking._id;

                return (
                  <article
                    key={booking._id}
                    className={`drawer-card status-${booking.status} ${isPast ? 'is-past' : ''}`}
                  >
                    {/* Card Top Row: Date & Status */}
                    <div className="card-top-row">
                      <div className="card-dates">
                        <span className="card-calendar-icon">📅</span>
                        <div>
                          <div className="card-night-range">
                            Night of <strong>{formatDate(booking.dateFrom)}</strong> to Night of{' '}
                            <strong>{formatDate(booking.dateTo)}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="card-status-wrapper">
                        {getStatusBadge(booking.status, isPast)}
                      </div>
                    </div>

                    {/* Card Middle: Colours Chips & Details */}
                    <div className="card-meta-row">
                      {booking.colours && booking.colours.length > 0 && (
                        <div className="card-colours">
                          {booking.colours.map((col) => (
                            <span
                              key={col}
                              className="card-colour-chip"
                              style={{
                                backgroundColor: colourMap[col] || '#f3f4f6',
                                color: colourTextMap[col] || '#1f2937',
                                borderColor: colourTextMap[col] || '#d1d5db',
                              }}
                            >
                              ● {col}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Status Feedback Banner */}
                    {isCancellationPending && !isPast && (
                      <div className="card-notice notice-warning">
                        <span className="notice-symbol">⚠️</span>
                        <span>
                          <strong>Cancellation Requested:</strong> Awaiting administrator review.
                          Your dates remain reserved until the admin approves withdrawal.
                        </span>
                      </div>
                    )}

                    {isDenied && (
                      <div className="card-notice notice-denied">
                        <span className="notice-symbol">✕</span>
                        <span>
                          <strong>Request Declined:</strong> This reservation was rejected by the
                          administrator.
                        </span>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="card-notice notice-cancelled">
                        <span className="notice-symbol">⊘</span>
                        <span>This booking request was cancelled.</span>
                      </div>
                    )}

                    {isPast && isPending && (
                      <div className="card-notice notice-expired">
                        <span className="notice-symbol">⏱</span>
                        <span>This booking request passed without approval and has expired.</span>
                      </div>
                    )}

                    {/* Card History Accordion if edited by admin */}
                    {booking.editHistory && booking.editHistory.length > 0 && (
                      <div className="card-adjustment-history">
                        <div className="history-header">
                          ✏️ <strong>Admin Date Adjustment:</strong>
                        </div>
                        {booking.editHistory.map((h, i) => (
                          <div key={i} className="history-item">
                            <div>
                              Adjusted by <strong>{h.editedBy?.username || 'Admin'}</strong> on{' '}
                              {formatDate(h.editedAt)}
                            </div>
                            <div className="history-detail">
                              Previous: {formatDate(h.previousDateFrom)} -{' '}
                              {formatDate(h.previousDateTo)}
                            </div>
                            {h.reason && (
                              <div className="history-reason">
                                Reason: <em>"{h.reason}"</em>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card Action Buttons: only available for active/future bookings */}
                    {!isPast && (isPending || isConfirmed) && (
                      <div className="card-actions">
                        {isPending && (
                          <button
                            className="card-btn btn-danger-outline"
                            onClick={() => onCancelClick(booking._id, booking.status)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        )}
                        {isConfirmed && (
                          <button
                            className="card-btn btn-withdraw-outline"
                            onClick={() => onCancelClick(booking._id, booking.status)}
                            disabled={isProcessing}
                            title="Request administrator to withdraw or cancel this approved reservation"
                          >
                            {isProcessing ? 'Submitting...' : 'Request Cancellation / Withdraw'}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="drawer-footer">
          <div className="footer-info">
            <span className="footer-dot green" /> Approved
            <span className="footer-dot amber" /> Pending
            <span className="footer-dot red" /> Rejected
          </div>
          <button className="drawer-close-bottom-btn" onClick={closeDrawer}>
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default UserBookingsDrawer;
