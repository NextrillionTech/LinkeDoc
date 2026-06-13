import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Bookmark, Bell, DollarSign, FileText, Plus, MapPin, Building, Trash2, Loader, Filter } from 'lucide-react';
import { useSEO } from '../utils/seo';
import { useToast } from '../components/ToastContext';

interface Job {
  id: string;
  title: string;
  description: string;
  specialty: string;
  location: string;
  recruiterName: string;
  createdAt: string;
  expiresAt: string;
  applyUrl?: string;
}

export const JobBoard: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const { showToast } = useToast();
  
  useSEO('Jobs Board', 'Browse medical residency options, clinical positions, healthcare recruiter posts, and professional roles.');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePostedFilter, setDatePostedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search URL Params synchronization
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('query') || '';

  // Bookmarks state (localStorage persistence)
  const [savedJobs, setSavedJobs] = useState<string[]>(() => {
    const saved = localStorage.getItem('linkedoc_saved_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const displayedJobs: Job[] = showSavedOnly
    ? jobs.filter((j) => savedJobs.includes(j.id))
    : jobs;

  // Modals state
  const [salaryCalcOpen, setSalaryCalcOpen] = useState(false);
  const [jobAlertsOpen, setJobAlertsOpen] = useState(false);
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);

  // Dialog Refs
  const salaryDialogRef = useRef<HTMLDialogElement>(null);
  const alertsDialogRef = useRef<HTMLDialogElement>(null);
  const resumeDialogRef = useRef<HTMLDialogElement>(null);

  // Click outside listener helper for HTML5 dialogs
  const setupDialogDismiss = (ref: React.RefObject<HTMLDialogElement>, setOpen: (open: boolean) => void) => {
    const dialog = ref.current;
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
          setOpen(false);
        }
      }
    };
    dialog.addEventListener('click', handleClickOutside);
    return () => dialog.removeEventListener('click', handleClickOutside);
  };

  useEffect(() => {
    const c1 = setupDialogDismiss(salaryDialogRef, setSalaryCalcOpen);
    const c2 = setupDialogDismiss(alertsDialogRef, setJobAlertsOpen);
    const c3 = setupDialogDismiss(resumeDialogRef, setResumeBuilderOpen);
    return () => {
      if (c1) c1();
      if (c2) c2();
      if (c3) c3();
    };
  }, [salaryCalcOpen, jobAlertsOpen, resumeBuilderOpen]);

  useEffect(() => {
    if (salaryCalcOpen) {
      if (typeof salaryDialogRef.current?.showModal === 'function') {
        salaryDialogRef.current.showModal();
      }
    } else {
      if (typeof salaryDialogRef.current?.close === 'function') {
        salaryDialogRef.current.close();
      }
    }
  }, [salaryCalcOpen]);

  useEffect(() => {
    if (jobAlertsOpen) {
      if (typeof alertsDialogRef.current?.showModal === 'function') {
        alertsDialogRef.current.showModal();
      }
    } else {
      if (typeof alertsDialogRef.current?.close === 'function') {
        alertsDialogRef.current.close();
      }
    }
  }, [jobAlertsOpen]);

  useEffect(() => {
    if (resumeBuilderOpen) {
      if (typeof resumeDialogRef.current?.showModal === 'function') {
        resumeDialogRef.current.showModal();
      }
    } else {
      if (typeof resumeDialogRef.current?.close === 'function') {
        resumeDialogRef.current.close();
      }
    }
  }, [resumeBuilderOpen]);

  // Sync query parameter
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Salary Calculator State & Logic
  const [calcSpecialty, setCalcSpecialty] = useState('');
  const [calcExperience, setCalcExperience] = useState('2');
  const [calcLocation, setCalcLocation] = useState('Mumbai');
  const [salaryResult, setSalaryResult] = useState<any>(null);

  const handleCalculateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const spec = calcSpecialty.trim().toLowerCase();
    const exp = parseInt(calcExperience) || 0;
    
    let baseMin = 60000;
    let baseMax = 90000;
    let tier = 'General MBBS / Junior Resident';

    if (spec.includes('cardio') || spec.includes('neuro') || spec.includes('oncology') || spec.includes('radiology') || spec.includes('ortho') || spec.includes('surger')) {
      baseMin = 180000;
      baseMax = 320000;
      tier = 'Super-Specialty Consultant (DM / MCh / Senior Specialist)';
    } else if (spec.includes('pedia') || spec.includes('med') || spec.includes('anesthes') || spec.includes('gyn') || spec.includes('derm') || spec.includes('ophthal')) {
      baseMin = 110000;
      baseMax = 180000;
      tier = 'Postgraduate Specialist (MD / MS)';
    }

    const expMultiplier = 1 + Math.min(15, exp) * 0.08;
    let minSal = baseMin * expMultiplier;
    let maxSal = baseMax * expMultiplier;

    let locMultiplier = 1.0;
    const loc = calcLocation.toLowerCase();
    if (loc.includes('mumbai') || loc.includes('delhi') || loc.includes('bengaluru') || loc.includes('bangalore')) {
      locMultiplier = 1.15;
    } else if (loc.includes('rural') || loc.includes('tier') || loc.includes('village')) {
      locMultiplier = 0.8;
    }
    
    minSal *= locMultiplier;
    maxSal *= locMultiplier;

    const roundedMin = Math.round(minSal / 5000) * 5000;
    const roundedMax = Math.round(maxSal / 5000) * 5000;

    const toLakhs = (val: number) => {
      return (val * 12 / 100000).toFixed(1);
    };

    setSalaryResult({
      monthlyMin: roundedMin,
      monthlyMax: roundedMax,
      annualMin: toLakhs(roundedMin),
      annualMax: toLakhs(roundedMax),
      tier,
      specialty: calcSpecialty || 'General Practitioner',
      location: calcLocation
    });
  };

  // Job Alerts State & Logic
  const [alerts, setAlerts] = useState<any[]>(() => {
    const saved = localStorage.getItem('linkedoc_job_alerts');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Cardiology Consultant', specialty: 'Cardiology', location: 'Delhi', frequency: 'Daily' },
      { id: '2', name: 'Residency Openings', specialty: 'Pediatrics', location: 'Mumbai', frequency: 'Weekly' }
    ];
  });
  const [alertName, setAlertName] = useState('');
  const [alertSpecialty, setAlertSpecialty] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertFreq, setAlertFreq] = useState('Daily');

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertName.trim()) return;
    const newAlert = {
      id: Date.now().toString(),
      name: alertName,
      specialty: alertSpecialty,
      location: alertLocation,
      frequency: alertFreq
    };
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    localStorage.setItem('linkedoc_job_alerts', JSON.stringify(updated));
    setAlertName('');
    setAlertSpecialty('');
    setAlertLocation('');
    showToast(`Job Alert "${alertName}" created!`, 'success');
  };

  const handleDeleteAlert = (id: string, name: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('linkedoc_job_alerts', JSON.stringify(updated));
    showToast(`Alert "${name}" removed`, 'info');
  };

  // Resume CV Builder State & Logic
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOpenResumeBuilder = async () => {
    setResumeBuilderOpen(true);
    if (!currentUser) return;
    setLoadingProfile(true);
    try {
      const res = await api.getProfile(currentUser.id);
      if (res && res.id) {
        setProfileData(res);
      } else {
        setProfileData(currentUser);
      }
    } catch (e) {
      console.error(e);
      setProfileData(currentUser);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Bookmark Toggle logic
  const handleToggleSaveJob = (jobId: string, jobTitle: string) => {
    let updated = [];
    if (savedJobs.includes(jobId)) {
      updated = savedJobs.filter(id => id !== jobId);
      showToast(`Removed "${jobTitle}" from Saved Jobs`, 'info');
    } else {
      updated = [...savedJobs, jobId];
      showToast(`Saved "${jobTitle}"`, 'success');
    }
    setSavedJobs(updated);
    localStorage.setItem('linkedoc_saved_jobs', JSON.stringify(updated));
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getJobs({
        specialty: specialtyFilter,
        location: locationFilter,
        query: searchQuery,
        datePosted: datePostedFilter
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
  }, [specialtyFilter, locationFilter, searchQuery, datePostedFilter]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="jobs-page-container">
      <style>{`
        .jobs-page-container {
          max-width: 1128px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        .jobs-main-content {
          min-width: 0;
        }

        .jobs-sidebar {
          position: sticky;
          top: 110px;
          align-self: start;
          max-height: calc(100vh - 140px);
          overflow-y: auto;
          scrollbar-width: thin;
          padding-right: 4px;
        }

        .jobs-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .jobs-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .jobs-sidebar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: var(--radius-full);
        }

        @media (max-width: 768px) {
          .jobs-page-container {
            grid-template-columns: 1fr;
            padding: 0 12px !important;
            margin: 15px auto !important;
          }
          .jobs-sidebar {
            display: none;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            background: var(--bg-primary) !important;
            z-index: 9999 !important;
            padding: 24px !important;
            overflow-y: auto !important;
            align-self: stretch !important;
          }
          .jobs-sidebar.mobile-open {
            display: block !important;
          }
          .sidebar-mobile-header {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 12px;
          }
          .job-mobile-filter-toggle {
            display: flex !important;
          }
          .jobs-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .jobs-header-row .btn-primary {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }
          .job-card-item {
            padding: 16px !important;
          }
        }

        /* Sidebar filter cards */
        .sidebar-jobs-card {
          padding: 16px;
          margin-bottom: 16px;
        }

        .sidebar-jobs-card:hover {
          transform: none !important;
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
          position: relative;
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
      <aside className={`jobs-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-mobile-header" style={{ display: 'none' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} /> Filters & Tools
          </h2>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
            onClick={() => setMobileFiltersOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="card-glass sidebar-jobs-card">
          <h3 style={{ fontSize: '15px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Search Vacancies
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* General Keyword Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="search-keyword" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Search Keyword
              </label>
              <input
                id="search-keyword"
                type="text"
                className="input-glass"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                placeholder="Title, description, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Specialty Search & Suggestions */}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {['Cardiology', 'Pediatrics', 'Oncology', 'Neurology', 'Surgery', 'General Medicine'].map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSpecialtyFilter(specialtyFilter === spec ? '' : spec)}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      background: specialtyFilter === spec ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                      color: specialtyFilter === spec ? 'var(--primary)' : 'var(--text-secondary)',
                      border: `1px solid ${specialtyFilter === spec ? 'var(--primary-border-glow)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Search & Suggestions */}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Remote'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationFilter(locationFilter === loc ? '' : loc)}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      background: locationFilter === loc ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                      color: locationFilter === loc ? 'var(--primary)' : 'var(--text-secondary)',
                      border: `1px solid ${locationFilter === loc ? 'var(--primary-border-glow)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Posted Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="filter-date-posted" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Date Posted
              </label>
              <select
                id="filter-date-posted"
                className="input-glass"
                value={datePostedFilter}
                onChange={(e) => setDatePostedFilter(e.target.value)}
                style={{ padding: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                <option value="">Any Time</option>
                <option value="24h">Past 24 Hours</option>
                <option value="3d">Past 3 Days</option>
                <option value="7d">Past Week</option>
              </select>
            </div>

            {/* Clear All Filters button */}
            {(specialtyFilter || locationFilter || searchQuery || datePostedFilter) && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setSpecialtyFilter('');
                  setLocationFilter('');
                  setSearchQuery('');
                  setDatePostedFilter('');
                }}
                style={{
                  fontSize: '12px',
                  padding: '8px',
                  width: '100%',
                  color: 'var(--danger)',
                  marginTop: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        <div className="card-glass sidebar-jobs-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className={`jobs-nav-item ${showSavedOnly ? 'active' : ''}`}
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontSize: '13px',
                color: showSavedOnly ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: showSavedOnly ? 'var(--bg-tertiary)' : 'transparent',
                fontWeight: showSavedOnly ? 600 : 400,
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={14} fill={showSavedOnly ? 'var(--primary)' : 'none'} /> Saved Jobs
              </span>
              <span style={{ fontWeight: 600 }}>{savedJobs.length}</span>
            </button>

            <button
              type="button"
              className="jobs-nav-item"
              onClick={() => setJobAlertsOpen(true)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Bell size={14} /> Job Alerts
            </button>

            <button
              type="button"
              className="jobs-nav-item"
              onClick={() => setSalaryCalcOpen(true)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <DollarSign size={14} /> Salary Calculator
            </button>

            <button
              type="button"
              className="jobs-nav-item"
              onClick={handleOpenResumeBuilder}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <FileText size={14} /> Resume Builder
            </button>

            {currentUser?.role === 'RECRUITER' && (
              <Link to="/jobs/create" className="jobs-nav-item" style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Plus size={14} /> Post a Free Job
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Right Main Panel */}
      <section className="jobs-main-content">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="job-mobile-filter-toggle btn-primary"
          onClick={() => setMobileFiltersOpen(true)}
          style={{
            display: 'none',
            marginBottom: '16px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600
          }}
        >
          <Filter size={16} /> Filters & Job Tools
        </button>
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
        ) : displayedJobs.length === 0 ? (
          <div className="card-glass" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>No Vacancies Found</p>
            <p style={{ fontSize: '13px' }}>{showSavedOnly ? 'You haven\'t bookmarked any jobs yet.' : 'Try adjusting your specialty or location filter strings.'}</p>
          </div>
        ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayedJobs.map((job) => {
                  const isSaved = savedJobs.includes(job.id);
                  const applyLink = job.applyUrl ? (
                    job.applyUrl.trim().startsWith('mailto:') || job.applyUrl.trim().startsWith('http://') || job.applyUrl.trim().startsWith('https://')
                      ? job.applyUrl.trim()
                      : job.applyUrl.trim().includes('@')
                        ? `mailto:${job.applyUrl.trim()}`
                        : `https://${job.applyUrl.trim()}`
                  ) : '';

                  return (
                    <div key={job.id} className="card-glass job-card-item">
                      {/* Bookmark icon consistently in top-right */}
                      <button
                        type="button"
                        onClick={() => handleToggleSaveJob(job.id, job.title)}
                        style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px',
                          zIndex: 10,
                          transition: 'color var(--transition-fast)'
                        }}
                        title={isSaved ? "Remove from Saved Jobs" : "Save Job"}
                      >
                        <Bookmark size={20} fill={isSaved ? "var(--primary)" : "none"} />
                      </button>

                      {/* Header with Title, Company & Pills aligned vertically on left */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ paddingRight: '40px' }}>
                          <h3 style={{ fontSize: '18px', marginBottom: '4px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {job.title}
                          </h3>
                          {job.recruiterName && job.recruiterName !== 'LinkeDoc Scraping System' && (
                            <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={14} /> {job.recruiterName}
                            </p>
                          )}
                        </div>

                        {/* Pills below Title & Company */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                          <span className="job-metadata-pill" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary-border-glow)' }}>
                            {job.specialty}
                          </span>
                          <span className="job-metadata-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {job.location}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        marginBottom: '16px',
                        lineHeight: 1.5
                      }}>
                        {job.description}
                      </p>

                      {/* Apply Now button when applyUrl is provided */}
                      {applyLink && (
                        <div style={{ marginBottom: '16px' }}>
                          <a
                            href={applyLink}
                            target={applyLink.startsWith('mailto:') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                              textDecoration: 'none',
                              padding: '8px 18px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: 'fit-content'
                            }}
                          >
                            Apply Now
                          </a>
                        </div>
                      )}

                      {/* Dates footer */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '12px',
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                      }}>
                        <span>Posted on: {formatDate(job.createdAt)}</span>
                        <span>Expires on: {formatDate(job.expiresAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Salary Calculator Dialog */}
          <dialog
            ref={salaryDialogRef}
            className="card-glass"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Medical Salary Calculator (India)
              </h2>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onClick={() => setSalaryCalcOpen(false)}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Calculate realistic salary packages for clinical roles in India based on specialty, experience, and metropolitan location index.
            </p>

            <form onSubmit={handleCalculateSalary} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Specialty</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Cardiology, Pediatrics, MBBS"
                  value={calcSpecialty}
                  onChange={(e) => setCalcSpecialty(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    className="input-glass"
                    value={calcExperience}
                    onChange={(e) => setCalcExperience(e.target.value)}
                    required
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Location Index</label>
                  <select
                    className="input-glass"
                    value={calcLocation}
                    onChange={(e) => setCalcLocation(e.target.value)}
                    style={{ padding: '8px' }}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Tier-2 Cities (Pune, Jaipur, etc)">Tier-2 Cities</option>
                    <option value="Rural / Tier-3 Regions">Rural / Tier-3</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Calculate Salary Range
              </button>
            </form>

            {salaryResult && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {salaryResult.tier}
                </span>
                <h3 style={{ fontSize: '22px', margin: '6px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{salaryResult.monthlyMin.toLocaleString('en-IN')} - ₹{salaryResult.monthlyMax.toLocaleString('en-IN')}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
                </h3>
                <p style={{ fontSize: '13px', margin: '4px 0', color: 'var(--text-secondary)' }}>
                  Estimated Annual Package: <strong>₹{salaryResult.annualMin}L - ₹{salaryResult.annualMax}L</strong>
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                  Based on clinical market averages in {salaryResult.location}. Super-specialty clinical roles with intensive call hours skew towards upper ranges.
                </p>
              </div>
            )}
          </dialog>

          {/* Job Alerts Dialog */}
          <dialog
            ref={alertsDialogRef}
            className="card-glass"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} /> Job Alerts Manager
              </h2>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onClick={() => setJobAlertsOpen(false)}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Create custom notifications for clinical vacancies. We will alert you when postings match these criteria.
            </p>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Alert Name</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Cardiologist in Delhi"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Specialty</label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Cardiology"
                    value={alertSpecialty}
                    onChange={(e) => setAlertSpecialty(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Location</label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Delhi"
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Frequency</label>
                  <select
                    className="input-glass"
                    value={alertFreq}
                    onChange={(e) => setAlertFreq(e.target.value)}
                    style={{ padding: '8px' }}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Create Job Alert
              </button>
            </form>

            <h3 style={{ fontSize: '14px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '10px', fontWeight: 600 }}>Active Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {alerts.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>No job alerts set.</p>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
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
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{al.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Specialty: {al.specialty || 'Any'} • Location: {al.location || 'Any'} • {al.frequency}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(al.id, al.name)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </dialog>

          {/* Resume Builder Dialog */}
          <dialog
            ref={resumeDialogRef}
            className="card-glass"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '650px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)'
            }}
          >
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-cv-content, #printable-cv-content * {
                  visibility: visible;
                }
                #printable-cv-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  color: black !important;
                  background: white !important;
                  padding: 20px;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Medical CV Builder
              </h2>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onClick={() => setResumeBuilderOpen(false)}
              >
                &times;
              </button>
            </div>

            <p className="no-print" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your clinical curriculum vitae has been generated automatically from your verified profile fields. You can review, print, or export it to PDF.
            </p>

            {loadingProfile ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                Assembling profile data...
              </div>
            ) : profileData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Printable CV Box */}
                <div
                  id="printable-cv-content"
                  style={{
                    border: '1px solid var(--border)',
                    padding: '24px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  {/* Header */}
                  <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '22px', margin: '0 0 4px 0', fontWeight: 700 }}>
                      Dr. {profileData.name}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, margin: '0 0 6px 0' }}>
                      {profileData.specialty || 'General Practitioner'} • Clinical Professional
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>Email: {profileData.email}</span>
                      {profileData.medicalRegistrationNumber && (
                        <span>MRN: {profileData.medicalRegistrationNumber} ({profileData.stateMedicalCouncil || 'NMC'})</span>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', margin: '0 0 6px 0', borderBottom: '1px solid var(--border)', paddingBottom: '2px', fontWeight: 700 }}>
                      Education & Training
                    </h4>
                    {profileData.education ? (
                      <p style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{profileData.education}</p>
                    ) : (
                      <p style={{ fontSize: '12px', margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>No education history provided. Update your profile to add.</p>
                    )}
                  </div>

                  {/* Experience */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', margin: '0 0 6px 0', borderBottom: '1px solid var(--border)', paddingBottom: '2px', fontWeight: 700 }}>
                      Clinical Experience
                    </h4>
                    {profileData.experience ? (
                      <p style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{profileData.experience}</p>
                    ) : (
                      <p style={{ fontSize: '12px', margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>No experience details provided.</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', margin: '0 0 6px 0', borderBottom: '1px solid var(--border)', paddingBottom: '2px', fontWeight: 700 }}>
                      Clinical Expertise & Skills
                    </h4>
                    {profileData.skills ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {profileData.skills.split(',').map((s: string) => (
                          <span
                            key={s}
                            style={{
                              fontSize: '10px',
                              background: 'var(--bg-secondary)',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>No specific skills registered.</p>
                    )}
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setResumeBuilderOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileText size={14} /> Print / Export CV
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Could not compile profile data.</p>
            )}
          </dialog>
        </div>
      );
    };

export default JobBoard;
