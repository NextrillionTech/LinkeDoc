import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Edit2, MapPin, Building, GraduationCap } from 'lucide-react';

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

export const ProfileBuilder: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const isApproved = currentUser?.status === 'APPROVED';

  // Profile data state
  const [specialty, setSpecialty] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [aboutText, setAboutText] = useState('');

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [educationInput, setEducationInput] = useState<EducationEntry[]>([]);
  const [experienceInput, setExperienceInput] = useState<ExperienceEntry[]>([]);
  const [aboutInput, setAboutInput] = useState('');

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
          setExperience(data.experience || []);
          // Populate about text from experience/specialty or fallback
          setAboutText(data.about || `Medical professional specializing in ${data.specialty || 'healthcare clinical practice'}. Committed to patient care and medical research cooperation.`);
        }
      });
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
        experience: experienceInput,
        about: aboutInput,
      });

      if (res.success) {
        setMessage('Profile updated successfully!');
        setSpecialty(specialtyInput);
        setSkillsStr(skillsInput);
        setEducation(educationInput);
        setExperience(experienceInput);
        setAboutText(aboutInput);
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

  if (!currentUser) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-page-container">
      {/* Visual styles for LinkedIn Profile page structure */}
      <style>{`
        .profile-page-container {
          max-width: 950px;
          margin: 30px auto;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-section-card {
          margin-bottom: 0;
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        /* Intro Profile Card */
        .profile-intro-banner {
          height: 180px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
        }

        .profile-intro-details-row {
          padding: 24px;
          position: relative;
          text-align: left;
        }

        .profile-intro-avatar-wrapper {
          margin-top: -110px;
          margin-bottom: 16px;
          display: inline-block;
        }

        .profile-intro-avatar {
          width: 140px;
          height: 140px;
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          border: 4px solid var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 44px;
          color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .profile-intro-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .profile-intro-title {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .profile-intro-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .profile-action-btn-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .btn-profile-sec {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          padding: 8px 20px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-profile-sec:hover {
          background-color: var(--bg-tertiary);
        }

        /* Generic Card content layout */
        .profile-card-content {
          padding: 24px;
          text-align: left;
        }

        .profile-card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .btn-edit-trigger {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 18px;
          padding: 6px;
          border-radius: var(--radius-full);
          transition: background-color var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-edit-trigger:hover {
          background-color: var(--primary-glow);
        }

        /* Experience and Education entries lists */
        .profile-list-item {
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 12px;
        }

        .profile-list-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .list-item-bullet-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .list-item-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .list-item-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .list-item-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Skills Pill Layout */
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .skill-pill {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Full Screen Edit Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        .modal-container {
          width: 100%;
          max-width: 650px;
          max-height: 85vh;
          overflow-y: auto;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>

      {/* 1. Header Intro Card */}
      <div className="card-glass profile-section-card">
        <div className="profile-intro-banner"></div>
        <div className="profile-intro-details-row">
          <button
            onClick={handleOpenEdit}
            className="btn-edit-trigger"
            style={{ position: 'absolute', top: '20px', right: '20px' }}
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
          </div>

          <div className="profile-intro-title">
            {specialty ? `${specialty} Specialist` : 'Medical Practitioner'} • {currentUser.role}
          </div>

          <div className="profile-intro-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> Chicago, Illinois, United States
            </span>
            <span>•</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>12 connections</span>
            <span>•</span>
            <span>Status: <span style={{ color: isApproved ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{currentUser.status}</span></span>
          </div>

          <div className="profile-action-btn-row">
            <button className="btn-primary" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)', fontSize: '14px' }}>
              Open to
            </button>
            <button className="btn-profile-sec" onClick={handleOpenEdit}>
              Add profile section
            </button>
            <button className="btn-profile-sec" style={{ width: '40px', padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
              •••
            </button>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      {message && <div style={{ color: 'var(--success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '14px', textAlign: 'left' }}>{message}</div>}
      {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '14px', textAlign: 'left' }}>{error}</div>}

      {/* 2. About Card */}
      <div className="card-glass profile-section-card">
        <div className="profile-card-content">
          <div className="profile-card-header-row">
            <h3 style={{ fontSize: '18px', margin: 0 }}>About</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {aboutText}
          </p>
        </div>
      </div>

      {/* 3. Experience Card */}
      <div className="card-glass profile-section-card">
        <div className="profile-card-content">
          <div className="profile-card-header-row">
            <h3 style={{ fontSize: '18px', margin: 0 }}>Experience</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {experience.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                No experience details added yet. Click edit to write work history.
              </p>
            ) : (
              experience.map((exp: ExperienceEntry, idx: number) => (
                <div key={idx} className="profile-list-item">
                  <div className="list-item-bullet-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <Building size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div className="list-item-title">{exp.title}</div>
                    <div className="list-item-sub">{exp.company}</div>
                    <div className="list-item-time">{exp.year}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Education Card */}
      <div className="card-glass profile-section-card">
        <div className="profile-card-content">
          <div className="profile-card-header-row">
            <h3 style={{ fontSize: '18px', margin: 0 }}>Education</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {education.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                No education history added yet. Click edit to add medical degree details.
              </p>
            ) : (
              education.map((edu: EducationEntry, idx: number) => (
                <div key={idx} className="profile-list-item">
                  <div className="list-item-bullet-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div className="list-item-title">{edu.degree}</div>
                    <div className="list-item-sub">{edu.school}</div>
                    <div className="list-item-time">{edu.year}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Skills Card */}
      <div className="card-glass profile-section-card">
        <div className="profile-card-content">
          <div className="profile-card-header-row">
            <h3 style={{ fontSize: '18px', margin: 0 }}>Skills</h3>
            <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={14} /></button>
          </div>

          {skillsStr.trim() === '' ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
              No skills listed. Click edit to catalog specialties.
            </p>
          ) : (
            <div className="skills-container">
              {skillsStr.split(',').map((s: string, idx: number) => (
                <div key={idx} className="skill-pill">
                  {s.trim()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', margin: 0 }}>Edit Intro & Professional History</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
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
                  <h4 style={{ fontSize: '14px', margin: '12px 0 8px 0' }}>Education History</h4>
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
                          placeholder="Degree (e.g. MD)"
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
                          placeholder="University"
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
                          className="btn-primary"
                          style={{ background: 'var(--danger)', padding: '8px 12px', boxShadow: 'none', borderRadius: '4px', fontSize: '12px' }}
                          onClick={() => setEducationInput(educationInput.filter((_: any, i: number) => i !== idx))}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', width: 'fit-content', padding: '6px 12px', fontSize: '12px', boxShadow: 'none' }}
                      onClick={() => setEducationInput([...educationInput, { degree: '', school: '', year: 2022 }])}
                    >
                      + Add Education
                    </button>
                  </div>
                </div>

                {/* Experience list fields */}
                <div>
                  <h4 style={{ fontSize: '14px', margin: '12px 0 8px 0' }}>Experience History</h4>
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
                          placeholder="Job Title"
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
                          placeholder="Years"
                          required
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ background: 'var(--danger)', padding: '8px 12px', boxShadow: 'none', borderRadius: '4px', fontSize: '12px' }}
                          onClick={() => setExperienceInput(experienceInput.filter((_: any, i: number) => i !== idx))}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', width: 'fit-content', padding: '6px 12px', fontSize: '12px', boxShadow: 'none' }}
                      onClick={() => setExperienceInput([...experienceInput, { title: '', company: '', year: '' }])}
                    >
                      + Add Experience
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
