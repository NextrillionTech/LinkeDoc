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
    <div className="jobs-page-container">
      <style>{`
        .jobs-page-container {
          max-width: 1200px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .jobs-page-container {
            grid-template-columns: 1fr;
          }
          .jobs-sidebar {
            display: none;
          }
        }

        /* Sidebar filter cards */
        .sidebar-jobs-card {
          padding: 16px;
          margin-bottom: 16px;
        }

        .jobs-nav-item {
          display: block;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .jobs-nav-item:hover {
          background-color: var(--bg-tertiary);
          color: var(--primary);
        }

        /* Main Jobs Section */
        .jobs-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .job-card-item {
          margin-bottom: 16px;
          padding: 20px;
          transition: transform var(--transition-smooth), border-color var(--transition-fast);
        }

        .job-card-item:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }

        .job-metadata-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }
      `}</style>

      {/* Left Sidebar Filters */}
      <div className="jobs-sidebar">
        <div className="card-glass sidebar-jobs-card">
          <h3 style={{ fontSize: '15px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Search Vacancies
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="search-specialty" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Specialty
              </label>
              <input
                id="search-specialty"
                type="text"
                className="input-glass"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                placeholder="Filter by specialty..."
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="search-location" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Location
              </label>
              <input
                id="search-location"
                type="text"
                className="input-glass"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card-glass sidebar-jobs-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="jobs-nav-item" style={{ fontWeight: 600 }}>🔖 Saved Jobs</span>
            <span className="jobs-nav-item">🔔 Job Alerts</span>
            <span className="jobs-nav-item">💵 Salary Calculator</span>
            <span className="jobs-nav-item">📝 Resume Builder</span>
            {currentUser?.role === 'RECRUITER' && (
              <Link to="/jobs/create" className="jobs-nav-item" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                ➕ Post a Free Job
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="jobs-main-content">
        <div className="jobs-header-row">
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Healthcare Job Board</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Explore clinical vacancies, residencies, and leadership roles in your specialty.
            </p>
          </div>
          {currentUser?.role === 'RECRUITER' && (
            <Link to="/jobs/create" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
              Post a Job
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading medical vacancies...
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
            <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>No Vacancies Found</p>
            <p style={{ fontSize: '13px' }}>Try adjusting your specialty or location filter strings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map((job) => (
              <div key={job.id} className="card-glass job-card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '2px', fontWeight: 700 }}>{job.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                      🏢 {job.recruiterName || 'Verified Healthcare Recruiter'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="job-metadata-pill">{job.specialty}</span>
                    <span className="job-metadata-pill">📍 {job.location}</span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '16px', lineHeight: 1.5 }}>
                  {job.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '12px',
                  fontSize: '11px',
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
    </div>
  );
};

export default JobBoard;
