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
  FolderOpen,
  Bell,
  Sun,
  Moon
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'theme-light' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Notifications fetching & Pusher live listener
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const data = await api.getNotifications();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    loadNotifications();

    const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'dummy_key';
    const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'dummy_cluster';
    let pusher: any = null;
    let channel: any = null;

    try {
      import('pusher-js').then(({ default: PusherJS }) => {
        pusher = new PusherJS(PUSHER_KEY, {
          cluster: PUSHER_CLUSTER,
          authEndpoint: '/api/conversations/pusher/auth',
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('linkedoc_token') || ''}`,
            },
          },
        });

        channel = pusher.subscribe(`private-notifications-${user.id}`);
        channel.bind('new-notification', (data: any) => {
          if (data && data.notification) {
            setNotifications((prev) => [data.notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        });
      });
    } catch (err) {
      console.error('Failed to bind Pusher notifications channel', err);
    }

    return () => {
      if (channel && pusher) {
        pusher.unsubscribe(`private-notifications-${user.id}`);
        pusher.disconnect();
      }
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotificationsOpen(false);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const formatNotificationMessage = (notif: any) => {
    const senderName = notif.sender?.name || 'Someone';
    const senderSpecialty = notif.sender?.specialty ? ` (${notif.sender.specialty})` : '';
    const prefix = `${senderName}${senderSpecialty}`;

    switch (notif.type) {
      case 'CONNECTION_REQUEST':
        return `${prefix} sent you a connection request.`;
      case 'CONNECTION_ACCEPTED':
        return `${prefix} accepted your connection request.`;
      case 'NEW_MESSAGE':
        return `${prefix} sent you a direct message.`;
      case 'POST_LIKE':
        return `${prefix} liked your feed post.`;
      case 'POST_COMMENT':
        return `${prefix} commented on your feed post.`;
      case 'GROUP_REQUEST':
        return `${prefix} requested to join your clinical group.`;
      case 'GROUP_APPROVED':
        return `Your request to join a group was approved by ${senderName}.`;
      default:
        return `${prefix} triggered an update.`;
    }
  };

  const getNotificationLink = (notif: any) => {
    switch (notif.type) {
      case 'NEW_MESSAGE':
        return '/chat';
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        return '/network';
      case 'GROUP_REQUEST':
      case 'GROUP_APPROVED':
        return notif.relatedId ? `/groups/${notif.relatedId}` : '/groups';
      default:
        return '/';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="linkedin-header">
      <div className="linkedin-header-content">
        {/* Left: Logo, Toggle and Search bar */}
        <div className="linkedin-header-left">
          <Link to="/" className="linkedin-brand-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo.svg" alt="LinkeDoc" style={{ height: '34px', objectFit: 'contain', display: 'block' }} />
          </Link>

          {/* Theme Toggle Button next to logo */}
          <button
            type="button"
            className="theme-toggle-btn btn-ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              marginLeft: '4px'
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user && (
            <div className="linkedin-search-container">
              <span className="linkedin-search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search"
                className="linkedin-search-input"
              />
            </div>
          )}
        </div>

        {/* Right: Nav items */}
        {user ? (
          <div className="linkedin-header-right">
            <nav className="linkedin-nav-menu" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NavItem to="/" icon={<Home size={20} />} label="Home" />
              <NavItem to="/network" icon={<Users size={20} />} label="My Network" />
              <NavItem to="/jobs" icon={<Briefcase size={20} />} label="Jobs" />

              <div className="linkedin-nav-divider"></div>

              {/* Notification bell item */}
              <div className="linkedin-notif-menu-container" ref={notifRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`linkedin-icon-only-btn ${notificationsOpen ? 'active' : ''}`}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Notifications"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {notificationsOpen && (
                  <div className="card-glass linkedin-notif-dropdown-card">
                    <div className="notif-dropdown-header">
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="btn-ghost"
                          style={{ fontSize: '11px', padding: '4px 8px', margin: 0 }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="notif-dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty-state">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            to={getNotificationLink(n)}
                            onClick={() => handleNotificationClick(n)}
                            className={`notif-item-link ${!n.isRead ? 'unread' : ''}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <div className="notif-content-col">
                              <p className="notif-text">{formatNotificationMessage(n)}</p>
                              <span className="notif-time">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && <div className="notif-dot"></div>}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messaging item */}
              <Link
                to="/chat"
                className="linkedin-icon-only-btn"
                title="Messaging"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageSquare size={20} />
              </Link>

              {/* "Me" Profile dropdown */}
              <div className="linkedin-me-menu-container" ref={dropdownRef}>
                <button
                  className="linkedin-me-trigger-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '36px',
                    borderRadius: '20px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                    alt="Me"
                    className="linkedin-me-avatar-img"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border)'
                    }}
                  />
                  <span className="linkedin-me-label-row" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                      <Link to="/groups" className="me-dropdown-link" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={14} /> Groups
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link to="/admin" className="me-dropdown-link" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={14} /> Admin Dashboard
                        </Link>
                      )}
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

            </nav>
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
