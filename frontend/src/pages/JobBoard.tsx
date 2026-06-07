import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Job {
  id: string;
  title: string;
  description: string;
  specialty: string;
  location: string;
  recruiterName: string;
  createdAt: string;
  expiresAt: string;
}

export const JobBoard: React.FC = () => {
  const currentUser = api.getCurrentUser();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getJobs({
        specialty: specialtyFilter,
        location: locationFilter,
      });
      if (res.success) {
        setJobs(res.results || []);
      } else {
        setError(res.error || 'Failed to fetch job listings');
      }
    } catch (err) {
      setError('An error occurred while loading job listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [specialtyFilter, locationFilter]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Healthcare Job Board</h1>
          <p style={{ color: 'var(--text-muted)' }}>Explore clinical vacancies, residencies, and leadership roles.</p>
        </div>
        {currentUser?.role === 'RECRUITER' && (
          <Link to="/jobs/create" className="btn-primary" style={{ textDecoration: 'none' }}>
            Post a Job
          </Link>
        )}
      </div>

      <div className="card-glass" style={{ marginBottom: '32px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Filter Directories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="search-specialty" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Medical Specialty
            </label>
            <input
              id="search-specialty"
              type="text"
              className="input-glass"
              placeholder="Filter by specialty..."
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="search-location" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Location / City
            </label>
            <input
              id="search-location"
              type="text"
              className="input-glass"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading vacancies...
        </div>
      ) : error ? (
        <div style={{
          color: 'var(--danger)',
          padding: '16px',
          background: 'rgba(220, 38, 38, 0.1)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>No Listings Found</p>
          <p>Try adjusting your specialty or location search queries.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {jobs.map((job) => (
            <div key={job.id} className="card-glass" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', marginBottom: '4px' }}>{job.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                    {job.recruiterName}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-secondary)'
                  }}>
                    {job.specialty}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-secondary)'
                  }}>
                    {job.location}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                {job.description}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <span>Posted on: {formatDate(job.createdAt)}</span>
                <span>Expires on: {formatDate(job.expiresAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobBoard;
