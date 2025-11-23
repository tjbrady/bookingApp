import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <div>
      <header className="app-header">
        <video className="header-video" autoPlay loop muted playsInline>
         <source src="/banner01.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="header-navbar">
          <Navbar />
        </div>
        <h1 className="banner-text">Apartment 4C QSR Booking Portal</h1> {/* New heading */}
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;