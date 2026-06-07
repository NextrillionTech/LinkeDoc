import React, { useState } from 'react';
import { api } from '../services/api';

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

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card-glass">
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Peer Connections Directory</h2>
        <p>Build your professional medical network by connecting with colleagues.</p>

        {message && <div style={{ color: 'var(--success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{message}</div>}
        {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleConnect} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <input
            type="text"
            className="input-glass"
            style={{ flex: 1 }}
            placeholder="Enter colleague User UUID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Connect</button>
        </form>

        <h3>My Connections</h3>
        <p style={{ color: 'var(--text-muted)' }}>No connections made yet. Use the input box above to send a request.</p>
      </div>
    </div>
  );
};
