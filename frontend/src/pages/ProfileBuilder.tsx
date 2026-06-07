import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Edit2, MapPin, Building, GraduationCap, X, Plus, Trash2, MoreHorizontal, CheckCircle, Clock, AlertCircle, Award, BookOpen, Users, FileText } from 'lucide-react';

interface EducationEntry {
  degree: string;
  school: string;
  year: number;
}

interface ExperienceEntry {
  title: string;
  company: string;
  year: string;
}

interface PublicationEntry {
  title: string;
  journal: string;
  year: number;
  authors: string;
}

interface GroupEntry {
  id: string;
  name: string;
  description: string;
}

export const ProfileBuilder: React.FC = () => {
  const currentUser = api.getCurrentUser();

  // Profile data state
  const [specialty, setSpecialty] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState('');
  const [stateMedicalCouncil, setStateMedicalCouncil] = useState('');
  const [publications, setPublications] = useState<PublicationEntry[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupEntry[]>([]);

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [educationInput, setEducationInput] = useState<EducationEntry[]>([]);
  const [experienceInput, setExperienceInput] = useState<ExperienceEntry[]>([]);
  const [aboutInput, setAboutInput] = useState('');
  const [medicalRegistrationNumberInput, setMedicalRegistrationNumberInput] = useState('');
  const [stateMedicalCouncilInput, setStateMedicalCouncilInput] = useState('');
  const [publicationsInput, setPublicationsInput] = useState<PublicationEntry[]>([]);

  // Status notifications
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = () => {
    if (currentUser) {
      api.getProfile(currentUser.id).then((data) => {
        if (data && !data.error) {
          setSpecialty(data.specialty || '');
          setSkillsStr(data.skills ? data.skills.join(', ') : '');
          setEducation(data.education || []);
          
          // Parse experience (gracefully handling array/object structure)
          let jobsList: ExperienceEntry[] = [];
          let pubsList: PublicationEntry[] = [];
          if (data.experience) {
            if (Array.isArray(data.experience)) {
              jobsList = data.experience;
            } else if (typeof data.experience === 'object') {
              jobsList = data.experience.jobs || [];
              pubsList = data.experience.publications || [];
            }
          }
          setExperience(jobsList);
          setPublications(pubsList);

          setMedicalRegistrationNumber(data.medicalRegistrationNumber || '');
          setStateMedicalCouncil(data.stateMedicalCouncil || '');
          setAboutText(data.about || `Medical professional specializing in ${data.specialty || 'healthcare clinical practice'}. Committed to patient care and clinical excellence.`);
        }
      });

      // Fetch groups
      api.getGroups().then((res) => {
        if (res && Array.isArray(res)) {
          setJoinedGroups(res.slice(0, 3)); // show top 3 groups for bento design
        }
      }).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Open edit modal & load inputs
  const handleOpenEdit = () => {
    setSpecialtyInput(specialty);
    setSkillsInput(skillsStr);
    setEducationInput([...education]);
    setExperienceInput([...experience]);
    setAboutInput(aboutText);
    setMedicalRegistrationNumberInput(medicalRegistrationNumber);
    setStateMedicalCouncilInput(stateMedicalCouncil);
    setPublicationsInput([...publications]);
    setError('');
    setMessage('');
    setIsEditModalOpen(true);
  };

  // Save changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const skillsArray = skillsInput.split(',').map((s: string) => s.trim()).filter(Boolean);
      const res = await api.updateProfile(currentUser.id, {
        specialty: specialtyInput,
        skills: skillsArray,
        education: educationInput,
        experience: {
          jobs: experienceInput,
          publications: publicationsInput,
        },
        about: aboutInput,
        medicalRegistrationNumber: medicalRegistrationNumberInput,
        stateMedicalCouncil: stateMedicalCouncilInput,
      });

      if (res.success) {
        setMessage('Profile updated successfully!');
        setSpecialty(specialtyInput);
        setSkillsStr(skillsInput);
        setEducation(educationInput);
        setExperience(experienceInput);
        setPublications(publicationsInput);
        setMedicalRegistrationNumber(medicalRegistrationNumberInput);
        setStateMedicalCouncil(stateMedicalCouncilInput);
        setAboutText(aboutInput);
        
        // Update local storage user status if returned
        if (res.user && res.user.status) {
          const updatedLocalUser = { ...currentUser, status: res.user.status };
          localStorage.setItem('linkedoc_user', JSON.stringify(updatedLocalUser));
        }

        setIsEditModalOpen(false);
      } else {
        setError(res.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred during profile save');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatAMACitation = (pub: PublicationEntry) => {
    const authorsStr = pub.authors.trim() ? (pub.authors.endsWith('.') ? pub.authors : `${pub.authors}.`) : 'Unknown Authors.';
    const titleStr = pub.title.trim() ? (pub.title.endsWith('.') ? pub.title : `${pub.title}.`) : 'Untitled Publication.';
    const journalStr = pub.journal.trim() ? pub.journal : 'Unknown Journal';
    const yearStr = pub.year ? ` ${pub.year};` : '';
    return `${authorsStr} ${titleStr} ${journalStr}.${yearStr}`;
  };

  if (!currentUser) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  // Render Verification Badge Status Details
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="nmc-badge nmc-badge-approved">
            <CheckCircle size={16} />
            <span>NMC Verified Doctor</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="nmc-badge nmc-badge-rejected">
            <AlertCircle size={16} />
            <span>Verification Rejected</span>
          </div>
        );
      default:
        return (
          <div className="nmc-badge nmc-badge-pending">
            <Clock size={16} />
            <span>Verification Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="profile-page-container">
      {/* Visual styles for LinkedIn Profile bento grid layout */}
      <style>{`
        .profile-page-container {
          max-width: 1050px;
          margin: 30px auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Bento Grid Wrapper */
        .profile-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .bento-span-3 {
          grid-column: span 3;
        }

        .bento-span-2 {
          grid-column: span 2;
        }

        .bento-span-1 {
          grid-column: span 1;
        }

        @media (max-width: 900px) {
          .profile-bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-span-3, .bento-span-2, .bento-span-1 {
            grid-column: span 1;
          }
        }

        /* Profile Banner & Hero Card */
        .profile-intro-banner {
          height: 200px;
          background: linear-gradient(135deg, var(--primary), #054841);
          position: relative;
        }

        .profile-intro-details-row {
          padding: 30px 24px;
          position: relative;
          text-align: left;
        }

        .profile-intro-avatar-wrapper {
          margin-top: -120px;
          margin-bottom: 16px;
          display: inline-block;
        }

        .profile-intro-avatar {
          width: 150px;
          height: 150px;
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          border: 5px solid var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 52px;
          color: var(--primary);
          box-shadow: var(--shadow-lg);
        }

        .profile-intro-name {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-intro-title {
          font-size: 17px;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .profile-intro-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 20px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        /* NMC badge style */
        .nmc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.3px;
        }

        .nmc-badge-approved {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .nmc-badge-pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .nmc-badge-rejected {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Bento Tiles Styling */
        .bento-card {
          padding: 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .bento-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .bento-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .bento-card-header h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
        }

        /* Certificate Badge Tile */
        .verification-certificate-tile {
          background: linear-gradient(185deg, var(--bg-secondary), var(--bg-tertiary));
          border: 2px solid var(--primary-glow);
          position: relative;
          overflow: hidden;
        }

        .verification-certificate-tile::before {
          content: '';
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: var(--primary-glow);
          border-radius: var(--radius-full);
          filter: blur(20px);
          opacity: 0.5;
        }

        /* Custom list items */
        .bento-list-item {
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 12px;
        }

        .bento-list-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .bento-list-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .bento-list-content {
          flex: 1;
        }

        .bento-list-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        .bento-list-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 3px;
        }

        .bento-list-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Skills container */
        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skills-grid-pill {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }

        .skills-grid-pill:hover {
          background-color: var(--primary-glow);
          color: var(--primary);
          transform: scale(1.05);
        }

        /* Publications Formatter styling */
        .publication-citation {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.5;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-left: 3px solid var(--primary);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          font-family: var(--font-display);
        }
      `}</style>

      {/* 1. Full-Width Hero Card */}
      <div className="card-glass bento-span-3" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div className="profile-intro-banner"></div>
        <div className="profile-intro-details-row">
          <button
            onClick={handleOpenEdit}
            className="btn-edit-trigger"
            style={{ position: 'absolute', top: '24px', right: '24px' }}
          >
            <Edit2 size={16} />
          </button>

          <div className="profile-intro-avatar-wrapper">
            <div className="profile-intro-avatar">
              {getInitials(currentUser.name)}
            </div>
          </div>

          <div className="profile-intro-name">
            {currentUser.role === 'ADMIN' ? currentUser.name : currentUser.role === 'RECRUITER' ? currentUser.name : `Dr. ${currentUser.name}`}
            {currentUser.role === 'DOCTOR' && renderStatusBadge(currentUser.status)}
          </div>

          <div className="profile-intro-title">
            {specialty ? `${specialty} Specialist` : 'Medical Practitioner'} • {currentUser.role}
          </div>

          <div className="profile-intro-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> India
            </span>
            <span>•</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>12 connections</span>
            {currentUser.role === 'DOCTOR' && medicalRegistrationNumber && (
              <>
                <span>•</span>
                <span>MRN: <strong style={{ color: 'var(--text-primary)' }}>{medicalRegistrationNumber}</strong> ({stateMedicalCouncil || 'State Council'})</span>
              </>
            )}
          </div>

          <div className="profile-action-btn-row">
            <button className="btn-primary" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)', fontSize: '14px' }}>
              Open to
            </button>
            <button className="btn-profile-sec" onClick={handleOpenEdit}>
              Edit Professional Info
            </button>
            <button className="btn-profile-sec" style={{ width: '40px', padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Bento Grid Architecture */}
      <div className="profile-bento-grid">
        
        {/* About Panel (span 2) */}
        <div className="card-glass bento-card bento-span-2">
          <div className="bento-card-header">
            <h3><FileText size={18} /> Professional Summary</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {aboutText}
          </p>
        </div>

        {/* NMC verification badge / Doctor credentials (span 1) */}
        <div className="card-glass bento-card bento-span-1 verification-certificate-tile">
          <div className="bento-card-header">
            <h3><Award size={18} /> Medical Credentials</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          {currentUser.role === 'DOCTOR' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Registration Status</span>
                <div style={{ marginTop: '4px' }}>{renderStatusBadge(currentUser.status)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Medical Registration Number (MRN)</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {medicalRegistrationNumber || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Not Provided</span>}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>State Medical Council</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {stateMedicalCouncil || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Not Provided</span>}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                Verified against the National Medical Commission (NMC) Indian Medical Register.
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              Verification details are only applicable for verified Medical Practitioners.
            </div>
          )}
        </div>

        {/* Experience Panel (span 2) */}
        <div className="card-glass bento-card bento-span-2">
          <div className="bento-card-header">
            <h3><Building size={18} /> Clinical Experience</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {experience.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                No experience details added yet. Click edit to write work history.
              </p>
            ) : (
              experience.map((exp: ExperienceEntry, idx: number) => (
                <div key={idx} className="bento-list-item">
                  <div className="bento-list-icon">
                    <Building size={16} />
                  </div>
                  <div className="bento-list-content">
                    <div className="bento-list-title">{exp.title}</div>
                    <div className="bento-list-sub">{exp.company}</div>
                    <div className="bento-list-time">{exp.year}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education Panel (span 1) */}
        <div className="card-glass bento-card bento-span-1">
          <div className="bento-card-header">
            <h3><GraduationCap size={18} /> Education</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {education.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                No education history added yet. Click edit to add medical degree details.
              </p>
            ) : (
              education.map((edu: EducationEntry, idx: number) => (
                <div key={idx} className="bento-list-item">
                  <div className="bento-list-icon">
                    <GraduationCap size={18} />
                  </div>
                  <div className="bento-list-content">
                    <div className="bento-list-title">{edu.degree}</div>
                    <div className="bento-list-sub">{edu.school}</div>
                    <div className="bento-list-time">{edu.year}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Publications Tracker (span 2) */}
        <div className="card-glass bento-card bento-span-2">
          <div className="bento-card-header">
            <h3><BookOpen size={18} /> Publications & Research Papers</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {publications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                No medical publications indexed. Add peer-reviewed articles to generate AMA citations.
              </p>
            ) : (
              publications.map((pub: PublicationEntry, idx: number) => (
                <div key={idx} className="bento-list-item" style={{ flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{pub.title}</div>
                    <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>AMA Format</span>
                  </div>
                  <div className="publication-citation">
                    {formatAMACitation(pub)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skills Panel (span 1) */}
        <div className="card-glass bento-card bento-span-1">
          <div className="bento-card-header">
            <h3><Award size={18} /> Key Expertise</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          {skillsStr.trim() === '' ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
              No skills listed. Click edit to catalog specialties.
            </p>
          ) : (
            <div className="skills-grid">
              {skillsStr.split(',').map((s: string, idx: number) => (
                <div key={idx} className="skills-grid-pill">
                  {s.trim()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Joined Groups Card (span 3) */}
        <div className="card-glass bento-card bento-span-3">
          <div className="bento-card-header">
            <h3><Users size={18} /> Medical Societies & Joined Groups</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {joinedGroups.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', gridColumn: 'span 3' }}>
                You have not joined any clinical discussion groups yet. Head over to Groups tab to explore!
              </div>
            ) : (
              joinedGroups.map((grp) => (
                <div key={grp.id} style={{ display: 'flex', gap: '12px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div className="bento-list-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    <Users size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{grp.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {grp.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>Edit Intro & Professional History</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
                
                {/* Specialty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="modal-specialty" style={{ fontSize: '13px', fontWeight: 600 }}>Specialty / Field</label>
                  <input
                    id="modal-specialty"
                    type="text"
                    className="input-glass"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="e.g. Cardiology"
                  />
                </div>

                {currentUser.role === 'DOCTOR' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Medical Registration Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="modal-mrn" style={{ fontSize: '13px', fontWeight: 600 }}>Medical Registration Number (MRN)</label>
                      <input
                        id="modal-mrn"
                        type="text"
                        className="input-glass"
                        value={medicalRegistrationNumberInput}
                        onChange={(e) => setMedicalRegistrationNumberInput(e.target.value)}
                        placeholder="e.g. 12345 or MRN-998877"
                        required
                      />
                    </div>

                    {/* State Medical Council */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="modal-smc" style={{ fontSize: '13px', fontWeight: 600 }}>State Medical Council</label>
                      <input
                        id="modal-smc"
                        type="text"
                        className="input-glass"
                        value={stateMedicalCouncilInput}
                        onChange={(e) => setStateMedicalCouncilInput(e.target.value)}
                        placeholder="e.g. Maharashtra Medical Council"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* About summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="modal-about" style={{ fontSize: '13px', fontWeight: 600 }}>Summary Description</label>
                  <textarea
                    id="modal-about"
                    className="input-glass"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={aboutInput}
                    onChange={(e) => setAboutInput(e.target.value)}
                    placeholder="Describe your medical passion, clinical experience, or research interests..."
                  />
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="modal-skills" style={{ fontSize: '13px', fontWeight: 600 }}>Key Skills (separated by commas)</label>
                  <input
                    id="modal-skills"
                    type="text"
                    className="input-glass"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. Surgery, Diagnostics, Clinical Research"
                  />
                </div>

                {/* Education list fields */}
                <div>
                  <h4 style={{ fontSize: '14px', margin: '12px 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Education History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {educationInput.map((edu: EducationEntry, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          className="input-glass"
                          style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...educationInput];
                            updated[idx].degree = e.target.value;
                            setEducationInput(updated);
                          }}
                          placeholder="Degree (e.g. MBBS)"
                          required
                        />
                        <input
                          className="input-glass"
                          style={{ flex: 3, padding: '8px 12px', fontSize: '13px' }}
                          value={edu.school}
                          onChange={(e) => {
                            const updated = [...educationInput];
                            updated[idx].school = e.target.value;
                            setEducationInput(updated);
                          }}
                          placeholder="University / Medical School"
                          required
                        />
                        <input
                          type="number"
                          className="input-glass"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                          value={edu.year}
                          onChange={(e) => {
                            const updated = [...educationInput];
                            updated[idx].year = parseInt(e.target.value) || 2020;
                            setEducationInput(updated);
                          }}
                          placeholder="Year"
                          required
                        />
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => setEducationInput(educationInput.filter((_, i: number) => i !== idx))}
                          style={{ padding: '8px 12px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', width: 'fit-content' }}
                      onClick={() => setEducationInput([...educationInput, { degree: '', school: '', year: 2022 }])}
                    >
                      <Plus size={14} /> Add Education
                    </button>
                  </div>
                </div>

                {/* Experience list fields */}
                <div>
                  <h4 style={{ fontSize: '14px', margin: '12px 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Experience History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {experienceInput.map((exp: ExperienceEntry, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          className="input-glass"
                          style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
                          value={exp.title}
                          onChange={(e) => {
                            const updated = [...experienceInput];
                            updated[idx].title = e.target.value;
                            setExperienceInput(updated);
                          }}
                          placeholder="Job Title (e.g. Resident Doctor)"
                          required
                        />
                        <input
                          className="input-glass"
                          style={{ flex: 3, padding: '8px 12px', fontSize: '13px' }}
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...experienceInput];
                            updated[idx].company = e.target.value;
                            setExperienceInput(updated);
                          }}
                          placeholder="Hospital / Institution"
                          required
                        />
                        <input
                          className="input-glass"
                          style={{ flex: 1.5, padding: '8px 12px', fontSize: '13px' }}
                          value={exp.year}
                          onChange={(e) => {
                            const updated = [...experienceInput];
                            updated[idx].year = e.target.value;
                            setExperienceInput(updated);
                          }}
                          placeholder="Years (e.g. 2020 - Present)"
                          required
                        />
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => setExperienceInput(experienceInput.filter((_, i: number) => i !== idx))}
                          style={{ padding: '8px 12px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', width: 'fit-content' }}
                      onClick={() => setExperienceInput([...experienceInput, { title: '', company: '', year: '' }])}
                    >
                      <Plus size={14} /> Add Experience
                    </button>
                  </div>
                </div>

                {/* Publications list fields */}
                <div>
                  <h4 style={{ fontSize: '14px', margin: '12px 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Peer-Reviewed Publications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {publicationsInput.map((pub: PublicationEntry, idx: number) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            className="input-glass"
                            style={{ flex: 3, padding: '8px 12px', fontSize: '13px' }}
                            value={pub.title}
                            onChange={(e) => {
                              const updated = [...publicationsInput];
                              updated[idx].title = e.target.value;
                              setPublicationsInput(updated);
                            }}
                            placeholder="Article Title"
                            required
                          />
                          <input
                            type="number"
                            className="input-glass"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                            value={pub.year}
                            onChange={(e) => {
                              const updated = [...publicationsInput];
                              updated[idx].year = parseInt(e.target.value) || 2022;
                              setPublicationsInput(updated);
                            }}
                            placeholder="Year"
                            required
                          />
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => setPublicationsInput(publicationsInput.filter((_, i: number) => i !== idx))}
                            style={{ padding: '8px 12px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            className="input-glass"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                            value={pub.journal}
                            onChange={(e) => {
                              const updated = [...publicationsInput];
                              updated[idx].journal = e.target.value;
                              setPublicationsInput(updated);
                            }}
                            placeholder="Journal Name"
                            required
                          />
                          <input
                            className="input-glass"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                            value={pub.authors}
                            onChange={(e) => {
                              const updated = [...publicationsInput];
                              updated[idx].authors = e.target.value;
                              setPublicationsInput(updated);
                            }}
                            placeholder="Authors (e.g. Smith J, Doe A)"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', width: 'fit-content' }}
                      onClick={() => setPublicationsInput([...publicationsInput, { title: '', journal: '', year: 2023, authors: '' }])}
                    >
                      <Plus size={14} /> Add Publication
                    </button>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-profile-sec"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ padding: '8px 24px' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBuilder;
