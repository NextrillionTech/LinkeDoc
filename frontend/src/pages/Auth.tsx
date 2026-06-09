import React, { useState } from 'react';
import { api } from '../services/api';
import { CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import bgImage from './medium-shot-doctors-wearing-protective-equipment.jpg';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'RESEARCHER' | 'RECRUITER' | 'ADMIN'>('DOCTOR');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        if (res.success) {
          setMessage('Login successful! Welcome back.');
          window.location.reload(); // Reload to update user state across the app
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else {
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
          // Reset form fields
          setIsLogin(true);
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected connection error occurred');
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
      alignItems: 'center',
      padding: '40px 20px',
      backgroundImage: `linear-gradient(rgba(238, 243, 248, 0.55), rgba(238, 243, 248, 0.75)), url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
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
          {isLogin ? 'Sign In to LinkeDoc' : 'Create Your Account'}
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
          {!isLogin && (
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

          {!isLogin && (
            <>
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

          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            {isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
};
