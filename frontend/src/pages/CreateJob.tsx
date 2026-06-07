import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = api.getCurrentUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Sign In Required</h2>
        <p>Please sign in to access recruiter features.</p>
      </div>
    );
  }

  if (currentUser.role !== 'RECRUITER') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }} className="card-glass">
        <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Access Denied</h2>
        <p>Only recruiter accounts are authorized to post new job listings.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.createJob(title, description, specialty, location);
      if (res.success) {
        navigate('/jobs');
      } else {
        setError(res.error || 'Failed to post job listing');
      }
    } catch (err) {
      setError('An unexpected error occurred while posting the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card-glass">
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Post a Healthcare Job</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Publish open vacancies to target thousands of verified clinical professionals. MVP postings are free.
        </p>

        {error && (
          <div style={{
            color: 'var(--danger)',
            padding: '12px',
            background: 'rgba(220, 38, 38, 0.1)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="job-title" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Job Title
            </label>
            <input
              id="job-title"
              type="text"
              className="input-glass"
              placeholder="e.g. Chief Resident - Internal Medicine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="job-specialty" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Specialty
              </label>
              <input
                id="job-specialty"
                type="text"
                className="input-glass"
                placeholder="Filter by specialty..."
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="job-location" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Location
              </label>
              <input
                id="job-location"
                type="text"
                className="input-glass"
                placeholder="e.g. Chicago, IL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="job-description" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Job Description
            </label>
            <textarea
              id="job-description"
              className="input-glass"
              rows={6}
              placeholder="Provide a detailed description of responsibilities, clinical qualifications, schedules, and compensation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '12px', width: '100%' }}
          >
            {loading ? 'Publishing...' : 'Publish Job Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
