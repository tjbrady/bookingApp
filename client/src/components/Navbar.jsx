import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ReportContext } from '../context/ReportContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const { generateUserReport, generateAdminPdfReport, generateAdminCsvReport, reportLoading, reportError } = useContext(ReportContext);
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
  
  const handlePrintAdminPdfReportClick = async () => {
    await generateAdminPdfReport();
    if (reportError) {
        alert(reportError);
    }
  };

  const handleGenerateAdminCsvReportClick = async () => {
    await generateAdminCsvReport();
    if (reportError) {
        alert(reportError);
    }
  };


  const authLinks = (
    <>
      <li className="navbar-dropdown-parent">
        <Link to="/bookings">My Bookings</Link>
        <ul className="navbar-dropdown">
          <li><button onClick={handlePrintUserReportClick} disabled={reportLoading}>
              {reportLoading ? 'Generating...' : 'Print Report'}
          </button></li>
        </ul>
      </li>
      {user?.role === 'admin' && (
        <li className="navbar-dropdown-parent">
          <Link to="/admin">Admin Dashboard</Link>
          <ul className="navbar-dropdown">
            {/* Removed 'Booking & User Mgmt' as it's now the direct link */}
            <li><Link to="/admin/cycle-setup">4 Year Cycle Setup</Link></li>
            <li><button onClick={handlePrintAdminPdfReportClick} disabled={reportLoading}>
                {reportLoading ? 'Generating PDF...' : 'Print Admin Report (PDF)'}
            </button></li>
            <li><button onClick={handleGenerateAdminCsvReportClick} disabled={reportLoading}>
                {reportLoading ? 'Generating CSV...' : 'Export Admin Report (CSV)'}
            </button></li>
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