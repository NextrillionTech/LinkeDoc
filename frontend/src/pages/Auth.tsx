import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import bgImage from './medium-shot-doctors-wearing-protective-equipment.jpg';

export const Auth: React.FC = () => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'RESET'>('LOGIN');
  
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'RESEARCHER' | 'RECRUITER' | 'ADMIN'>('DOCTOR');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Password Reset State
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      if (view === 'LOGIN') {
        const res = await api.login({ email, password });
        if (res.success) {
          setMessage('Login successful! Welcome back.');
          window.location.reload(); // Reload to update user state across the app
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else if (view === 'REGISTER') {
        const res = await api.register({
          name,
          email,
          password,
          role,
          specialty: role !== 'RECRUITER' && role !== 'ADMIN' ? specialty : undefined,
          licenseNumber: role !== 'RECRUITER' && role !== 'ADMIN' ? licenseNumber : undefined,
        });
        if (res.success) {
          setMessage(res.message || 'Registration successful!');
          setView('LOGIN');
        } else {
          setError(res.error || 'Registration failed');
        }
      } else if (view === 'FORGOT') {
        const res = await api.forgotPassword(email);
        if (res.success) {
          setMessage(res.message || 'A verification code was dispatched to your email.');
          if (res.mockResetCode) {
            setToken(res.mockResetCode); // Auto-fill sandbox code for testing convenience
            setMessage(`[SANDBOX MOCK] A secure 6-digit verification code (${res.mockResetCode}) has been generated for ${email}.`);
          }
          setView('RESET');
        } else {
          setError(res.error || 'Password reset request failed');
        }
      } else if (view === 'RESET') {
        const res = await api.resetPassword({ email, token, newPassword });
        if (res.success) {
          setMessage(res.message || 'Your password was successfully updated.');
          setView('LOGIN');
          setPassword('');
          setToken('');
          setNewPassword('');
        } else {
          setError(res.error || 'Password reset code is invalid or expired.');
        }
      }
    } catch (err) {
      setError('An unexpected connection error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '110px 20px 40px',
      overflowY: 'auto',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'left',
      backgroundRepeat: 'no-repeat',
      zIndex: 1,
      boxSizing: 'border-box'
    }}>
      <div className="card-glass" style={{
        width: '100%',
        maxWidth: '480px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '28px' }}>
          {view === 'LOGIN' && 'Sign In to LinkeDoc'}
          {view === 'REGISTER' && 'Create Your Account'}
          {view === 'FORGOT' && 'Reset Password'}
          {view === 'RESET' && 'Enter Verification'}
        </h2>
        
        {message && (
          <div style={{
            color: 'var(--success)',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            {message.includes('verified') ? (
              <ShieldCheck size={24} style={{ flexShrink: 0, color: 'var(--success)' }} />
            ) : (
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
            )}
            <div>
              {message.includes('verified') && (
                <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--success)' }}>
                  NPI Registry Verified!
                </strong>
              )}
              <span>{message}</span>
            </div>
          </div>
        )}
        {error && (
          <div style={{
            color: 'var(--danger)',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {view === 'REGISTER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="name" style={{ fontSize: '14px', fontWeight: 500 }}>Full Name</label>
              <input
                id="name"
                type="text"
                className="input-glass"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {(view === 'LOGIN' || view === 'REGISTER' || view === 'FORGOT') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500 }}>Email Address</label>
              <input
                id="email"
                type="email"
                className="input-glass"
                placeholder="name@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {view === 'LOGIN' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                <input
                  id="password"
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                <span
                  style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                  onClick={() => {
                    setView('FORGOT');
                    setMessage('');
                    setError('');
                  }}
                >
                  Forgot Password?
                </span>
              </div>
            </>
          )}

          {view === 'REGISTER' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                <input
                  id="password"
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="role" style={{ fontSize: '14px', fontWeight: 500 }}>Professional Role</label>
                <select
                  id="role"
                  className="input-glass"
                  style={{ background: 'var(--bg-primary)' }}
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                >
                  <option value="DOCTOR">Doctor / Physician</option>
                  <option value="NURSE">Nurse Practitioner / RN</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="RESEARCHER">Medical Researcher</option>
                  <option value="RECRUITER">Healthcare Recruiter</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {role !== 'RECRUITER' && role !== 'ADMIN' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="specialty" style={{ fontSize: '14px', fontWeight: 500 }}>Specialty Field</label>
                    <input
                      id="specialty"
                      type="text"
                      className="input-glass"
                      placeholder="e.g., Cardiology, Pediatrics"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="license" style={{ fontSize: '14px', fontWeight: 500 }}>Medical License / NPI Number</label>
                    <input
                      id="license"
                      type="text"
                      className="input-glass"
                      placeholder="e.g., 10-digit NPI or LIC-123456"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                    {licenseNumber.trim() && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: /^\d{10}$/.test(licenseNumber.trim())
                          ? 'var(--success)'
                          : licenseNumber.trim().toUpperCase().startsWith('NPI-')
                            ? 'var(--accent)'
                            : 'var(--text-muted)'
                      }}>
                        {/^\d{10}$/.test(licenseNumber.trim())
                          ? '✓ 10-Digit NPI detected: CMS NPPES automatic verification active.'
                          : licenseNumber.trim().toUpperCase().startsWith('NPI-')
                            ? '✓ Mock credentials detected: Sandbox instant verification active.'
                            : 'ℹ State License format: Registration will require manual admin review.'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {view === 'RESET' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="emailReset" style={{ fontSize: '14px', fontWeight: 500 }}>Confirm Email</label>
                <input
                  id="emailReset"
                  type="email"
                  className="input-glass"
                  value={email}
                  disabled
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="token" style={{ fontSize: '14px', fontWeight: 500 }}>6-Digit Verification Code</label>
                <input
                  id="token"
                  type="text"
                  className="input-glass"
                  placeholder="e.g., 123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="newPassword" style={{ fontSize: '14px', fontWeight: 500 }}>New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }} disabled={submitting}>
            {submitting ? 'Please wait...' : (
              view === 'LOGIN' ? 'Sign In' :
              view === 'REGISTER' ? 'Register Account' :
              view === 'FORGOT' ? 'Send Reset Code' : 'Update Password'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {view === 'LOGIN' && (
            <>
              Don't have an account?{' '}
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setView('REGISTER');
                  setMessage('');
                  setError('');
                }}
              >
                Sign Up
              </span>
            </>
          )}
          {view === 'REGISTER' && (
            <>
              Already have an account?{' '}
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setView('LOGIN');
                  setMessage('');
                  setError('');
                }}
              >
                Sign In
              </span>
            </>
          )}
          {(view === 'FORGOT' || view === 'RESET') && (
            <span
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                setView('LOGIN');
                setMessage('');
                setError('');
              }}
            >
              ← Back to Sign In
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
