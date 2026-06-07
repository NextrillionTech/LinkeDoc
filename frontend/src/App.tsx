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
import { Groups } from './pages/Groups';
import { api } from './services/api';
import './App.css';

// Lucide React Icons
import {
  Home,
  Users,
  Layers,
  Briefcase,
  MessageSquare,
  Shield,
  Search,
  ChevronDown,
  User,
  LogOut,
  FolderOpen
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  // Match exact root or path prefixes
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

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
          <Link to="/" className="linkedin-brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="LinkeDoc Logo" style={{ height: '34px' }} />
          </Link>

          {user && (
            <div className="linkedin-search-container">
              <span className="linkedin-search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search professionals, papers, groups..."
                className="linkedin-search-input"
              />
            </div>
          )}
        </div>

        {/* Right: Nav items */}
        {user ? (
          <div className="linkedin-header-right">
            <nav className="linkedin-nav-menu">
              <NavItem to="/" icon={<Home size={22} />} label="Home" />
              <NavItem to="/network" icon={<Users size={22} />} label="My Network" />
              <NavItem to="/groups" icon={<FolderOpen size={22} />} label="Groups" />
              <NavItem to="/forums" icon={<Layers size={22} />} label="Forums" />
              <NavItem to="/jobs" icon={<Briefcase size={22} />} label="Jobs" />
              <NavItem to="/chat" icon={<MessageSquare size={22} />} label="Messaging" />
              {user.role === 'ADMIN' && (
                <NavItem to="/admin" icon={<Shield size={22} />} label="Admin" />
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
                <span className="linkedin-me-label-row" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Me <ChevronDown size={14} />
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
                    style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <User size={14} /> View Profile
                  </Link>

                  <div className="me-dropdown-divider"></div>

                  <div className="me-dropdown-section">
                    <h4 className="me-dropdown-section-header">Manage</h4>
                    <Link to="/forums" className="me-dropdown-link" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={14} /> Posts & Discussions
                    </Link>
                    <Link to="/jobs" className="me-dropdown-link" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={14} /> Job Postings
                    </Link>
                  </div>

                  <div className="me-dropdown-divider"></div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="me-dropdown-logout-btn"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                  >
                    <LogOut size={14} /> Sign Out
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
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<Groups />} />
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
