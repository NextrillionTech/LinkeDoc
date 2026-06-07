import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Feed } from './pages/Feed';
import { ProfileBuilder } from './pages/ProfileBuilder';
import { Network } from './pages/Network';
import { Forums } from './pages/Forums';
import { JobBoard } from './pages/JobBoard';
import { CreateJob } from './pages/CreateJob';
import { Messaging } from './pages/Messaging';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './services/api';
import './App.css';

// SVG Icons for the LinkedIn Navigation clone
const HomeIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NetworkIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ForumsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
);

const JobsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const AdminIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`linkedin-nav-item ${isActive ? 'active' : ''}`}>
      <span className="linkedin-nav-icon">{icon}</span>
      <span className="linkedin-nav-label">{label}</span>
    </Link>
  );
};

const HeaderBar: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="linkedin-header">
      <div className="linkedin-header-content">
        {/* Left: Logo and Search bar */}
        <div className="linkedin-header-left">
          <Link to="/" className="linkedin-brand-logo">
            <img src="/logo.svg" alt="LinkeDoc Logo" />
          </Link>

          {user && (
            <div className="linkedin-search-container">
              <span className="linkedin-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="linkedin-search-input"
              />
            </div>
          )}
        </div>

        {/* Right: Nav items */}
        {user ? (
          <div className="linkedin-header-right">
            <nav className="linkedin-nav-menu">
              <NavItem to="/" icon={<HomeIcon />} label="Home" />
              <NavItem to="/network" icon={<NetworkIcon />} label="My Network" />
              <NavItem to="/forums" icon={<ForumsIcon />} label="Forums" />
              <NavItem to="/jobs" icon={<JobsIcon />} label="Jobs" />
              <NavItem to="/chat" icon={<ChatIcon />} label="Messaging" />
              {user.role === 'ADMIN' && (
                <NavItem to="/admin" icon={<AdminIcon />} label="Admin" />
              )}
            </nav>

            {/* "Me" Profile dropdown */}
            <div className="linkedin-me-menu-container" ref={dropdownRef}>
              <button
                className="linkedin-me-trigger-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="linkedin-me-avatar">
                  {getInitials(user.name)}
                </div>
                <span className="linkedin-me-label-row">
                  Me <span className="caret-down">▼</span>
                </span>
              </button>

              {dropdownOpen && (
                <div className="card-glass linkedin-me-dropdown-card">
                  <div className="me-dropdown-profile-summary">
                    <div className="me-dropdown-avatar">
                      {getInitials(user.name)}
                    </div>
                    <div className="me-dropdown-details">
                      <div className="me-dropdown-name">{user.role === 'ADMIN' ? user.name : `Dr. ${user.name}`}</div>
                      <div className="me-dropdown-specialty">
                        {user.role} {user.specialty ? `• ${user.specialty}` : ''}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="btn-primary me-dropdown-view-profile-btn"
                    onClick={() => setDropdownOpen(false)}
                    style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
                  >
                    View Profile
                  </Link>

                  <div className="me-dropdown-divider"></div>

                  <div className="me-dropdown-section">
                    <h4 className="me-dropdown-section-header">Manage</h4>
                    <Link to="/forums" className="me-dropdown-link" onClick={() => setDropdownOpen(false)}>
                      Posts & Discussions
                    </Link>
                    <Link to="/jobs" className="me-dropdown-link" onClick={() => setDropdownOpen(false)}>
                      Job Postings
                    </Link>
                  </div>

                  <div className="me-dropdown-divider"></div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="me-dropdown-logout-btn"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="linkedin-header-right">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Medical Professionals Network
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState(api.getCurrentUser());

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <Router>
      <div className="app-viewport-wrapper">
        <HeaderBar user={user} onLogout={handleLogout} />

        <main className="app-main-content-container">
          <Routes>
            <Route path="/" element={user ? <Feed /> : <Auth />} />
            <Route path="/profile" element={<ProfileBuilder />} />
            <Route path="/network" element={<Network />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/chat" element={<Messaging />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
