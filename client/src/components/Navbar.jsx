import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import PushNotificationToggle from './PushNotificationToggle';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const { openDrawer, activeCount } = useBookings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <>
      <li>
        <Link to="/bookings">Bookings</Link>
      </li>
      <li>
        <button
          type="button"
          onClick={openDrawer}
          className="navbar-my-bookings-btn"
          title="View your booking requests and status"
        >
          <span className="hide-mobile-word">My </span>Requests
          {activeCount > 0 && <span className="navbar-booking-badge">{activeCount}</span>}
        </button>
      </li>
      {(user?.role === 'admin' || user?.role === 'SU') && (
        <li>
          <Link to="/admin">Admin</Link>
        </li>
      )}
      <li style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <PushNotificationToggle />
      </li>
      <li className="navbar-user-block">
        <span className="navbar-welcome">Welcome, {user?.username}</span>
        <a href="#!" onClick={handleLogout} className="navbar-logout">
          Logout
        </a>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li style={{ marginLeft: 'auto' }}>
        <Link to="/login">Login</Link>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
    </>
  );

  return (
    <nav>
      <ul className="navbar-list">
        <li>
          <Link to="/">Home</Link>
        </li>
        {!loading && <>{isAuthenticated ? authLinks : guestLinks}</>}
      </ul>
    </nav>
  );
};

export default Navbar;
