/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { registerServiceWorker } from '../utils/pushNotifications';

// Initial State
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  user: null,
  loading: true,
};

// Action Types
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGOUT = 'LOGOUT';
const AUTH_ERROR = 'AUTH_ERROR';
const USER_LOADED = 'USER_LOADED';

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
      };
    case LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case AUTH_ERROR:
    case LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
      };
    default:
      return state;
  }
};

// Create Context
export const AuthContext = createContext(initialState);

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    // Register background service worker
    registerServiceWorker();

    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            dispatch({ type: AUTH_ERROR });
            return;
          }

          // Fetch the latest up-to-date user data from the backend
          try {
            const res = await api.get('/auth/me');
            dispatch({ type: USER_LOADED, payload: res.data });
          } catch (apiErr) {
            console.error('Failed to fetch user from backend, falling back to token:', apiErr.message);
            // Fallback to decoded token payload in case backend is unreachable but token is valid
            dispatch({ type: USER_LOADED, payload: decoded.user });
          }
        }
        catch {
          dispatch({ type: AUTH_ERROR });
        }
      }
      else {
        dispatch({ type: AUTH_ERROR }); // Ensures loading is set to false
      }
    };
    loadUser();
  }, []);

  // Actions
  const login = async (formData) => {
    try {
      const res = await api.post('/auth/login', formData);
      const { token } = res.data;
      const decoded = jwtDecode(token);
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { token, user: decoded.user },
      });
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
      throw err;
    }
  };
  
  // The register function now just calls the API and does not change auth state
  const register = async (formData) => {
    return await api.post('/auth/register', formData);
  };

  const logout = () => dispatch({ type: LOGOUT });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register, // Keep for API call, but component will handle state
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
