/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import { toUTCKey } from '../utils/dateUtils';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchMyBookings = useCallback(async () => {
    if (!isAuthenticated) {
      setMyBookings([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bookings');
      setMyBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch personal bookings:', err);
      setError('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBookings();
    } else {
      setMyBookings([]);
      setIsDrawerOpen(false);
    }
  }, [isAuthenticated, fetchMyBookings]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  const handleCancelBooking = useCallback(async (bookingId, currentStatus, onStatusChange) => {
    const isPending = currentStatus === 'pending';
    const confirmMessage = isPending
      ? 'Are you sure you want to cancel this pending booking request?'
      : 'Confirmed bookings cannot be cancelled directly.\n\nWould you like to submit a cancellation/withdrawal request to the administrators?';

    if (!window.confirm(confirmMessage)) {
      return false;
    }

    try {
      const res = await api.put(`/bookings/${bookingId}`, { status: 'cancelled' });
      // Update local state
      setMyBookings(prev => prev.map(b => (b._id === bookingId ? res.data : b)));

      if (onStatusChange) {
        onStatusChange(res.data, currentStatus);
      }

      if (isPending) {
        alert('Your booking request has been cancelled.');
      } else {
        alert('Your cancellation request has been submitted to the administrator for review.');
      }
      return true;
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert(err.response?.data?.msg || `Failed to ${isPending ? 'cancel' : 'request cancellation for'} booking.`);
      return false;
    }
  }, []);

  const activeBookings = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    return myBookings
      .filter((b) => {
        const startKey = toUTCKey(b.dateFrom);
        const isFuture = startKey > todayKey;
        return isFuture && ['pending', 'confirmed', 'cancellation_pending'].includes(b.status);
      })
      .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
  }, [myBookings]);

  const historyBookings = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    return myBookings
      .filter((b) => {
        const startKey = toUTCKey(b.dateFrom);
        const isPast = startKey <= todayKey;
        // Past bookings (even if confirmed/pending) or cancelled/denied bookings
        return isPast || ['cancelled', 'denied'].includes(b.status);
      })
      .sort((a, b) => new Date(b.dateFrom) - new Date(a.dateFrom));
  }, [myBookings]);

  const activeCount = activeBookings.length;

  const value = {
    myBookings,
    activeBookings,
    historyBookings,
    activeCount,
    loading,
    error,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    fetchMyBookings,
    handleCancelBooking,
    setMyBookings,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
