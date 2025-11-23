import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import ReactMarkdown from 'react-markdown';
import './Home.css';

const Home = () => {
  const [notifications, setNotifications] = useState([]);
  const [messageOfTheDay, setMessageOfTheDay] = useState('');
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchMessage = async () => {
        try {
            const res = await api.get('/settings/messageOfTheDay');
            setMessageOfTheDay(res.data.value);
        } catch (err) {
            console.error('Failed to fetch message of the day:', err);
        }
    };
    fetchMessage();

    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleDismiss = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  return (
    <div>
      <h1 style={{textAlign: 'center', marginBottom: '1rem'}}>Welcome to the Apartment 4C Booking Portal - {user ? user.username : 'Guest'}</h1>
      <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 2rem auto', fontSize: '1.1em'}}>
        Please see if you can create a user ID by registering using the menu on the top right. Then have a look at the options for requesting time, please have a good play with the system and give me your feedback.
      </p>

      {messageOfTheDay && (
          <section className="motd-container" style={{maxWidth: '800px', margin: '2rem auto'}}>
              <ReactMarkdown>{messageOfTheDay}</ReactMarkdown>
          </section>
      )}

      {isAuthenticated && notifications.length > 0 && (
        <section className="notifications-container" style={{maxWidth: '800px', margin: '2rem auto'}}>
          <h3>Notifications</h3>
          <ul>
            {notifications.map(n => (
              <li key={n._id}>
                <span>{n.message}</span>
                <button onClick={() => handleDismiss(n._id)} title="Dismiss">×</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Home;