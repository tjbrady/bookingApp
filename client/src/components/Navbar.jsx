import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <>
      <li className="navbar-dropdown-parent">
        <Link to="/bookings">My Bookings</Link>
      </li>
      {user?.role === 'admin' && (
        <li className="navbar-dropdown-parent">
          <Link to="/admin">Admin Dashboard</Link>
          <ul className="navbar-dropdown">
            <li><Link to="/admin/cycle-setup">4 Year Cycle Setup</Link></li>
          </ul>
        </li>
      )}
      <li className="navbar-welcome">
        <em>Welcome, {user?.username}</em>
      </li>
      <li>
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
