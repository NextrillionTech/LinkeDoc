import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { Edit2, MapPin, Building, GraduationCap, X, Plus, Trash2, MoreHorizontal, CheckCircle, Clock, AlertCircle, Award, BookOpen, Users, FileText, Camera, MessageSquare, UserPlus, UserCheck, Loader, Send, Download, Bookmark } from 'lucide-react';
import { useSEO } from '../utils/seo';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

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
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useSEO('Profile | LinkeDoc', 'View professional medical profiles, credentials, clinical experience, and research on LinkeDoc.');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const profileUserId = searchParams.get('id') || currentUser?.id;
  const isOwnProfile = !searchParams.get('id') || searchParams.get('id') === currentUser?.id;

  // Profile owner user details state
  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Connection states
  const [connectionStatus, setConnectionStatus] = useState<'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Profile data state
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState('');
  const [stateMedicalCouncil, setStateMedicalCouncil] = useState('');
  const [publications, setPublications] = useState<PublicationEntry[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupEntry[]>([]);
  const [sidebarColleagues, setSidebarColleagues] = useState<any[]>([]);
  const [sentConnections, setSentConnections] = useState<string[]>([]);

  // Dropdown states & refs
  const [isOpenToDropdownOpen, setIsOpenToDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const openToDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openToDropdownRef.current && !openToDropdownRef.current.contains(event.target as Node)) {
        setIsOpenToDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [educationInput, setEducationInput] = useState<EducationEntry[]>([]);
  const [experienceInput, setExperienceInput] = useState<ExperienceEntry[]>([]);
  const [aboutInput, setAboutInput] = useState('');
  const [medicalRegistrationNumberInput, setMedicalRegistrationNumberInput] = useState('');
  const [stateMedicalCouncilInput, setStateMedicalCouncilInput] = useState('');
  const [publicationsInput, setPublicationsInput] = useState<PublicationEntry[]>([]);

  // DOI/PubMed Auto-import states
  const [pubSearchQuery, setPubSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = () => {
    if (!profileUserId) return;
    setProfileLoading(true);
    
    api.getProfile(profileUserId).then((data) => {
      if (data && !data.error) {
        setProfileUser(data);
        setSpecialty(data.specialty || '');
        setLocation(data.location || '');
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
      } else {
        showToast(data.error || 'Failed to fetch profile', 'error');
      }
      setProfileLoading(false);
    }).catch(err => {
      console.error(err);
      setProfileLoading(false);
    });

    // Fetch groups (only for own profile bento tile)
    if (isOwnProfile) {
      api.getGroups().then((res) => {
        if (res && Array.isArray(res)) {
          setJoinedGroups(res.slice(0, 3)); // show top 3 groups for bento design
        }
      }).catch(err => console.error(err));
    } else {
      setJoinedGroups([]);
    }

    // Fetch connection status if not own profile
    if (!isOwnProfile && currentUser) {
      api.getConnections().then((res) => {
        if (res.success && Array.isArray(res.connections)) {
          const conn = res.connections.find(
            (c: any) =>
              (c.requesterId === profileUserId && c.receiverId === currentUser.id) ||
              (c.receiverId === profileUserId && c.requesterId === currentUser.id)
          );
          if (conn) {
            setConnectionId(conn.id);
            if (conn.status === 'ACCEPTED') {
              setConnectionStatus('ACCEPTED');
            } else if (conn.requesterId === currentUser.id) {
              setConnectionStatus('PENDING_SENT');
            } else {
              setConnectionStatus('PENDING_RECEIVED');
            }
          } else {
            setConnectionStatus(null);
            setConnectionId(null);
          }
        }
      }).catch(err => console.error(err));
    }
  };

  const handleSendConnection = async () => {
    if (!profileUserId || !profileUser) return;
    setConnecting(true);
    try {
      const res = await api.sendConnection(profileUserId);
      if (res.success) {
        showToast(`Connection request sent to ${profileUser.name}!`, 'success');
        setConnectionStatus('PENDING_SENT');
      } else {
        showToast(res.error || 'Failed to send connection request', 'error');
      }
    } catch (err) {
      showToast('Error sending connection request', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionId || !profileUser) return;
    setConnecting(true);
    try {
      const res = await api.respondToConnection(connectionId, 'ACCEPT');
      if (res.success) {
        showToast(`Successfully connected with ${profileUser.name}!`, 'success');
        setConnectionStatus('ACCEPTED');
      } else {
        showToast(res.error || 'Failed to accept connection', 'error');
      }
    } catch (err) {
      showToast('Error responding to connection', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleMessageColleague = async () => {
    if (!profileUserId) return;
    try {
      const res = await api.createConversation(profileUserId);
      if (res.success || res.id) {
        navigate('/chat');
      } else {
        showToast(res.error || 'Failed to start conversation', 'error');
      }
    } catch (err) {
      showToast('Error starting conversation', 'error');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await api.updateProfile(currentUser.id, {
          specialty,
          skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
          education,
          experience: { jobs: experience, publications },
          about: aboutText,
          medicalRegistrationNumber,
          stateMedicalCouncil,
          avatarUrl: base64String,
          bannerUrl: profileUser?.bannerUrl
        });
        if (res.success) {
          showToast('Profile picture updated successfully!', 'success');
          setProfileUser((prev: any) => ({ ...prev, avatarUrl: base64String }));
          if (res.user) {
            const updatedLocalUser = { ...currentUser, ...res.user };
            localStorage.setItem('linkedoc_user', JSON.stringify(updatedLocalUser));
          }
        } else {
          showToast(res.error || 'Failed to update profile picture', 'error');
        }
      } catch (err) {
        showToast('Error uploading profile picture', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await api.updateProfile(currentUser.id, {
          specialty,
          skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
          education,
          experience: { jobs: experience, publications },
          about: aboutText,
          medicalRegistrationNumber,
          stateMedicalCouncil,
          avatarUrl: profileUser?.avatarUrl,
          bannerUrl: base64String
        });
        if (res.success) {
          showToast('Profile background updated successfully!', 'success');
          setProfileUser((prev: any) => ({ ...prev, bannerUrl: base64String }));
          if (res.user) {
            const updatedLocalUser = { ...currentUser, ...res.user };
            localStorage.setItem('linkedoc_user', JSON.stringify(updatedLocalUser));
          }
        } else {
          showToast(res.error || 'Failed to update profile background', 'error');
        }
      } catch (err) {
        showToast('Error uploading profile background', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProfile();
  }, [profileUserId]);

  useEffect(() => {
    api.listUsers().then((res) => {
      if (res.success && Array.isArray(res.users)) {
        const list = res.users.filter((u: any) => u.id !== profileUserId);
        setSidebarColleagues(list);
      }
    }).catch(err => console.error(err));
  }, [profileUserId]);

  const handleSidebarConnect = async (id: string, name: string) => {
    if (id.startsWith('mock-')) {
      setSentConnections(prev => [...prev, id]);
      showToast(`Connection request sent to ${name}!`, 'success');
      return;
    }
    try {
      const res = await api.sendConnection(id);
      if (res.success) {
        showToast(`Connection request sent to ${name}!`, 'success');
        setSentConnections(prev => [...prev, id]);
      } else {
        showToast(res.error || 'Failed to send connection request', 'error');
      }
    } catch (err) {
      showToast('Error sending connection request', 'error');
    }
  };

  // Open edit modal & load inputs
  const handleOpenEdit = () => {
    setSpecialtyInput(specialty);
    setLocationInput(location);
    setSkillsInput(skillsStr);
    setEducationInput([...education]);
    setExperienceInput([...experience]);
    setAboutInput(aboutText);
    setMedicalRegistrationNumberInput(medicalRegistrationNumber);
    setStateMedicalCouncilInput(stateMedicalCouncil);
    setPublicationsInput([...publications]);
    setIsEditModalOpen(true);
  };

  // Save changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);

      const skillsArray = skillsInput.split(',').map((s: string) => s.trim()).filter(Boolean);
      const res = await api.updateProfile(currentUser.id, {
        specialty: specialtyInput,
        location: locationInput,
        skills: skillsArray,
        education: educationInput,
        experience: {
          jobs: experienceInput,
          publications: publicationsInput,
        },
        about: aboutInput,
        medicalRegistrationNumber: medicalRegistrationNumberInput,
        stateMedicalCouncil: stateMedicalCouncilInput,
        avatarUrl: profileUser?.avatarUrl,
        bannerUrl: profileUser?.bannerUrl,
      });

      if (res.success) {
        showToast('Profile updated successfully!', 'success');
        setSpecialty(specialtyInput);
        setLocation(locationInput);
        setSkillsStr(skillsInput);
        setEducation(educationInput);
        setExperience(experienceInput);
        setPublications(publicationsInput);
        setMedicalRegistrationNumber(medicalRegistrationNumberInput);
        setStateMedicalCouncil(stateMedicalCouncilInput);
        setAboutText(aboutInput);
        
        // Update local profileUser state
        setProfileUser((prev: any) => ({
          ...prev,
          specialty: specialtyInput,
          location: locationInput,
          skills: skillsArray,
          education: educationInput,
          experience: {
            jobs: experienceInput,
            publications: publicationsInput,
          },
          about: aboutInput,
          medicalRegistrationNumber: medicalRegistrationNumberInput,
          stateMedicalCouncil: stateMedicalCouncilInput,
        }));

        // Update local storage user status if returned
        if (res.user) {
          const updatedLocalUser = { ...currentUser, ...res.user };
          localStorage.setItem('linkedoc_user', JSON.stringify(updatedLocalUser));
        }

        setIsEditModalOpen(false);
      } else {
        showToast(res.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('An error occurred during profile save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImportPublication = async () => {
    if (!pubSearchQuery.trim()) {
      showToast('Please enter a DOI, PMID, or keyword to search', 'warning');
      return;
    }
    setIsImporting(true);
    try {
      const res = await api.searchPubMed(pubSearchQuery);
      if (res && (res.title || res.journal)) {
        const yearInt = parseInt(res.year) || new Date().getFullYear();
        const newPub: PublicationEntry = {
          title: res.title || '',
          journal: res.journal || '',
          year: yearInt,
          authors: res.authors || '',
        };
        setPublicationsInput([...publicationsInput, newPub]);
        setPubSearchQuery('');
        showToast('Publication metadata successfully imported!', 'success');
      } else {
        showToast('No publication metadata found for this query', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch publication metadata', 'error');
    } finally {
      setIsImporting(false);
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

  if (profileLoading || !profileUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', color: 'var(--text-secondary)' }}>
        <Loader className="animate-spin" size={36} style={{ color: 'var(--primary)' }} />
        <span>Loading clinical profile...</span>
      </div>
    );
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

  const dynamicColleagues = sidebarColleagues.map((u: any) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    specialty: u.specialty || (
      u.role === 'ADMIN' ? 'Healthcare Administrator' :
      u.role === 'RECRUITER' ? 'Clinical Recruiter' :
      u.role === 'RESEARCHER' ? 'Medical Researcher' :
      u.role === 'PHARMACIST' ? 'Pharmacist' :
      u.role === 'NURSE' ? 'Registered Nurse' :
      'Medical Practitioner'
    ),
    company: u.experience?.jobs?.[0]?.company || u.experience?.[0]?.company || 'LinkeDoc Network',
    avatarUrl: u.avatarUrl
  }));

  const allColleagues = dynamicColleagues.slice(0, 5);
  const potentialConnections = dynamicColleagues.length > 5 
    ? dynamicColleagues.slice(5, 10) 
    : dynamicColleagues.slice(0, 5);

  return (
    <section className="profile-page-container">
      <h1 className="sr-only">Medical Professional Profile</h1>
      <style>{`
        .profile-page-container {
          max-width: 1120px;
          margin: 24px auto;
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Profile Header */
        .profile-header-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
        }

        .profile-intro-banner {
          height: 200px;
          position: relative;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .banner-edit-trigger {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }
        .banner-edit-trigger:hover {
          background: #ffffff;
          transform: scale(1.05);
        }

        .profile-intro-details-row {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          text-align: left;
        }

        .profile-intro-left {
          flex: 1;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .profile-intro-avatar-wrapper {
          margin-top: -100px;
          position: relative;
          display: inline-block;
          border-radius: 50%;
          border: 4px solid var(--bg-secondary);
          background: var(--bg-tertiary);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          width: 152px;
          height: 152px;
          flex-shrink: 0;
        }

        .avatar-upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
          cursor: pointer;
        }
        .profile-intro-avatar-wrapper:hover .avatar-upload-overlay {
          opacity: 1;
        }

        .profile-intro-avatar {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 44px;
          color: var(--primary);
          background: var(--bg-tertiary);
        }

        .profile-intro-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .profile-intro-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .profile-intro-headline {
          font-size: 16px;
          color: var(--text-secondary);
          margin-top: 4px;
          line-height: 1.4;
          text-align: left;
        }

        .profile-intro-meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 12px;
          font-size: 13.5px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .meta-dot {
          color: var(--text-muted);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .profile-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        /* Profile Right side: Top Institution Snippets */
        .profile-intro-right {
          width: 240px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .header-institution-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .header-institution-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Responsive Hero Header */
        @media (max-width: 900px) {
          .profile-intro-details-row {
            flex-direction: column;
            padding: 16px;
          }
          .profile-intro-left {
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .profile-intro-avatar-wrapper {
            margin-top: -80px;
          }
          .profile-intro-right {
            width: 100%;
            margin-top: 16px;
            border-top: 1px solid var(--border);
            padding-top: 16px;
          }
        }

        /* Two Column Layout */
        .profile-main-layout {
          display: grid;
          grid-template-columns: 2.2fr 1fr;
          gap: 20px;
          width: 100%;
        }

        @media (max-width: 900px) {
          .profile-main-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Section Cards */
        .profile-section-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .profile-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .profile-section-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-edit-trigger {
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .btn-edit-trigger:hover {
          background: var(--bg-tertiary);
          color: var(--primary);
        }

        /* Experience and Education List items */
        .experience-item, .education-item, .publication-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }

        .experience-item:last-child, .education-item:last-child, .publication-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .experience-icon-wrapper, .education-icon-wrapper {
          width: 48px;
          height: 48px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .experience-details, .education-details {
          flex: 1;
        }

        .experience-job-title, .education-degree {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .experience-company-info, .education-school {
          font-size: 14.5px;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .experience-date, .education-date {
          font-size: 13px;
          color: var(--text-muted);
          margin: 4px 0 0 0;
        }

        /* Skills badges */
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: 30px;
          padding: 6px 14px;
          font-size: 13.5px;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .skill-badge:hover {
          background-color: var(--primary-glow);
          color: var(--primary);
          border-color: var(--primary);
        }

        /* Sidebar Widgets */
        .sidebar-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: left;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .sidebar-card-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 16px 0;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .sidebar-user-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
        }
        .sidebar-user-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .sidebar-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--primary);
          flex-shrink: 0;
          overflow: hidden;
          font-size: 14px;
        }

        .sidebar-user-info {
          flex: 1;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
        }

        .sidebar-user-title {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-action-btn {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 30px;
          color: var(--text-secondary);
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sidebar-action-btn:hover {
          background: var(--primary-glow);
          color: var(--primary);
          border-color: var(--primary);
        }

        /* Certificate Widget */
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
          border-radius: 50%;
          filter: blur(20px);
          opacity: 0.5;
        }

        .nmc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 30px;
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
        
        .btn-profile-sec {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-profile-sec:hover {
          background-color: var(--bg-tertiary) !important;
          border-color: var(--text-secondary) !important;
        }

        .profile-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          padding: 8px 0;
          overflow: hidden;
        }
        .profile-dropdown-menu.more-dropdown {
          left: auto;
          right: 0;
          min-width: 240px;
        }
        .dropdown-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          padding: 12px 16px;
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          color: var(--text-primary);
        }
        .dropdown-item.flex-row {
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
        }
        .dropdown-item:hover {
          background-color: var(--bg-secondary);
        }
        .dropdown-item-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .dropdown-item-desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .dropdown-item-icon {
          color: var(--text-secondary);
        }
        .dropdown-item-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
      `}</style>

      {/* Hidden file input elements for avatar and banner upload */}
      <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
      <input type="file" ref={bannerInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBannerUpload} />

      {/* 1. Header Card (Premium banner, avatar overlap, dynamic snippets, action buttons) */}
      <div className="profile-header-card">
        <div 
          className="profile-intro-banner"
          style={{
            background: profileUser?.bannerUrl 
              ? `url(${profileUser.bannerUrl}) center/cover no-repeat` 
              : 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
          }}
        >
          {isOwnProfile && (
            <button 
              type="button" 
              className="banner-edit-trigger"
              onClick={() => bannerInputRef.current?.click()}
              title="Change banner background"
            >
              <Camera size={16} />
            </button>
          )}
        </div>

        <div className="profile-intro-details-row">
          <div className="profile-intro-left">
            <div 
              className="profile-intro-avatar-wrapper"
              style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
            >
              {profileUser?.avatarUrl ? (
                <img 
                  src={profileUser.avatarUrl} 
                  alt={profileUser.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="profile-intro-avatar">
                  {getInitials(profileUser?.name || '')}
                </div>
              )}

              {isOwnProfile && (
                <div 
                  className="avatar-upload-overlay"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera size={24} />
                </div>
              )}
            </div>

            <div className="profile-intro-info">
              <div className="profile-intro-name">
                <span>
                  {profileUser?.role === 'DOCTOR' ? `Dr. ${profileUser?.name}` : profileUser?.name}
                </span>
                {profileUser?.role === 'DOCTOR' && renderStatusBadge(profileUser?.status)}
              </div>

              <div className="profile-intro-headline">
                {specialty || (
                  profileUser?.role === 'ADMIN' ? 'Healthcare Administrator' :
                  profileUser?.role === 'RECRUITER' ? 'Clinical Recruiter' :
                  profileUser?.role === 'RESEARCHER' ? 'Medical Researcher' :
                  profileUser?.role === 'PHARMACIST' ? 'Pharmacist' :
                  profileUser?.role === 'NURSE' ? 'Registered Nurse' :
                  'Medical Practitioner'
                )}
              </div>

              <div className="profile-intro-meta-row">
                {location ? (
                  <>
                    <span className="meta-item">
                      <MapPin size={14} /> {location}
                    </span>
                    <span className="meta-dot">•</span>
                  </>
                ) : isOwnProfile ? (
                  <>
                    <span 
                      className="meta-item" 
                      style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}
                      onClick={handleOpenEdit}
                    >
                      <MapPin size={14} /> Add location
                    </span>
                    <span className="meta-dot">•</span>
                  </>
                ) : null}
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {profileUser?.connectionsCount || 0} connection{profileUser?.connectionsCount !== 1 ? 's' : ''}
                </span>
                {profileUser?.role === 'DOCTOR' && medicalRegistrationNumber && (
                  <>
                    <span className="meta-dot">•</span>
                    <span>MRN: <strong style={{ color: 'var(--text-primary)' }}>{medicalRegistrationNumber}</strong> ({stateMedicalCouncil || 'State Council'})</span>
                  </>
                )}
              </div>

              <div className="profile-actions-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isOwnProfile ? (
                  <>
                    <div ref={openToDropdownRef} style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setIsOpenToDropdownOpen(!isOpenToDropdownOpen)}
                        className="btn-primary" 
                        style={{ padding: '8px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: 600 }}
                      >
                        Open to
                      </button>
                      
                      {isOpenToDropdownOpen && (
                        <div className="profile-dropdown-menu open-to-dropdown">
                          <button className="dropdown-item" onClick={() => { setIsOpenToDropdownOpen(false); showToast("Feature 'Hiring' under development", "info"); }}>
                            <div className="dropdown-item-title">Hiring</div>
                            <div className="dropdown-item-desc">Share that you're hiring and attract qualified candidates</div>
                          </button>
                          <button className="dropdown-item" onClick={() => { setIsOpenToDropdownOpen(false); showToast("Feature 'Providing services' under development", "info"); }}>
                            <div className="dropdown-item-title">Providing services</div>
                            <div className="dropdown-item-desc">Showcase services you offer so new clients can discover you</div>
                          </button>
                        </div>
                      )}
                    </div>

                    <button className="btn-profile-sec" onClick={handleOpenEdit}>
                      Edit Profile
                    </button>

                    <div ref={moreDropdownRef} style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                        className="btn-profile-sec" 
                        style={{ width: '40px', padding: '8px 0', display: 'flex', justifyContent: 'center' }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {isMoreDropdownOpen && (
                        <div className="profile-dropdown-menu more-dropdown">
                          <button className="dropdown-item flex-row" onClick={() => { setIsMoreDropdownOpen(false); showToast("Profile link copied to clipboard!", "success"); navigator.clipboard.writeText(window.location.href); }}>
                            <Send size={16} className="dropdown-item-icon" />
                            <span className="dropdown-item-text">Send profile in a message</span>
                          </button>
                          <button className="dropdown-item flex-row" onClick={() => { setIsMoreDropdownOpen(false); window.print(); }}>
                            <Download size={16} className="dropdown-item-icon" />
                            <span className="dropdown-item-text">Save to PDF</span>
                          </button>
                          <button className="dropdown-item flex-row" onClick={() => { setIsMoreDropdownOpen(false); navigate('/saved-items'); }}>
                            <Bookmark size={16} className="dropdown-item-icon" />
                            <span className="dropdown-item-text">Saved items</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleMessageColleague}
                      className="btn-primary" 
                      style={{ padding: '8px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <MessageSquare size={16} />
                      Message
                    </button>
                    
                    {connectionStatus === 'ACCEPTED' ? (
                      <button 
                        disabled
                        className="btn-profile-sec" 
                        style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <UserCheck size={16} />
                        Connected
                      </button>
                    ) : connectionStatus === 'PENDING_SENT' ? (
                      <button 
                        disabled
                        className="btn-profile-sec" 
                        style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Clock size={16} />
                        Pending Sent
                      </button>
                    ) : connectionStatus === 'PENDING_RECEIVED' ? (
                      <button 
                        onClick={handleAcceptConnection}
                        disabled={connecting}
                        className="btn-primary" 
                        style={{ padding: '8px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {connecting ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Accept Connection
                      </button>
                    ) : (
                      <button 
                        onClick={handleSendConnection}
                        disabled={connecting}
                        className="btn-primary" 
                        style={{ padding: '8px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {connecting ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Connect
                      </button>
                    )}
                    
                    <button className="btn-profile-sec" style={{ width: '40px', padding: '8px 0', display: 'flex', justifyContent: 'center', borderRadius: '30px', border: '1px solid var(--border)', background: 'transparent' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-intro-right">
            {experience.length > 0 && (
              <div className="header-institution-item">
                <Building size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>{experience[0].company}</span>
              </div>
            )}
            {education.length > 0 && (
              <div className="header-institution-item">
                <GraduationCap size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>{education[0].school}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Split Layout */}
      <div className="profile-main-layout">
        {/* Left Column - User credentials & achievements */}
        <div className="profile-left-column">
          {/* About Section */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title"><FileText size={18} /> About</h2>
              {isOwnProfile && <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={15} /></button>}
            </div>
            <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {aboutText}
            </p>
          </div>

          {/* Experience Section */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title"><Building size={18} /> Clinical Experience</h2>
              {isOwnProfile && <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={15} /></button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {experience.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0, fontStyle: 'italic' }}>
                  No experience details added yet. Click edit to write work history.
                </p>
              ) : (
                experience.map((exp: ExperienceEntry, idx: number) => (
                  <div key={idx} className="experience-item">
                    <div className="experience-icon-wrapper">
                      <Building size={20} />
                    </div>
                    <div className="experience-details">
                      <h3 className="experience-job-title">{exp.title}</h3>
                      <p className="experience-company-info">{exp.company}</p>
                      <p className="experience-date">{exp.year}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Education Section */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title"><GraduationCap size={18} /> Education</h2>
              {isOwnProfile && <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={15} /></button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {education.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0, fontStyle: 'italic' }}>
                  No education history added yet. Click edit to add medical degree details.
                </p>
              ) : (
                education.map((edu: EducationEntry, idx: number) => (
                  <div key={idx} className="education-item">
                    <div className="education-icon-wrapper">
                      <GraduationCap size={20} />
                    </div>
                    <div className="education-details">
                      <h3 className="education-degree">{edu.degree}</h3>
                      <p className="education-school">{edu.school}</p>
                      <p className="education-date">Class of {edu.year}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Publications Section */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title"><BookOpen size={18} /> Publications & Research Papers</h2>
              {isOwnProfile && <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={15} /></button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {publications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0, fontStyle: 'italic' }}>
                  No medical publications indexed. Add peer-reviewed articles to generate AMA citations.
                </p>
              ) : (
                publications.map((pub: PublicationEntry, idx: number) => (
                  <div key={idx} className="publication-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="publication-title">{pub.title}</h3>
                      <span className="publication-badge">AMA Format</span>
                    </div>
                    <div className="publication-citation">
                      {formatAMACitation(pub)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Expertise (Skills) Section */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title"><Award size={18} /> Key Expertise</h2>
              {isOwnProfile && <button onClick={handleOpenEdit} className="btn-edit-trigger"><Edit2 size={15} /></button>}
            </div>
            {skillsStr.trim() === '' ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0, fontStyle: 'italic' }}>
                No skills listed. Click edit to catalog specialties.
              </p>
            ) : (
              <div className="skills-list">
                {skillsStr.split(',').map((s: string, idx: number) => (
                  <span key={idx} className="skill-badge">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Verification details, sidebars, group lists */}
        <div className="profile-right-column">
          {/* Medical Credentials / Verification status */}
          {profileUser?.role === 'DOCTOR' && (
            <div className="sidebar-card verification-certificate-tile">
              <h3 className="sidebar-card-title"><Award size={18} /> Medical Credentials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Registration Status</span>
                  <div style={{ marginTop: '4px' }}>{renderStatusBadge(profileUser?.status)}</div>
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
            </div>
          )}

          {/* People also viewed sidebar */}
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">People also viewed</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {allColleagues.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                  No other clinical profiles found in the directory.
                </div>
              ) : (
                allColleagues.map((colleague) => {
                  const isSent = sentConnections.includes(colleague.id);
                  return (
                    <div key={colleague.id} className="sidebar-user-item">
                      <div className="sidebar-user-avatar">
                        {colleague.avatarUrl ? (
                          <img src={colleague.avatarUrl} alt={colleague.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(colleague.name)
                        )}
                      </div>
                      <div className="sidebar-user-info">
                        <Link to={`/profile?id=${colleague.id}`} className="sidebar-user-name" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {colleague.name}
                        </Link>
                        <div className="sidebar-user-title">
                          {colleague.specialty} • {colleague.company}
                        </div>
                        <button 
                          onClick={() => handleSidebarConnect(colleague.id, colleague.name)}
                          className="sidebar-action-btn"
                          disabled={isSent}
                          style={{
                            background: isSent ? 'var(--bg-tertiary)' : 'transparent',
                            color: isSent ? 'var(--text-muted)' : 'var(--text-secondary)'
                          }}
                        >
                          {isSent ? 'Pending' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Medical Societies & Joined Groups sidebar */}
          {isOwnProfile && (
            <div className="sidebar-card">
              <h3 className="sidebar-card-title"><Users size={18} /> Medical Societies & Groups</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {joinedGroups.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    You have not joined any clinical discussion groups yet. Head over to Groups tab to explore!
                  </div>
                ) : (
                  joinedGroups.map((grp) => (
                    <div key={grp.id} style={{ display: 'flex', gap: '10px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div className="experience-icon-wrapper" style={{ width: '32px', height: '32px', borderRadius: '4px' }}>
                        <Users size={14} />
                      </div>
                      <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {grp.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* People you may know sidebar */}
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">People you may know</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {potentialConnections.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                  No connection suggestions at the moment.
                </div>
              ) : (
                potentialConnections.map((colleague) => {
                  const isSent = sentConnections.includes(colleague.id);
                  return (
                    <div key={colleague.id} className="sidebar-user-item">
                      <div className="sidebar-user-avatar">
                        {colleague.avatarUrl ? (
                          <img src={colleague.avatarUrl} alt={colleague.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(colleague.name)
                        )}
                      </div>
                      <div className="sidebar-user-info">
                        <Link to={`/profile?id=${colleague.id}`} className="sidebar-user-name" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {colleague.name}
                        </Link>
                        <div className="sidebar-user-title">
                          {colleague.specialty} • {colleague.company}
                        </div>
                        <button 
                          onClick={() => handleSidebarConnect(colleague.id, colleague.name)}
                          className="sidebar-action-btn"
                          disabled={isSent}
                          style={{
                            background: isSent ? 'var(--bg-tertiary)' : 'transparent',
                            color: isSent ? 'var(--text-muted)' : 'var(--text-secondary)'
                          }}
                        >
                          {isSent ? 'Pending' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h3>Edit Intro & Professional History</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                
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

                {/* Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="modal-location" style={{ fontSize: '13px', fontWeight: 600 }}>Location</label>
                  <input
                    id="modal-location"
                    type="text"
                    className="input-glass"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. Mumbai, India or Delhi, India"
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
                  
                  {/* DOI / PMID Auto-import search */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Auto-Import via DOI / PMID / Keywords</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="input-glass"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                        placeholder="e.g. 10.1002/lary.28205 or 31741362 or COVID-19 cardiology"
                        value={pubSearchQuery}
                        onChange={(e) => setPubSearchQuery(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: '12px' }}
                        onClick={handleImportPublication}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importing...' : 'Auto-Import'}
                      </button>
                    </div>
                  </div>

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

              <div className="modal-footer" style={{ flexShrink: 0 }}>
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
    </section>
  );
};

export default ProfileBuilder;
