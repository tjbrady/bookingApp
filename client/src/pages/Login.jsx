import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api';
import './Form.css';

const Login = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'awake', 'sleeping'
  const navigate = useNavigate();

  const { email, password } = formData;

  useEffect(() => {
    let timer;
    const checkServer = async () => {
      // If server doesn't respond in 1.5s, assume it's sleeping and show message
      timer = setTimeout(() => {
        setServerStatus('sleeping');
      }, 1500);

      try {
        await api.get('/health');
        setServerStatus('awake');
      } catch (err) {
        console.log('Health check failed:', err);
        // If it fails with a response, the server is technically 'awake' but erroring.
        // If no response (err.request), it might be down or waking up.
        if (err.response) {
            setServerStatus('awake');
        }
      } finally {
        clearTimeout(timer);
      }
    };

    checkServer();

    return () => clearTimeout(timer);
  }, []);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      // Enhanced error reporting
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server Error ${err.response.status}: ${err.response.data.msg || 'An error occurred.'}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('Login failed: The server is not responding. Is the backend server running?');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Login failed: An unexpected error occurred. ${err.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>Login</h2>
        
        {serverStatus === 'sleeping' && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid #ffeeba'
          }}>
            <strong>Waking up the server...</strong><br/>
            This may take up to a minute if the app has been inactive. Please wait.
          </div>
        )}

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>
          <button 
            type="submit" 
            className="form-button" 
            disabled={isLoggingIn}
            style={{ opacity: isLoggingIn ? 0.7 : 1, cursor: isLoggingIn ? 'not-allowed' : 'pointer' }}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;