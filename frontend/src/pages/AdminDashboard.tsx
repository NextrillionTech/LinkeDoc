import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { useSEO } from '../utils/seo';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty: string | null;
  licenseNumber: string | null;
  medicalRegistrationNumber: string | null;
  stateMedicalCouncil: string | null;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useSEO('Admin Dashboard', 'LinkeDoc medical network verification control panel.');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingUsers();
      if (res && !res.error) {
        setUsers(res.pendingUsers || []);
      } else {
        showToast(res.error || 'Failed to fetch pending users queue.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while loading verification queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.verifyUser(id, status);
      if (res.success) {
        showToast(`User successfully ${status.toLowerCase()}!`, 'success');
        // Remove from list
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        showToast(res.error || 'Failed to update user status.', 'error');
      }
    } catch (err) {
      showToast('An error occurred during verification.', 'error');
    }
  };

  const currentUser = api.getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Access Denied: Administrator permissions required.</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card-glass">
        <h1 style={{ fontSize: '28px', marginBottom: '24px', fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Verification Queue — Review and approve professional licenses for doctor, nurse, pharmacist, and researcher accounts.
        </p>

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
                <div style={{ textAlign: 'left' }}>
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
                  {u.role === 'DOCTOR' && u.medicalRegistrationNumber && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Medical Registration Number (MRN): <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{u.medicalRegistrationNumber}</span>
                    </div>
                  )}
                  {u.role === 'DOCTOR' && u.stateMedicalCouncil && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      State Medical Council: <span style={{ color: 'var(--text-secondary)' }}>{u.stateMedicalCouncil}</span>
                    </div>
                  )}
                  {u.role === 'DOCTOR' && u.medicalRegistrationNumber && (
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>
                      <a
                        href="https://www.nmc.org.in/information-desk/indian-medical-register/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Verify on NMC Register Search ↗
                      </a>
                    </div>
                  )}
                  {u.role !== 'DOCTOR' && u.licenseNumber && (
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
