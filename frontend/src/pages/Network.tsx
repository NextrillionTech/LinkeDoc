import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { Users, BookOpen, Building, Hash, Search, UserPlus, Check, X, UserCheck, Loader, MessageSquare, Trash2 } from 'lucide-react';
import { useSEO } from '../utils/seo';
import { useSearchParams, Link } from 'react-router-dom';

export const Network: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const { showToast } = useToast();
  
  useSEO('My Network', 'Manage your professional medical network, check incoming invitations, and connect with other clinicians.');

  const [connections, setConnections] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Dynamic tabs/section control
  const [activeSection, setActiveSection] = useState<'directory' | 'connections' | 'sent'>('directory');
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('query') || '';

  // Hashtags state
  const [hashtagsOpen, setHashtagsOpen] = useState(false);
  const [followedHashtags, setFollowedHashtags] = useState<string[]>(() => {
    const saved = localStorage.getItem('linkedoc_followed_hashtags');
    return saved ? JSON.parse(saved) : ['Cardiology', 'Oncology', 'Pediatrics', 'AIinMedicine', 'ResidencyLife'];
  });
  const [newHashtag, setNewHashtag] = useState('');
  const hashtagDialogRef = useRef<HTMLDialogElement>(null);

  // Close hashtag dialog on click outside
  useEffect(() => {
    const dialog = hashtagDialogRef.current;
    if (!dialog) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          if (typeof dialog.close === 'function') {
            dialog.close();
          }
          setHashtagsOpen(false);
        }
      }
    };
    dialog.addEventListener('click', handleClickOutside);
    return () => dialog.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (hashtagsOpen) {
      if (typeof hashtagDialogRef.current?.showModal === 'function') {
        hashtagDialogRef.current.showModal();
      }
    } else {
      if (typeof hashtagDialogRef.current?.close === 'function') {
        hashtagDialogRef.current.close();
      }
    }
  }, [hashtagsOpen]);

  // Synchronize URL search params
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      setActiveSection('directory');
    }
  }, [queryParam]);

  const fetchData = async () => {
    try {
      const connRes = await api.getConnections();
      if (connRes.success) {
        setConnections(connRes.connections);
      }
      const userRes = await api.listUsers(queryParam || searchQuery);
      if (userRes.success) {
        setSearchResults(userRes.users);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load network directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, queryParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await api.listUsers(searchQuery);
      if (res.success) {
        setSearchResults(res.users);
        if (searchQuery) {
          showToast(`Found ${res.users.length} matching colleagues`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Search query failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string, name: string) => {
    try {
      const res = await api.sendConnection(receiverId);
      if (res.success) {
        showToast(`Connection request sent to Dr. ${name}!`, 'success');
        fetchData();
      } else {
        showToast(res.error || 'Failed to send connection request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to initiate connection', 'error');
    }
  };

  const handleRespond = async (connectionId: string, action: 'ACCEPT' | 'REJECT', name: string) => {
    try {
      const res = await api.respondToConnection(connectionId, action);
      if (res.success) {
        showToast(
          action === 'ACCEPT'
            ? `Successfully connected with Dr. ${name}!`
            : `Declined connection request from Dr. ${name}`,
          action === 'ACCEPT' ? 'success' : 'info'
        );
        fetchData();
      } else {
        showToast(res.error || 'Failed to respond to request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection update failed', 'error');
    }
  };

  if (!currentUser) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Please sign in to connect with peers.</div>;
  }

  // Stats computed from dynamic connections list
  const acceptedCount = connections.filter((c) => c.status === 'ACCEPTED').length;
  const pendingReceived = connections.filter((c) => c.status === 'PENDING' && c.receiverId === currentUser.id);
  const pendingSent = connections.filter((c) => c.status === 'PENDING' && c.requesterId === currentUser.id);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getConnectionStatus = (userId: string) => {
    return connections.find(
      (c) =>
        (c.requesterId === userId && c.receiverId === currentUser.id) ||
        (c.receiverId === userId && c.requesterId === currentUser.id)
    );
  };

  return (
    <div className="network-page-container">
      <style>{`
        .network-page-container {
          max-width: 1200px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .network-page-container {
            grid-template-columns: 1fr;
          }
          .network-sidebar {
            display: none;
          }
        }

        .network-sidebar-card {
          padding: 16px 0;
        }

        .network-sidebar-header {
          font-size: 15px;
          font-weight: 700;
          padding: 0 16px 12px 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }

        .network-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: background-color var(--transition-fast);
          cursor: pointer;
        }

        .network-menu-item:hover {
          background-color: var(--bg-tertiary);
          color: var(--primary);
        }

        .network-main-card {
          margin-bottom: 20px;
          padding: 24px;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .recommendation-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          padding: 20px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .rec-avatar {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 12px;
          border: 2px solid var(--border);
        }

        .rec-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .rec-specialty {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .rec-connect-btn {
          margin-top: auto;
          width: 100%;
          font-size: 12px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: var(--bg-secondary);
          color: var(--text-muted);
          width: 100%;
          margin-top: auto;
          box-sizing: border-box;
          display: block;
        }

        .pending-requests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .pending-request-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .pending-request-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pending-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .pending-details h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .pending-details p {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted);
        }

        .pending-actions {
          display: flex;
          gap: 8px;
        }

        .btn-accept {
          background: var(--primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-reject {
          background: none;
          color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-reject:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
      `}</style>

      {/* Left Sidebar */}
      <aside className="network-sidebar">
        <div className="card-glass network-sidebar-card" style={{ padding: '16px 0' }}>
          <div className="network-sidebar-header" style={{
            fontSize: '15px',
            fontWeight: 700,
            padding: '0 16px 12px 16px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '8px'
          }}>Manage my network</div>
          
          <button
            type="button"
            className={`network-menu-item ${activeSection === 'directory' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('directory');
              setSearchParams({});
            }}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '13px',
              color: activeSection === 'directory' ? 'var(--primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'directory' ? 'var(--bg-tertiary)' : 'transparent',
              borderLeft: activeSection === 'directory' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeSection === 'directory' ? 600 : 400
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} />
              <span>Colleague Directory</span>
            </div>
          </button>

          <button
            type="button"
            className={`network-menu-item ${activeSection === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveSection('connections')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '13px',
              color: activeSection === 'connections' ? 'var(--primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'connections' ? 'var(--bg-tertiary)' : 'transparent',
              borderLeft: activeSection === 'connections' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeSection === 'connections' ? 600 : 400
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} />
              <span>Connections</span>
            </div>
            <span style={{ fontWeight: 600 }}>{acceptedCount}</span>
          </button>

          <button
            type="button"
            className="network-menu-item"
            onClick={() => {
              setActiveSection('directory');
              setTimeout(() => {
                const elem = document.getElementById('pending-invitations-card');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              borderLeft: '3px solid transparent',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} />
              <span>Pending Received</span>
            </div>
            <span style={{ fontWeight: 600 }}>{pendingReceived.length}</span>
          </button>

          <button
            type="button"
            className={`network-menu-item ${activeSection === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveSection('sent')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '13px',
              color: activeSection === 'sent' ? 'var(--primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'sent' ? 'var(--bg-tertiary)' : 'transparent',
              borderLeft: activeSection === 'sent' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeSection === 'sent' ? 600 : 400
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} />
              <span>Sent Requests</span>
            </div>
            <span style={{ fontWeight: 600 }}>{pendingSent.length}</span>
          </button>

          <button
            type="button"
            className="network-menu-item"
            onClick={() => setHashtagsOpen(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              borderLeft: '3px solid transparent',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={16} />
              <span>Hashtags</span>
            </div>
            <span style={{ fontWeight: 600 }}>{followedHashtags.length}</span>
          </button>
        </div>
      </aside>

      {/* Right Main Column */}
      <section className="network-main-content">
        {activeSection === 'directory' && (
          <>
            {/* Connection search / directory */}
            <div className="card-glass network-main-card">
              <h1 style={{ fontSize: '20px', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 0, color: 'var(--text-primary)' }}>Medical Directory Search</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Find Indian doctors and medical professionals by Name, Medical Specialty, State Medical Council, or Unique Registration Number.
              </p>

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-glass"
                    style={{ flex: 1, paddingLeft: '38px' }}
                    placeholder="Search specialty, state council, name, or MRN (e.g. Cardiology, NMC, etc.)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSearching ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </form>
            </div>

            {/* Pending received invitations container */}
            <div id="pending-invitations-card" className="card-glass network-main-card">
              <h3 style={{ fontSize: '15px', margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Pending Invitations ({pendingReceived.length})
              </h3>
              {pendingReceived.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  No pending connection requests. When colleagues invite you to connect, they will appear here.
                </p>
              ) : (
                <div className="pending-requests-list">
                  {pendingReceived.map((conn) => {
                    const requester = conn.requester;
                    return (
                      <div key={conn.id} className="pending-request-item">
                        <div className="pending-request-info">
                          <div className="pending-avatar">{getInitials(requester.name)}</div>
                          <div className="pending-details">
                            <h4>Dr. {requester.name}</h4>
                            <p>{requester.specialty || 'General Practitioner'} • {requester.role}</p>
                          </div>
                        </div>
                        <div className="pending-actions">
                          <button
                            type="button"
                            className="btn-accept"
                            onClick={() => handleRespond(conn.id, 'ACCEPT', requester.name)}
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => handleRespond(conn.id, 'REJECT', requester.name)}
                          >
                            <X size={14} /> Ignore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Directory / Recommended peers grid */}
            <div className="card-glass network-main-card">
              <h3 style={{ fontSize: '15px', margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontFamily: 'var(--font-display)' }}>
                {searchQuery ? 'Search Directory Results' : 'Recommended Medical Professionals'}
              </h3>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                  Loading colleagues...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No clinical professionals found matching your query.
                </div>
              ) : (
                <div className="recommendations-grid">
                  {searchResults.map((user) => {
                    const conn = getConnectionStatus(user.id);
                    return (
                      <div key={user.id} className="recommendation-card card-glass">
                        <div className="rec-avatar">{getInitials(user.name)}</div>
                        <div className="rec-name">Dr. {user.name}</div>
                        <div className="rec-specialty">{user.specialty || 'General Practitioner'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          {user.stateMedicalCouncil ? `${user.stateMedicalCouncil} Council` : 'NMC Registered'}
                        </div>

                        {!conn ? (
                          <button
                            type="button"
                            className="btn-primary rec-connect-btn"
                            onClick={() => handleSendRequest(user.id, user.name)}
                          >
                            <UserPlus size={14} /> Connect
                          </button>
                        ) : conn.status === 'ACCEPTED' ? (
                          <span className="status-badge" style={{ color: 'var(--primary)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <UserCheck size={13} /> Connected
                          </span>
                        ) : conn.requesterId === currentUser.id ? (
                          <span className="status-badge">Request Sent</span>
                        ) : (
                          <div className="pending-actions" style={{ width: '100%', marginTop: 'auto' }}>
                            <button
                              type="button"
                              className="btn-accept"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => handleRespond(conn.id, 'ACCEPT', user.name)}
                            >
                              <Check size={14} /> Accept
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'connections' && (
          <div className="card-glass network-main-card">
            <h1 style={{ fontSize: '20px', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 0, color: 'var(--text-primary)' }}>
              My Connections ({acceptedCount})
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              These are the medical professionals in your active clinical network. You can exchange secure messaging with them.
            </p>

            {connections.filter((c) => c.status === 'ACCEPTED').length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                You don't have any accepted connections yet. Browse the colleague directory to send requests.
              </div>
            ) : (
              <div className="pending-requests-list">
                {connections
                  .filter((c) => c.status === 'ACCEPTED')
                  .map((conn) => {
                    const colleague = conn.requesterId === currentUser.id ? conn.receiver : conn.requester;
                    return (
                      <div key={conn.id} className="pending-request-item">
                        <div className="pending-request-info">
                          <div className="pending-avatar">{getInitials(colleague.name)}</div>
                          <div className="pending-details">
                            <h4>Dr. {colleague.name}</h4>
                            <p>{colleague.specialty || 'General Practitioner'} • {colleague.role}</p>
                          </div>
                        </div>
                        <div className="pending-actions">
                          <Link
                            to="/chat"
                            className="btn-accept"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <MessageSquare size={14} /> Message
                          </Link>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => handleRespond(conn.id, 'REJECT', colleague.name)}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeSection === 'sent' && (
          <div className="card-glass network-main-card">
            <h1 style={{ fontSize: '20px', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 0, color: 'var(--text-primary)' }}>
              Sent Connection Requests ({pendingSent.length})
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Pending invitations you have sent to other medical professionals.
            </p>

            {pendingSent.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No pending sent requests.
              </div>
            ) : (
              <div className="pending-requests-list">
                {pendingSent.map((conn) => {
                  const colleague = conn.receiver;
                  return (
                    <div key={conn.id} className="pending-request-item">
                      <div className="pending-request-info">
                        <div className="pending-avatar">{getInitials(colleague.name)}</div>
                        <div className="pending-details">
                          <h4>Dr. {colleague.name}</h4>
                          <p>{colleague.specialty || 'General Practitioner'} • {colleague.role}</p>
                        </div>
                      </div>
                      <div className="pending-actions">
                        <button
                          type="button"
                          className="btn-reject"
                          onClick={() => handleRespond(conn.id, 'REJECT', colleague.name)}
                        >
                          Cancel Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* HTML `<dialog>` for followed hashtags management */}
      <dialog
        ref={hashtagDialogRef}
        className="card-glass"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          background: 'var(--bg-primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={18} /> Followed Hashtags
          </h2>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
            onClick={() => setHashtagsOpen(false)}
          >
            &times;
          </button>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Follow medical and clinical hashtags to personalize your Feed updates and keep up with peer reports.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const tag = newHashtag.trim().replace(/^#/, '');
            if (!tag) return;
            if (followedHashtags.includes(tag)) {
              showToast('Already following this hashtag', 'info');
              return;
            }
            const updated = [...followedHashtags, tag];
            setFollowedHashtags(updated);
            localStorage.setItem('linkedoc_followed_hashtags', JSON.stringify(updated));
            setNewHashtag('');
            showToast(`Following #${tag}`, 'success');
          }}
          style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}
        >
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>#</span>
            <input
              type="text"
              className="input-glass"
              style={{ width: '100%', paddingLeft: '24px' }}
              placeholder="clinicalresearch"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Follow
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
          {followedHashtags.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>Not following any hashtags yet.</p>
          ) : (
            followedHashtags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>#{tag}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = followedHashtags.filter(t => t !== tag);
                    setFollowedHashtags(updated);
                    localStorage.setItem('linkedoc_followed_hashtags', JSON.stringify(updated));
                    showToast(`Unfollowed #${tag}`, 'info');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Unfollow"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </dialog>
    </div>
  );
};
