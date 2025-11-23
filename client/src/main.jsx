import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Bookings from './pages/Bookings.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import FourYearCycleSetup from './pages/FourYearCycleSetup.jsx'; // New Import
import AdminRoute from './components/AdminRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReportProvider } from './context/ReportContext.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "bookings",
        element: <Bookings />,
      },
      {
        path: "admin",
        element: <AdminRoute />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "cycle-setup", element: <FourYearCycleSetup /> } // New Admin Sub-route
        ]
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ReportProvider>
        <RouterProvider router={router} />
      </ReportProvider>
    </AuthProvider>
  </React.StrictMode>,
);