import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="navbar-logo">
            TaskFlow
          </Link>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>
            {/* Add more nav items here if needed, e.g., Profile, Users */}
          </ul>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-info">
              <span className="username">Welcome, {user.username}</span>
              <button onClick={logout} className="btn btn-danger btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" className="btn btn-outline">Register</Link>
            </div>
          )}

          <div
            className={`hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 