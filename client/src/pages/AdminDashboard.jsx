import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/dateUtils';
import './AdminDashboard.css';

const MessageOfTheDayManager = () => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const res = await api.get('/settings/messageOfTheDay');
                setMessage(res.data.value);
            } catch (e) {
                console.error("Could not fetch message", e);
            }
        };
        fetchMessage();
    }, []);

    const handleSaveMessage = async () => {
        setStatus('Saving...');
        try {
            await api.post('/admin/settings', { key: 'messageOfTheDay', value: message });
            setStatus('Saved successfully!');
        } catch {
            setStatus('Failed to save.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    return (
        <section>
            <h3>Home Page Message</h3>
            <p>Write a message for the home page. Supports Markdown for formatting.</p>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
            <button className="btn-admin btn-approve" onClick={handleSaveMessage} style={{ marginTop: '10px' }}>Save Message</button>
            {status && <p><em>{status}</em></p>}
        </section>
    );
};

const EmailStatusChecker = () => {
    const { user } = useContext(AuthContext);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [testTemplate, setTestTemplate] = useState('basic');

    useEffect(() => {
        const fetchEmailStatus = async () => {
            try {
                const res = await api.get('/admin/email-status');
                setStatus(res.data);
            } catch (e) {
                console.error("Could not fetch email status", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEmailStatus();
        
        // Pre-fill test email with current user's email if available
        if (user && user.email) {
            setTestEmail(user.email);
        }
    }, [user]);

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setTestResult({ success: false, message: 'Please enter a recipient email.' });
            return;
        }

        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await api.post('/admin/test-email', { 
                recipientEmail: testEmail,
                template: testTemplate
            });
            setTestResult({ success: true, message: res.data.msg });
        } catch (e) {
            console.error("Test email failed", e);
            setTestResult({ success: false, message: e.response?.data?.msg || 'Test email failed.' });
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) return <p>Checking email status...</p>;
    if (!status) return null;

    return (
        <section style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: status.configured ? '#f0fff0' : '#fff0f0'
        }}>
            <h3 style={{ marginTop: 0 }}>Email System Status</h3>
            {status.configured ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ color: 'green', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                            ✅ Email system is configured and ready.
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            <strong>Current Config (Masked):</strong>
                            <ul style={{ margin: '5px 0' }}>
                                {Object.entries(status.details).map(([key, value]) => (
                                    <li key={key}>{key}: <code>{value}</code></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '250px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Recipient Email:</label>
                            <input 
                                type="email" 
                                value={testEmail} 
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="test@example.com"
                                style={{ 
                                    padding: '6px', 
                                    width: '200px', 
                                    borderRadius: '4px', 
                                    border: '1px solid #ccc' 
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Email Template:</label>
                            <select 
                                value={testTemplate} 
                                onChange={(e) => setTestTemplate(e.target.value)}
                                style={{ 
                                    padding: '6px', 
                                    width: '214px', 
                                    borderRadius: '4px', 
                                    border: '1px solid #ccc' 
                                }}
                            >
                                <option value="basic">Basic Test Email</option>
                                <option value="user_approved">Account Approved</option>
                                <option value="user_rejected">Account Rejected</option>
                                <option value="booking_approved">Booking Approved</option>
                                <option value="booking_rejected">Booking Rejected</option>
                            </select>
                        </div>
                        <button 
                            className="btn-admin btn-approve"
                            onClick={handleSendTestEmail} 
                            disabled={testLoading}
                        >
                            {testLoading ? 'Sending...' : 'Send Test Email'}
                        </button>
                        {testResult && (
                            <p style={{ 
                                margin: '10px 0 0 0', 
                                color: testResult.success ? 'green' : 'red',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                maxWidth: '250px',
                                wordBreak: 'break-word'
                            }}>
                                {testResult.message}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ color: 'red' }}>
                    <p style={{ fontWeight: 'bold' }}>❌ Email system is NOT fully configured.</p>
                    <p>Missing variables: {status.missingVars.join(', ')}</p>
                    <p><em>Check your Render environment variables or .env file.</em></p>
                </div>
            )}
        </section>
    );
};

const PushNotificationStatusChecker = () => {
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testMessage, setTestMessage] = useState('');
    const [testTarget, setTestTarget] = useState('self');
    const [testUsername, setTestUsername] = useState('');

    const handleSendTestPush = async () => {
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await api.post('/admin/test-push', { 
                message: testMessage,
                target: testTarget,
                username: testTarget === 'user' ? testUsername : undefined
            });
            setTestResult({ success: true, message: res.data.msg });
        } catch (e) {
            console.error("Test push failed", e);
            setTestResult({ success: false, message: e.response?.data?.msg || 'Test push failed.' });
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <section style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: '#f9f9f9'
        }}>
            <h3 style={{ marginTop: 0 }}>Push Notification System</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: '0 0 10px 0' }}>
                        Use this utility to dispatch a test Web Push notification.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 10px 0' }}>
                        <strong>Target options:</strong> Send to yourself, broadcast to all subscribed devices, or target a specific user.
                    </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '250px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Target Audience:</label>
                        <select 
                            value={testTarget} 
                            onChange={(e) => setTestTarget(e.target.value)}
                            style={{ 
                                padding: '6px', 
                                width: '214px', 
                                borderRadius: '4px', 
                                border: '1px solid #ccc' 
                            }}
                        >
                            <option value="self">Myself (Admin)</option>
                            <option value="all">All Subscribed Users</option>
                            <option value="user">Specific User</option>
                        </select>
                    </div>

                    {testTarget === 'user' && (
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Target Username:</label>
                            <input 
                                type="text" 
                                value={testUsername} 
                                onChange={(e) => setTestUsername(e.target.value)}
                                placeholder="Enter username"
                                style={{ 
                                    padding: '6px', 
                                    width: '200px', 
                                    borderRadius: '4px', 
                                    border: '1px solid #ccc' 
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Custom Alert Message (Optional):</label>
                        <input 
                            type="text" 
                            value={testMessage} 
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Enter test message"
                            style={{ 
                                padding: '6px', 
                                width: '200px', 
                                borderRadius: '4px', 
                                border: '1px solid #ccc' 
                            }}
                        />
                    </div>
                    <button 
                        className="btn-admin btn-approve"
                        onClick={handleSendTestPush} 
                        disabled={testLoading}
                    >
                        {testLoading ? 'Dispatched...' : 'Send Test Push'}
                    </button>
                    {testResult && (
                        <p style={{ 
                            margin: '10px 0 0 0', 
                            color: testResult.success ? 'green' : 'red',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            maxWidth: '250px',
                            wordBreak: 'break-word'
                        }}>
                            {testResult.message}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};


const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '10px 15px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: isOpen ? '1px solid #ccc' : 'none',
                    fontWeight: 'bold'
                }}
            >
                <span>{title}</span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && <div style={{ padding: '15px' }}>{children}</div>}
        </div>
    );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Audit history and date edit states
  const [editingBooking, setEditingBooking] = useState(null);
  const [editDateFrom, setEditDateFrom] = useState('');
  const [editDateTo, setEditDateTo] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toggledHistory, setToggledHistory] = useState({});
  const [expandedUserConfig, setExpandedUserConfig] = useState({});
  const [userConfigDrafts, setUserConfigDrafts] = useState({});

  const handleToggleUserConfig = (u) => {
    setExpandedUserConfig(prev => {
      const isOpening = !prev[u._id];
      if (isOpening) {
        setUserConfigDrafts(drafts => ({
          ...drafts,
          [u._id]: {
            permissions: {
              canEditApprovedBookings: u.permissions?.canEditApprovedBookings ?? true,
              canDeleteUsers: u.permissions?.canDeleteUsers ?? true,
              canClearSchedules: u.permissions?.canClearSchedules ?? true,
            },
            managedColours: u.managedColours || [],
            allowedBookableColours: u.allowedBookableColours || []
          }
        }));
      }
      return { ...prev, [u._id]: isOpening };
    });
  };

  const handlePermissionCheckboxChange = (userId, field, checked) => {
    setUserConfigDrafts(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        permissions: {
          ...prev[userId].permissions,
          [field]: checked
        }
      }
    }));
  };

  const handleColourCheckboxChange = (userId, arrayField, colour, checked) => {
    setUserConfigDrafts(prev => {
      const currentList = prev[userId]?.[arrayField] || [];
      const newList = checked 
        ? [...currentList, colour] 
        : currentList.filter(c => c !== colour);
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          [arrayField]: newList
        }
      };
    });
  };

  const handleSaveUserConfig = async (userId) => {
    const draft = userConfigDrafts[userId];
    if (!draft) return;
    try {
      await api.patch(`/admin/users/${userId}`, draft);
      alert('Permissions and scopes updated successfully!');
      setExpandedUserConfig(prev => ({ ...prev, [userId]: false }));
      await fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to update permissions.';
      alert(errorMsg);
    }
  };

  const handleToggleHistory = (id) => {
    setToggledHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenEditDatesModal = (booking) => {
    setEditingBooking(booking);
    // Format dates to YYYY-MM-DD for the input type="date"
    const fromStr = new Date(booking.dateFrom).toISOString().split('T')[0];
    const toStr = new Date(booking.dateTo).toISOString().split('T')[0];
    setEditDateFrom(fromStr);
    setEditDateTo(toStr);
    setEditReason('');
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleSaveAdjustedDates = async (e) => {
    e.preventDefault();
    if (!editReason.trim()) {
      setEditModalError('A reason for adjustment is required.');
      return;
    }
    setIsSavingEdit(true);
    setEditModalError('');
    try {
      await api.patch(`/bookings/${editingBooking._id}/admin-adjust`, {
        dateFrom: editDateFrom,
        dateTo: editDateTo,
        reason: editReason
      });
      setIsEditModalOpen(false);
      setEditingBooking(null);
      await fetchData(); // Refresh list
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to adjust booking dates.';
      setEditModalError(errorMsg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get('/admin/project-summary');
      setSummaryContent(res.data.content);
      setShowSummary(true);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to fetch project summary.';
      setError(errorMsg);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [usersRes, bookingsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/bookings'),
      ]);
      setUsers(usersRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      setError('Failed to fetch admin data.');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleUpdateUser = async (id, field, value) => {
    try {
      const payload = { [field]: value };
      const res = await api.patch(`/admin/users/${id}`, payload);
      setUsers(users.map(u => u._id === id ? res.data : u));
      await fetchData(); // Refetch to ensure consistency
    } catch (err) {
      setError(`Failed to update ${field} for user ${id}`);
      console.error(err);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (window.confirm(`ARE YOU SURE you want to delete user "${username}"? This will also DELETE ALL BOOKINGS associated with this user. This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers(users.filter(u => u._id !== id));
        // Also remove their bookings from the local state to reflect the change immediately
        setBookings(bookings.filter(b => b.user?._id !== id));
      } catch (err) {
        setError(`Failed to delete user ${username}`);
        console.error(err);
      }
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const res = await api.put(`/bookings/${id}`, { status });
      setBookings(bookings.map(b => b._id === id ? res.data : b));
      await fetchData(); // Refetch to ensure consistency
    } catch (err) {
      console.error(err);
      setError(`Failed to update status for booking ${id}`);
    }
  };
  
  const handleDeleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this booking?')) {
      try {
        await api.delete(`/bookings/${id}`);
        setBookings(bookings.filter(b => b._id !== id));
      } catch (err) {
        console.error(err);
        setError(`Failed to delete booking ${id}`);
      }
    }
  };

  const handleClearAllBookings = async () => {
    if (window.confirm('ARE YOU SURE you want to permanently delete ALL bookings for ALL users? This action cannot be undone.')) {
      if (window.confirm('FINAL CONFIRMATION: Delete all bookings?')) {
        setLoadingData(true);
        try {
          await api.delete('/admin/bookings/all');
          alert('All bookings have been deleted.');
          await fetchData(); // Refetch data to show empty lists
        } catch (err) {
          console.error(err);
          setError('Failed to delete all bookings.');
        } finally {
          setLoadingData(false);
        }
      }
    }
  };

  const handleClearBookingsByYear = async (year) => {
    if (window.confirm(`ARE YOU SURE you want to permanently delete all bookings for the year ${year}? This action cannot be undone.`)) {
      setLoadingData(true);
      try {
        await api.delete(`/admin/bookings/year/${year}`);
        alert(`All bookings for ${year} have been deleted.`);
        await fetchData(); // Refetch data to show empty lists
      } catch (err) {
        console.error(err);
        setError(`Failed to delete bookings for ${year}.`);
      } finally {
        setLoadingData(false);
      }
    }
  };

  const handleExport = async (reportName, apiUrl) => {
    setExporting(true);
    try {
      const response = await api.get(apiUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportName}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to export ${reportName}.`);
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const renderUserActions = (u) => {
    // 1. Prevent actions on the currently logged-in admin
    if (user && u._id === user.id) {
        return <span style={{ color: '#666', fontStyle: 'italic' }} title="You cannot modify your own account">Current User</span>;
    }

    // 2. Protect SU accounts from being modified or deleted by non-SUs, and protect the specific Super Admin email
    if (u.role === 'SU' && user?.role !== 'SU') {
        return <span style={{ color: 'purple', fontWeight: 'bold' }} title="Protected Super User Account">Super User</span>;
    }

    if (u.email === 'bradytj@gmail.com') {
        return <span style={{ color: 'purple', fontWeight: 'bold' }} title="Protected Super Admin Account">Super Admin</span>;
    }

    let actionButtons = null;
    switch (u.status) {
      case 'pending':
        actionButtons = (
          <>
            <button className="btn-admin btn-approve" onClick={() => handleUpdateUser(u._id, 'status', 'active')} style={{ marginRight: '5px' }}>Approve</button>
            <button className="btn-admin btn-remove" onClick={() => handleUpdateUser(u._id, 'status', 'rejected')} style={{ marginRight: '5px' }}>Reject</button>
          </>
        );
        break;
      case 'active':
        actionButtons = <button className="btn-admin btn-remove" onClick={() => handleUpdateUser(u._id, 'status', 'rejected')} style={{ marginRight: '5px' }}>Revoke Access</button>;
        break;
      case 'rejected':
        actionButtons = <button className="btn-admin btn-approve" onClick={() => handleUpdateUser(u._id, 'status', 'active')} style={{ marginRight: '5px' }}>Re-Approve</button>;
        break;
      default:
        break;
    }

    const showConfigBtn = user?.role === 'SU' && u.status === 'active';

    return (
        <>
            {actionButtons}
            {showConfigBtn && (
                <button className="btn-admin btn-neutral" onClick={() => handleToggleUserConfig(u)} style={{ marginRight: '5px' }}>
                    {expandedUserConfig[u._id] ? 'Hide Settings' : '⚙️ Permissions'}
                </button>
            )}
            <button className="btn-admin btn-remove" onClick={() => handleDeleteUser(u._id, u.username)}>Delete</button>
        </>
    );
  };

  if (loading || loadingData) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const pendingBookingRequests = bookings.filter(b => b.status === 'pending');
  const pendingCancellationRequests = bookings.filter(b => b.status === 'cancellation_pending');

  const filteredBookings = bookings.filter(b => {
      if (statusFilter === 'all') return true;
      return b.status === statusFilter;
  });


  return (
    <div className="admin-dashboard-container">
      <h2 className="admin-dashboard-title">Admin Dashboard</h2>

      <Accordion title="Reports">
        <p>Project documentation and CSV data exports.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button className="btn-admin btn-summary" onClick={fetchSummary} disabled={loadingSummary}>
            {loadingSummary ? 'Loading...' : 'View Project Summary'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-admin btn-neutral" onClick={() => handleExport('booking_report', '/admin/reports/bookings')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Booking Report (CSV)'}
          </button>
          <button className="btn-admin btn-neutral" onClick={() => handleExport('user_report', '/admin/reports/users')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export User Report (CSV)'}
          </button>
          <button className="btn-admin btn-neutral" onClick={() => handleExport('4yr_summary_report', '/admin/reports/schedule-summary')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export 4yr Summary Report (CSV)'}
          </button>
          <button className="btn-admin btn-neutral" onClick={() => handleExport('4yr_detail_report', '/admin/reports/schedule-detail')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export 4yr Detail Report (CSV)'}
          </button>
        </div>
      </Accordion>
      
      <Accordion title="Danger Zone">
          <p style={{ color: 'red', fontWeight: 'bold' }}>Caution: These actions permanently delete booking data and should only be used when setting up a new 4-year cycle.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-admin btn-remove" onClick={handleClearAllBookings}>Clear All Bookings</button>
            <button className="btn-admin btn-decline" onClick={() => handleClearBookingsByYear(2026)}>Clear 2026 Bookings</button>
            <button className="btn-admin btn-decline" onClick={() => handleClearBookingsByYear(2027)}>Clear 2027 Bookings</button>
          </div>
      </Accordion>

      <Accordion title="Email System Status">
        <EmailStatusChecker />
      </Accordion>

      <Accordion title="Push Notification Status">
        <PushNotificationStatusChecker />
      </Accordion>

      <Accordion title="Home Page Message">
        <MessageOfTheDayManager />
      </Accordion>
      
      <Accordion title="Pending Booking Requests" defaultOpen={pendingBookingRequests.length > 0}>
        {pendingBookingRequests.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Dates</th>
                  <th>Colour</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookingRequests.map(b => (
                  <tr key={b._id}>
                    <td>{b.user?.username || 'N/A'}</td>
                    <td>{formatDate(b.dateFrom)} - {formatDate(b.dateTo)}</td>
                    <td>{b.colours?.join(', ') || 'N/A'}</td>
                    <td>
                        <div className="action-group">
                            <button className="btn-admin btn-approve" onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}>Approve</button>
                            <button className="btn-admin btn-decline" onClick={() => handleUpdateBookingStatus(b._id, 'denied')}>Decline</button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No pending booking requests.</p>}
      </Accordion>

      <Accordion title="Pending Cancellation Requests" defaultOpen={pendingCancellationRequests.length > 0}>
        {pendingCancellationRequests.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Dates</th>
                  <th>Colour</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCancellationRequests.map(b => (
                  <tr key={b._id}>
                    <td>{b.user?.username || 'N/A'}</td>
                    <td>{formatDate(b.dateFrom)} - {formatDate(b.dateTo)}</td>
                    <td>{b.colours?.join(', ') || 'N/A'}</td>
                    <td>
                        <div className="action-group">
                            <button className="btn-admin btn-remove" onClick={() => handleUpdateBookingStatus(b._id, 'cancelled')}>Approve Cancellation</button>
                            <button className="btn-admin btn-approve" onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}>Deny Cancellation</button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No pending cancellation requests.</p>}
      </Accordion>

      <Accordion title="All Bookings">
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label htmlFor="statusFilter"><strong>Filter by Status:</strong></label>
            <select 
                id="statusFilter"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="denied">Denied</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled (User)</option>
                <option value="cancellation_pending">Cancellation Pending</option>
            </select>
        </div>

        {filteredBookings.length > 0 ? (
        <div className="table-responsive">
            <table className="admin-table">
                <thead>
                <tr>
                    <th>User</th>
                    <th>Dates</th>
                    <th>Colour</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredBookings.map(b => (
                    <tr key={b._id} style={{ opacity: (b.status === 'cancelled' || b.status === 'denied') ? 0.6 : 1 }}>
                    <td>{b.user?.username || 'N/A'}</td>
                    <td>
                      <div>{formatDate(b.dateFrom)} - {formatDate(b.dateTo)}</div>
                      {b.editHistory && b.editHistory.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc' }} onClick={() => handleToggleHistory(b._id)}>
                            {toggledHistory[b._id] ? 'Hide History' : `📜 Show History (${b.editHistory.length})`}
                          </span>
                        </div>
                      )}
                      {b.editHistory && b.editHistory.length > 0 && toggledHistory[b._id] && (
                        <div style={{ background: '#f5f5f5', borderLeft: '3px solid #ff9800', padding: '6px', marginTop: '6px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', maxWidth: '280px' }}>
                          <strong>Edit History:</strong>
                          {b.editHistory.map((h, i) => (
                            <div key={i} style={{ borderBottom: i < b.editHistory.length - 1 ? '1px dashed #ddd' : 'none', paddingBottom: '4px', paddingTop: '4px' }}>
                              <div>✏️ <strong>{h.editedBy?.username || 'Admin'}</strong> on {formatDate(h.editedAt)}</div>
                              <div><strong>Was:</strong> {formatDate(h.previousDateFrom)} - {formatDate(h.previousDateTo)}</div>
                              <div><strong>Reason:</strong> <em>"{h.reason}"</em></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{b.colours?.join(', ') || 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{b.status === 'cancelled' ? 'cancelled (user)' : b.status}</td>
                    <td>
                        <div className="action-group">
                            {b.status === 'confirmed' && (
                                <>
                                    <button className="btn-admin btn-neutral" onClick={() => handleOpenEditDatesModal(b)} style={{ marginRight: '5px' }}>Edit Dates</button>
                                    <button className="btn-admin btn-decline" onClick={() => handleUpdateBookingStatus(b._id, 'denied')}>Decline</button>
                                </>
                            )}
                            {(b.status === 'denied' || b.status === 'cancelled' || b.status === 'pending') && (
                                <button className="btn-admin btn-approve" onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}>Approve</button>
                            )}
                            {b.status === 'pending' && (
                                <>
                                    <button className="btn-admin btn-neutral" onClick={() => handleOpenEditDatesModal(b)} style={{ marginRight: '5px' }}>Edit Dates</button>
                                    <button className="btn-admin btn-decline" onClick={() => handleUpdateBookingStatus(b._id, 'denied')}>Decline</button>
                                </>
                            )}
                            <button className="btn-admin btn-remove" onClick={() => handleDeleteBooking(b._id)}>Remove</button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        ) : <p>No bookings found for the selected filter.</p>}
      </Accordion>

      <Accordion title="User Management">
        <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <React.Fragment key={u._id}>
                    <tr>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.status}</td>
                      <td>
                          <select 
                              value={u.role} 
                              onChange={(e) => handleUpdateUser(u._id, 'role', e.target.value)}
                              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                              disabled={u.role === 'SU' && user?.role !== 'SU'}
                          >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="SU">SU</option>
                          </select>
                      </td>
                      <td>
                          <div className="action-group">
                              {renderUserActions(u)}
                          </div>
                      </td>
                    </tr>
                    {expandedUserConfig[u._id] && userConfigDrafts[u._id] && (
                      <tr key={`${u._id}-config`} style={{ background: '#f9fafd' }}>
                        <td colSpan="5" style={{ padding: '15px', borderBottom: '2px solid #007bff' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#0056b3', textAlign: 'left' }}>⚙️ Permissions & Scopes for {u.username}</h4>
                            
                            {/* 1. Administrative Action Checkboxes */}
                            {(u.role === 'admin' || u.role === 'SU') && (
                              <div style={{ textAlign: 'left' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Administrative Actions:</strong>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={userConfigDrafts[u._id].permissions.canEditApprovedBookings} 
                                      onChange={(e) => handlePermissionCheckboxChange(u._id, 'canEditApprovedBookings', e.target.checked)}
                                    />
                                    Can Edit Approved Bookings
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={userConfigDrafts[u._id].permissions.canDeleteUsers} 
                                      onChange={(e) => handlePermissionCheckboxChange(u._id, 'canDeleteUsers', e.target.checked)}
                                    />
                                    Can Delete Users
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={userConfigDrafts[u._id].permissions.canClearSchedules} 
                                      onChange={(e) => handlePermissionCheckboxChange(u._id, 'canClearSchedules', e.target.checked)}
                                    />
                                    Can Clear Schedules & Bookings
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* 2. Bookable Colours Scopes */}
                            <div style={{ textAlign: 'left' }}>
                              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Allowed Bookable Colours (For Requesting):</strong>
                              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                {['Blue', 'Red', 'Orange', 'Yellow', 'Green'].map(col => (
                                  <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={userConfigDrafts[u._id].allowedBookableColours.includes(col)} 
                                      onChange={(e) => handleColourCheckboxChange(u._id, 'allowedBookableColours', col, e.target.checked)}
                                    />
                                    <span style={{ 
                                      display: 'inline-block', 
                                      width: '10px', 
                                      height: '10px', 
                                      borderRadius: '50%', 
                                      background: col === 'Yellow' ? '#e1b12c' : col.toLowerCase() 
                                    }}></span>
                                    {col}
                                  </label>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                                <em>Note: If empty, this user cannot request bookings for any weeks.</em>
                              </span>
                            </div>

                            {/* 3. Managed Colours Scopes (Only for Admin/SU) */}
                            {(u.role === 'admin' || u.role === 'SU') && (
                              <div style={{ textAlign: 'left' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Managed Colours (For Approving/Confirming):</strong>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                  {['Blue', 'Red', 'Orange', 'Yellow', 'Green'].map(col => (
                                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={userConfigDrafts[u._id].managedColours.includes(col)} 
                                        onChange={(e) => handleColourCheckboxChange(u._id, 'managedColours', col, e.target.checked)}
                                      />
                                      <span style={{ 
                                        display: 'inline-block', 
                                        width: '10px', 
                                        height: '10px', 
                                        borderRadius: '50%', 
                                        background: col === 'Yellow' ? '#e1b12c' : col.toLowerCase() 
                                      }}></span>
                                      {col}
                                    </label>
                                  ))}
                                </div>
                                <span style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                                  <em>Note: If empty, this admin cannot confirm or decline any bookings.</em>
                                </span>
                              </div>
                            )}

                            {/* 4. Save Controls */}
                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '5px' }}>
                              <button className="btn-admin btn-approve" onClick={() => handleSaveUserConfig(u._id)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                Save Settings
                              </button>
                              <button className="btn-admin btn-neutral" onClick={() => setExpandedUserConfig(prev => ({ ...prev, [u._id]: false }))} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
        </div>
      </Accordion>

      {showSummary && (
        <div className="summary-modal-overlay" onClick={() => setShowSummary(false)}>
          <div className="summary-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="summary-modal-header">
              <button className="summary-modal-close" onClick={() => setShowSummary(false)}>&times;</button>
            </div>
            <div className="summary-modal-body">
              <div className="summary-markdown-body">
                <ReactMarkdown>{summaryContent}</ReactMarkdown>
              </div>
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <button className="btn-admin btn-neutral" onClick={() => setShowSummary(false)}>Close Summary</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingBooking && (
        <div className="summary-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="summary-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="summary-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Adjust Booking Dates</h3>
              <button className="summary-modal-close" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>
                Adjusting booking for <strong>{editingBooking.user?.username || 'N/A'}</strong>. The owner will be notified of this change immediately via email and push notification.
              </p>
              
              {editModalError && (
                <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
                  {editModalError}
                </div>
              )}

              <form onSubmit={handleSaveAdjustedDates}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={editDateFrom} 
                    onChange={(e) => setEditDateFrom(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>End Date</label>
                  <input 
                    type="date" 
                    value={editDateTo} 
                    onChange={(e) => setEditDateTo(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Reason for Adjustment</label>
                  <textarea 
                    value={editReason} 
                    onChange={(e) => setEditReason(e.target.value)} 
                    placeholder="Provide a reason (e.g., Typo correction, scheduled shift)"
                    required
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-admin btn-neutral" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-admin btn-approve" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
