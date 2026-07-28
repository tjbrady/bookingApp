import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ReportContext } from '../context/ReportContext';
import PushNotificationToggle from './PushNotificationToggle';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const { generateUserReport, reportLoading, reportError } = useContext(ReportContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePrintUserReportClick = async () => {
    await generateUserReport();
    if (reportError) {
        alert(reportError);
    }
  };

  const authLinks = (
    <>
      <li className="navbar-dropdown-parent">
        <Link to="/bookings">Bookings</Link>
        <ul className="navbar-dropdown">
          <li><button onClick={handlePrintUserReportClick} disabled={reportLoading}>
              {reportLoading ? 'Generating...' : 'Print Report'}
          </button></li>
        </ul>
      </li>
      {user?.role === 'admin' && (
        <li className="navbar-dropdown-parent">
          <Link to="/admin">Admin</Link>
          <ul className="navbar-dropdown">
            <li><Link to="/admin/cycle-setup">4 Year Cycle Setup</Link></li>
          </ul>
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
