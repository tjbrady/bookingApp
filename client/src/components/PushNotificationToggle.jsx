import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPushSubscriptionState, subscribeUserToPush, unsubscribeUserFromPush } from '../utils/pushNotifications';

const PushNotificationToggle = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionState = async () => {
    try {
      const state = await getPushSubscriptionState();
      setSupported(state.supported);
      setSubscribed(state.subscribed);
    } catch (err) {
      console.error('Error fetching push notification state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionState();
    }
  }, [isAuthenticated]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeUserFromPush();
        setSubscribed(false);
      } else {
        await subscribeUserToPush();
        setSubscribed(true);
      }
    } catch (err) {
      alert(err.message || 'Error configuring push notifications.');
      fetchSubscriptionState();
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !supported) return null;

  return (
    <div className="push-toggle-container" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          backgroundColor: subscribed ? '#ffe6e6' : '#e6f2ff',
          color: subscribed ? '#c0392b' : '#2980b9',
          border: '1px solid',
          borderColor: subscribed ? '#f5b7b1' : '#a9cce3',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'all 0.2s ease',
        }}
        title={subscribed ? 'Disable notifications on this device' : 'Enable notifications on this device'}
      >
        <span>{subscribed ? '🔕 Disable Push' : '🔔 Enable Push'}</span>
      </button>
    </div>
  );
};

export default PushNotificationToggle;
