import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty: string | null;
  licenseNumber: string | null;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingUsers();
      if (res && !res.error) {
        setUsers(res);
      } else {
        setError(res.error || 'Failed to fetch pending users queue.');
      }
    } catch (err) {
      setError('An error occurred while loading verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setMessage('');
    setError('');
    try {
      const res = await api.verifyUser(id, status);
      if (res.success) {
        setMessage(`User successfully ${status.toLowerCase()}!`);
        // Remove from list
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        setError(res.error || 'Failed to update user status.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    }
  };

  const currentUser = api.getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Access Denied: Administrator permissions required.</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card-glass">
        <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Verification Queue — Review and approve professional licenses for doctor, nurse, pharmacist, and researcher accounts.
        </p>

        {message && <div style={{ color: 'var(--success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}
        {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading verification queue...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            🎉 No pending users. The verification queue is currently empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Email: <span style={{ color: 'var(--text-secondary)' }}>{u.email}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Role: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{u.role}</span>
                  </div>
                  {u.specialty && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Specialty: <span style={{ color: 'var(--text-secondary)' }}>{u.specialty}</span>
                    </div>
                  )}
                  {u.licenseNumber && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      License: <span style={{ color: 'var(--text-secondary)' }}>{u.licenseNumber}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleVerify(u.id, 'APPROVED')}
                    className="btn-primary"
                    style={{ background: 'var(--success)', boxShadow: 'none' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerify(u.id, 'REJECTED')}
                    className="btn-primary"
                    style={{ background: 'var(--danger)', boxShadow: 'none' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
