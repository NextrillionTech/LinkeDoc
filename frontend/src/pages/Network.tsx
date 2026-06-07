import React, { useState } from 'react';
import { api } from '../services/api';
import { Users, BookOpen, Building, Hash } from 'lucide-react';

export const Network: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!receiverId) return;

    try {
      const res = await api.sendConnection(receiverId);
      if (res.success) {
        setMessage(`Connection request successfully sent! (Connection ID: ${res.connectionId})`);
        setReceiverId('');
      } else {
        setError(res.error || 'Failed to send connection request');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (!currentUser) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Please sign in to connect with peers.</div>;
  }

  // Mock recommendations list
  const suggestedPeers = [
    { id: 'suggested-1', name: 'Dr. Jane Miller', specialty: 'Neurology', hospital: 'General Mayo Clinic', initials: 'JM' },
    { id: 'suggested-2', name: 'Dr. Arthur Pendelton', specialty: 'Cardiology', hospital: 'St. Jude Hospital', initials: 'AP' },
    { id: 'suggested-3', name: 'Dr. Clara Oswald', specialty: 'Pediatrics', hospital: 'Childrens National', initials: 'CO' },
    { id: 'suggested-4', name: 'Dr. Rajesh Koothrappali', specialty: 'Astrophysical Medicine', hospital: 'Caltech Medical', initials: 'RK' },
  ];

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

        /* Sidebar Manage Network Card */
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

        /* Main Content Section */
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
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform var(--transition-smooth), border-color var(--transition-fast);
        }

        .recommendation-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }

        .rec-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 12px;
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
        }
      `}</style>

      {/* Left Sidebar */}
      <div className="network-sidebar">
        <div className="card-glass network-sidebar-card">
          <div className="network-sidebar-header">Manage my network</div>
          <div className="network-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} />
            <span style={{ flex: 1 }}>Connections</span>
            <span style={{ fontWeight: 600 }}>12</span>
          </div>
          <div className="network-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} />
            <span style={{ flex: 1 }}>Contact Book</span>
            <span>47</span>
          </div>
          <div className="network-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} />
            <span style={{ flex: 1 }}>Hospital Peers</span>
            <span>8</span>
          </div>
          <div className="network-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={16} />
            <span style={{ flex: 1 }}>Hashtags</span>
            <span>15</span>
          </div>
        </div>
      </div>

      {/* Right Main Column */}
      <div className="network-main-content">
        {/* Connection request composer */}
        <div className="card-glass network-main-card">
          <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>Peer Connections Directory</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Build your professional medical network by connecting with colleagues. If you know their User UUID, enter it below to send a connection invitation.
          </p>

          {message && <div style={{ color: 'var(--success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{message}</div>}
          {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleConnect} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input-glass"
              style={{ flex: 1 }}
              placeholder="Enter colleague User UUID (e.g. 55555555-5555-5555-5555-555555555555)"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Connect</button>
          </form>
        </div>

        {/* Pending invitations container */}
        <div className="card-glass network-main-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Pending Invitations
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            No pending connection requests. When colleagues invite you to connect, they will appear here.
          </p>
        </div>

        {/* Suggested medical professionals grid */}
        <div className="card-glass network-main-card">
          <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Recommended Medical Professionals
          </h3>
          <div className="recommendations-grid">
            {suggestedPeers.map(peer => (
              <div key={peer.id} className="recommendation-card">
                <div className="rec-avatar">{peer.initials}</div>
                <div className="rec-name">{peer.name}</div>
                <div className="rec-specialty">{peer.specialty}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>{peer.hospital}</div>
                <button
                  type="button"
                  className="btn-primary rec-connect-btn"
                  onClick={() => {
                    setReceiverId(peer.id);
                    setMessage(`Mock: Pre-filled UUID of ${peer.name}. Click Connect above to send request.`);
                  }}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
