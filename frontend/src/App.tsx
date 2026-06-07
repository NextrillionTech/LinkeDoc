import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { ProfileBuilder } from './pages/ProfileBuilder';
import { Network } from './pages/Network';
import { Forums } from './pages/Forums';
import { api } from './services/api';
import './App.css';

export const App: React.FC = () => {
  const [user, setUser] = useState(api.getCurrentUser());

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <Router>
      <div>
        <nav className="navbar">
          <Link to="/" className="nav-logo">
            LinkeDoc
          </Link>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {user ? (
              <>
                <Link to="/profile" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  My Profile
                </Link>
                <Link to="/network" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  Network
                </Link>
                <Link to="/forums" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  Forums
                </Link>
                <span style={{ fontSize: '14px', color: 'var(--accent)' }}>
                  (Dr. {user.name})
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-primary"
                  style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', boxShadow: 'none' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Medical Professionals Network
              </span>
            )}
          </div>
        </nav>

        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={user ? <ProfileBuilder /> : <Auth />} />
            <Route path="/profile" element={<ProfileBuilder />} />
            <Route path="/network" element={<Network />} />
            <Route path="/forums" element={<Forums />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
