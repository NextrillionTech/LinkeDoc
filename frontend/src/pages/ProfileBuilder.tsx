import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const ProfileBuilder: React.FC = () => {
  const currentUser = api.getCurrentUser();
  
  const [specialty, setSpecialty] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      api.getProfile(currentUser.id).then((data) => {
        if (data && !data.error) {
          setSpecialty(data.specialty || '');
          setSkillsStr(data.skills ? data.skills.join(', ') : '');
          setEducation(data.education || []);
          setExperience(data.experience || []);
        }
      });
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const skillsArray = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.updateProfile(currentUser.id, {
        specialty,
        skills: skillsArray,
        education,
        experience,
      });

      if (res.success) {
        setMessage('Profile updated successfully!');
      } else {
        setError(res.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred during profile save');
    }
  };

  if (!currentUser) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in to build your profile.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card-glass">
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Dr. {currentUser.name} - Profile Details</h2>
        <p style={{ color: 'var(--text-muted)' }}>Status: <span style={{ color: currentUser.status === 'APPROVED' ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{currentUser.status}</span></p>

        {message && <div style={{ color: 'var(--success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{message}</div>}
        {error && <div style={{ color: 'var(--danger)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="specialty">Specialty / Field of Study</label>
            <input
              id="specialty"
              type="text"
              className="input-glass"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Cardiology"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="skills">Key Skills (separated by commas)</label>
            <input
              id="skills"
              type="text"
              className="input-glass"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g., Surgery, Clinical Research, Diagnostics"
            />
          </div>

          <h3>Education History</h3>
          {education.map((edu, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                className="input-glass"
                style={{ flex: 2 }}
                value={edu.degree}
                onChange={(e) => {
                  const updated = [...education];
                  updated[idx].degree = e.target.value;
                  setEducation(updated);
                }}
                placeholder="Degree (e.g. MD, PhD)"
              />
              <input
                className="input-glass"
                style={{ flex: 3 }}
                value={edu.school}
                onChange={(e) => {
                  const updated = [...education];
                  updated[idx].school = e.target.value;
                  setEducation(updated);
                }}
                placeholder="Institution / School"
              />
              <input
                type="number"
                className="input-glass"
                style={{ flex: 1 }}
                value={edu.year}
                onChange={(e) => {
                  const updated = [...education];
                  updated[idx].year = parseInt(e.target.value) || '';
                  setEducation(updated);
                }}
                placeholder="Year"
              />
              <button
                type="button"
                className="btn-primary"
                style={{ background: 'var(--danger)', boxShadow: 'none', padding: '10px' }}
                onClick={() => setEducation(education.filter((_, i) => i !== idx))}
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'fit-content', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', boxShadow: 'none' }}
            onClick={() => setEducation([...education, { degree: '', school: '', year: 2020 }])}
          >
            + Add Education Entry
          </button>

          <h3>Work Experience</h3>
          {experience.map((exp, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                className="input-glass"
                style={{ flex: 2 }}
                value={exp.title}
                onChange={(e) => {
                  const updated = [...experience];
                  updated[idx].title = e.target.value;
                  setExperience(updated);
                }}
                placeholder="Job Title"
              />
              <input
                className="input-glass"
                style={{ flex: 3 }}
                value={exp.company}
                onChange={(e) => {
                  const updated = [...experience];
                  updated[idx].company = e.target.value;
                  setExperience(updated);
                }}
                placeholder="Hospital / Company"
              />
              <input
                className="input-glass"
                style={{ flex: 1 }}
                value={exp.year}
                onChange={(e) => {
                  const updated = [...experience];
                  updated[idx].year = e.target.value;
                  setExperience(updated);
                }}
                placeholder="Years (e.g. 2018-2022)"
              />
              <button
                type="button"
                className="btn-primary"
                style={{ background: 'var(--danger)', boxShadow: 'none', padding: '10px' }}
                onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'fit-content', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', boxShadow: 'none' }}
            onClick={() => setExperience([...experience, { title: '', company: '', year: '' }])}
          >
            + Add Experience Entry
          </button>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Save Profile Changes</button>
        </form>
      </div>
    </div>
  );
};
