import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Lock, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  Star
} from 'lucide-react';
import { useSEO } from '../utils/seo';

interface SpecialtyInfo {
  name: string;
  tagline: string;
  desc: string;
  activeDoctors: string;
  threadsCount: string;
  recentTopic: string;
}

const specialtiesData: Record<string, SpecialtyInfo> = {
  Cardiology: {
    name: 'Cardiology',
    tagline: 'Heart Health & Vascular Medicine',
    desc: 'Collaborate with electrophysiologists and interventional cardiologists to review ECG anomalies, angiogram reports, and discuss clinical trials on heart failures.',
    activeDoctors: '4,500+ Boarded Doctors',
    threadsCount: '1,200+ Case Reviews',
    recentTopic: 'Interpretation of unusual ST-elevation in a 45-year-old active runner'
  },
  Pediatrics: {
    name: 'Pediatrics',
    tagline: 'Neonatal & Child Healthcare',
    desc: 'Discuss childhood immunization guidelines, developmental milestones, neonatology cases, and pediatric emergency protocols with global practitioners.',
    activeDoctors: '3,800+ Verified Pediatricians',
    threadsCount: '980+ Thread Topics',
    recentTopic: 'Managing drug dosages in neonates with congenital renal dysfunction'
  },
  Oncology: {
    name: 'Oncology',
    tagline: 'Cancer Research & Care',
    desc: 'Share insights on radiotherapy mapping, target therapies, clinical chemotherapy doses, and read research paper abstracts on oncology trials.',
    activeDoctors: '2,900+ Specialists',
    threadsCount: '740+ Active Research Papers',
    recentTopic: 'Outcome trends in immunotherapy combinations for advanced NSCLC'
  },
  Neurology: {
    name: 'Neurology',
    tagline: 'Brain & Nervous System Sciences',
    desc: 'Exchange case files on stroke protocols, neuropathies, neuro-oncology diagnostics, and surgical intervention timelines with neurologists and neurosurgeons.',
    activeDoctors: '3,200+ Active Clinicians',
    threadsCount: '850+ Deep Discussions',
    recentTopic: 'Atypical presentation of Guillain-Barré syndrome post-viral infection'
  },
  'General Medicine': {
    name: 'General Medicine',
    tagline: 'Primary Care & Clinical Practice',
    desc: 'The central hub for general practitioners, family physicians, and residents. Discuss diagnostics, diagnostic tools, patient triaging, and clinic management.',
    activeDoctors: '8,000+ Medical Members',
    threadsCount: '3,100+ Diagnostic Cases',
    recentTopic: 'Refractory hypertension control strategies in elderly diabetic patients'
  }
};

export const Landing: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('Cardiology');
  
  useSEO(
    'Professional Medical Network',
    'Join LinkeDoc, the secure, verified network exclusively for medical professionals. Connect with peers, share research, and explore clinical vacancies.'
  );

  const activeSpecialty = specialtiesData[selectedTab];

  return (
    <div className="landing-page-root">
      <style>{`
        /* Landing Page Specific Design Variables & Animations */
        .landing-page-root {
          width: 100%;
          overflow-x: hidden;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body);
        }

        /* Hero Wave Background Layout */
        .hero-section-container {
          position: relative;
          padding: 80px 24px 100px;
          background: linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(5, 104, 94, 0.04) 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .hero-grid {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 968px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
          .hero-buttons-row {
            justify-content: center;
          }
        }

        .hero-title-text {
          font-size: 52px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          background: linear-gradient(120deg, var(--text-primary) 40%, var(--primary) 90%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (max-width: 640px) {
          .hero-title-text {
            font-size: 38px;
          }
        }

        .hero-body-text {
          font-size: 17px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 32px;
          max-width: 640px;
        }

        @media (max-width: 968px) {
          .hero-body-text {
            margin-left: auto;
            margin-right: auto;
          }
        }

        .hero-buttons-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-landing-cta {
          font-family: var(--font-display);
          font-weight: 600;
          padding: 14px 28px;
          border-radius: var(--radius-sm);
          font-size: 15px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast);
        }

        .btn-landing-primary {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 4px 14px var(--primary-glow);
        }

        .btn-landing-primary:hover {
          transform: translateY(-2px);
          opacity: 0.95;
          box-shadow: 0 6px 20px var(--primary-glow);
        }

        .btn-landing-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .btn-landing-secondary:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-hover);
        }

        .hero-image-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .hero-main-img {
          width: 100%;
          max-width: 440px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          object-fit: cover;
          aspect-ratio: 1;
        }

        .hero-badge-overlay {
          position: absolute;
          bottom: 24px;
          left: 10%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid #dcdcdc;
          border-radius: var(--radius-md);
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-md);
          animation: floatOverlay 3s ease-in-out infinite alternate;
        }

        .theme-dark .hero-badge-overlay {
          background: rgba(29, 34, 38, 0.9);
          border-color: rgba(255, 255, 255, 0.15);
        }

        @keyframes floatOverlay {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        /* sliding marquee style */
        .marquee-strip-container {
          background: linear-gradient(90deg, #05685e 0%, #0891b2 100%);
          padding: 14px 0;
          color: #ffffff;
          overflow: hidden;
          white-space: nowrap;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .marquee-track {
          display: inline-block;
          animation: marqueeScroll 25s linear infinite;
        }

        .marquee-item {
          display: inline-flex;
          align-items: center;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-right: 48px;
        }

        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        /* Sections standard layout */
        .landing-section-wrapper {
          padding: 80px 24px;
          display: flex;
          justify-content: center;
        }

        .landing-section-inner {
          max-width: 1200px;
          width: 100%;
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-tagline {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: block;
          margin-bottom: 8px;
        }

        .section-main-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0;
        }

        /* Mission & Stats */
        .mission-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 60px;
          align-items: center;
        }

        @media (max-width: 868px) {
          .mission-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .stats-block-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }

        .stat-card-item {
          padding: 20px;
          border-radius: var(--radius-md);
          text-align: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--primary);
          display: block;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        /* Specialty Selector Tabs */
        .specialty-selector-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-sm);
        }

        .specialty-tabs-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          overflow-x: auto;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
        }

        .specialty-tab-btn {
          background: none;
          border: none;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 18px;
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .specialty-tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .specialty-tab-btn.active {
          color: var(--primary);
          background: var(--primary-glow);
        }

        .specialty-showcase-box {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .specialty-showcase-box {
            grid-template-columns: 1fr;
          }
        }

        /* Feature Cards Grid */
        .features-quad-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 768px) {
          .features-quad-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-card-item {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          gap: 20px;
        }

        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Testimonials Layout */
        .testimonials-masonry {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        @media (max-width: 968px) {
          .testimonials-masonry {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .testimonials-masonry {
            grid-template-columns: 1fr;
          }
        }

        .review-card-item {
          padding: 24px;
          border-radius: var(--radius-md);
        }

        .reviewer-info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .reviewer-avatar-placeholder {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        /* Banner CTA Bottom Section */
        .cta-bottom-banner {
          background: linear-gradient(135deg, #05685e 0%, #164e63 100%);
          color: #ffffff;
          padding: 60px 40px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          box-shadow: var(--shadow-lg);
        }

        .cta-bottom-banner h2 {
          color: #ffffff;
          font-size: 36px;
          margin-bottom: 12px;
        }

        .cta-bottom-banner p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          max-width: 600px;
          margin: 0 auto 32px;
        }

        /* Footer Layout overrides for landing */
        .landing-footer {
          background: #033f39;
          color: rgba(255, 255, 255, 0.7);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 60px 24px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .footer-columns-row {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 40px;
          margin-bottom: 40px;
        }

        @media (max-width: 768px) {
          .footer-columns-row {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 30px;
          }
        }

        .footer-brand-column img {
          height: 38px;
          margin-bottom: 16px;
        }

        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links-list li {
          margin-bottom: 10px;
        }

        .footer-link-item {
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          font-size: 13px;
          transition: color var(--transition-fast);
        }

        .footer-link-item:hover {
          color: #ffffff;
        }

        .footer-bottom-bar {
          max-width: 1200px;
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }

        @media (max-width: 640px) {
          .footer-bottom-bar {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-section-container">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="section-tagline">LinkeDoc Professional</span>
            <h1 className="hero-title-text">
              The Secure Gateway for Clinicians & Researchers
            </h1>
            <p className="hero-body-text">
              Join the dedicated network for verified medical practitioners. Collaborate on complex clinical cases, share peer-reviewed articles, exchange secure messages, and explore residency or specialist job postings under a single protected portal.
            </p>
            <div className="hero-buttons-row">
              <Link to="/signup" className="btn-landing-cta btn-landing-primary">
                Join the Network <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-landing-cta btn-landing-secondary">
                Doctor Sign In
              </Link>
            </div>
          </div>
          
          <div className="hero-image-wrapper">
            <img 
              src="/smiling_doctor_hero.png" 
              alt="Verified Physician smiling" 
              className="hero-main-img" 
            />
            <div className="hero-badge-overlay">
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <strong style={{ fontSize: '12px', display: 'block', color: 'var(--text-primary)' }}>NPPES Verified</strong>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HIPAA Compliant discussions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* sliding trust bar */}
      <div className="marquee-strip-container" aria-hidden="true">
        <div className="marquee-track">
          <span className="marquee-item"><Shield size={13} style={{ marginRight: '6px' }} /> End-to-End Encrypted</span>
          <span className="marquee-item"><CheckCircle size={13} style={{ marginRight: '6px' }} /> NMC & NPI Credential Seeding</span>
          <span className="marquee-item"><Users size={13} style={{ marginRight: '6px' }} /> Medical Specialty Forums</span>
          <span className="marquee-item"><Lock size={13} style={{ marginRight: '6px' }} /> Zero Ad-Targeting</span>
          <span className="marquee-item"><Briefcase size={13} style={{ marginRight: '6px' }} /> Healthcare Job Vacancies</span>
          <span className="marquee-item"><FileText size={13} style={{ marginRight: '6px' }} /> HIPAA Discussion Shield</span>
          {/* duplicate for infinite looping scroll scroll */}
          <span className="marquee-item"><Shield size={13} style={{ marginRight: '6px' }} /> End-to-End Encrypted</span>
          <span className="marquee-item"><CheckCircle size={13} style={{ marginRight: '6px' }} /> NMC & NPI Credential Seeding</span>
          <span className="marquee-item"><Users size={13} style={{ marginRight: '6px' }} /> Medical Specialty Forums</span>
          <span className="marquee-item"><Lock size={13} style={{ marginRight: '6px' }} /> Zero Ad-Targeting</span>
          <span className="marquee-item"><Briefcase size={13} style={{ marginRight: '6px' }} /> Healthcare Job Vacancies</span>
          <span className="marquee-item"><FileText size={13} style={{ marginRight: '6px' }} /> HIPAA Discussion Shield</span>
        </div>
      </div>

      {/* Mission & Stats */}
      <section className="landing-section-wrapper">
        <div className="landing-section-inner">
          <div className="mission-grid">
            <div className="hero-image-wrapper">
              <img 
                src="/medium-shot-doctors-wearing-protective-equipment.jpg" 
                alt="Medical team collaborating" 
                style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
              />
            </div>
            <div>
              <span className="section-tagline">Our Clinical Mission</span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>
                Bridging Professional Distance Securely
              </h2>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                Healthcare is demanding, and discussions require absolute confidentiality and verification. LinkeDoc eliminates non-medical distractions by strictly vetting each user role (Doctors, Nurses, Pharmacists, and Researchers) via public licensing databases. Join colleagues in specialized discussions, access job boards containing scraped medical openings, and exchange diagnostic notes without privacy vulnerabilities.
              </p>
              
              <div className="stats-block-row">
                <div className="card-glass stat-card-item">
                  <span className="stat-value">140+</span>
                  <span className="stat-label">Medical Specialisms</span>
                </div>
                <div className="card-glass stat-card-item">
                  <span className="stat-value">120K+</span>
                  <span className="stat-label">Verified Members</span>
                </div>
                <div className="card-glass stat-card-item">
                  <span className="stat-value">8K+</span>
                  <span className="stat-label">Research Shares</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Specialty Forums Selector Showcase */}
      <section className="landing-section-wrapper" style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="section-tagline">Specialty Directory</span>
            <h2 className="section-main-title">Specialty-Specific Medical Forums</h2>
          </div>

          <div className="specialty-selector-container">
            <div className="specialty-tabs-row">
              {Object.keys(specialtiesData).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`specialty-tab-btn ${selectedTab === key ? 'active' : ''}`}
                  onClick={() => setSelectedTab(key)}
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="specialty-showcase-box">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeSpecialty.tagline}
                </span>
                <h3 style={{ fontSize: '24px', margin: '8px 0 16px 0', fontWeight: 800 }}>
                  Explore {activeSpecialty.name} Conversations
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {activeSpecialty.desc}
                </p>
                <div className="stats-block-row" style={{ marginTop: '0', marginBottom: '24px', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', color: 'var(--primary)' }}>
                      {activeSpecialty.activeDoctors}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Verified active peers</span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', color: 'var(--primary)' }}>
                      {activeSpecialty.threadsCount}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Topics & Case Studies</span>
                  </div>
                </div>

                <Link to="/forums" className="btn-landing-cta btn-landing-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                  Open {activeSpecialty.name} Forums
                </Link>
              </div>

              <div className="card-glass" style={{ borderLeft: '3px solid var(--primary)', padding: '20px' }}>
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <TrendingUp size={12} /> Recent Hot Topic
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.4, marginBottom: '12px' }}>
                  "{activeSpecialty.recentTopic}"
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Dr</div>
                  <span>Shared by verified Practitioner • 3h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="landing-section-wrapper">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="section-tagline">Integrated Capabilities</span>
            <h2 className="section-main-title">Core Features Built for Healthcare</h2>
          </div>

          <div className="features-quad-grid">
            <div className="card-glass feature-card-item">
              <div className="feature-icon-wrapper">
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>E2EE Direct Messaging</h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                  Message colleagues directly with robust cryptographical client-side encryption keys. Share medical feedback, coordinate care, or exchange advice with total privacy.
                </p>
              </div>
            </div>

            <div className="card-glass feature-card-item">
              <div className="feature-icon-wrapper">
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>Verified Specialty Forums</h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                  Access structured categories dedicated to clinical specialties. Write updates, attach medical research papers, collect community likes, and write replies.
                </p>
              </div>
            </div>

            <div className="card-glass feature-card-item">
              <div className="feature-icon-wrapper">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>Medical Vacancies Scraper</h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                  Explore active clinical listings fetched dynamically from HigherEdJobs RSS feeds and seeded by hospitals, filterable by location index and specialties.
                </p>
              </div>
            </div>

            <div className="card-glass feature-card-item">
              <div className="feature-icon-wrapper">
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>Verified Profile Resume Builder</h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                  Generate professional, beautifully formatted PDF clinical CV summaries directly from your license-verified profile details, complete with printing stylesheet formatting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinician Reviews / Testimonials */}
      <section className="landing-section-wrapper" style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="section-tagline">Clinician Reviews</span>
            <h2 className="section-main-title">What Our Verified Members Say</h2>
          </div>

          <div className="testimonials-masonry">
            <div className="card-glass review-card-item">
              <div className="reviewer-info-row">
                <div className="reviewer-avatar-placeholder">AS</div>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>Dr. Amit Sharma, MD</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cardiologist • Delhi</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)', marginBottom: '12px' }}>
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                "LinkeDoc has completely transformed how I discuss anomalies with colleagues. The NPI verification gives me confidence that I am talking to real, verified peers. The E2EE chat is extremely fast."
              </p>
            </div>

            <div className="card-glass review-card-item">
              <div className="reviewer-info-row">
                <div className="reviewer-avatar-placeholder">PP</div>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>Dr. Priya Patel, DNB</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pediatrician • Mumbai</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)', marginBottom: '12px' }}>
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                "I use the medical job board to keep track of residency and fellowship vacancies. Having real scraped listings with salary calculators made finding clinical opportunities incredibly easy."
              </p>
            </div>

            <div className="card-glass review-card-item">
              <div className="reviewer-info-row">
                <div className="reviewer-avatar-placeholder">RK</div>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>Dr. Rajesh Kumar, PhD</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Oncology Researcher • Bengaluru</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)', marginBottom: '12px' }}>
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                "Sharing oncological research updates here gets direct visibility from practicing clinical consultants. LinkeDoc bridges clinical practice and medical research beautifully."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="landing-section-wrapper">
        <div className="landing-section-inner">
          <div className="cta-bottom-banner">
            <h2>Ready to Build Your Clinical Network?</h2>
            <p>
              Join a dedicated professional medical community. Vetting takes less than 2 minutes via automated registry verification.
            </p>
            <Link to="/signup" className="btn-landing-cta btn-landing-primary" style={{ background: '#ffffff', color: 'var(--primary)', padding: '14px 32px' }}>
              Create Your Free Account <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="footer-columns-row">
          <div className="footer-brand-column">
            <img src="/logo.svg" alt="LinkeDoc Logo" />
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.55)', margin: '8px 0 0 0' }}>
              The secure professional gateway for clinicians, residents, and researchers.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Pages</h4>
            <ul className="footer-links-list">
              <li><Link to="/about" className="footer-link-item">About Us</Link></li>
              <li><Link to="/accessibility" className="footer-link-item">Accessibility</Link></li>
              <li><Link to="/help" className="footer-link-item">Help Center</Link></li>
              <li><Link to="/privacy" className="footer-link-item">Privacy & Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Features</h4>
            <ul className="footer-links-list">
              <li><Link to="/forums" className="footer-link-item">Clinical Forums</Link></li>
              <li><Link to="/jobs" className="footer-link-item">Vacancies Board</Link></li>
              <li><Link to="/chat" className="footer-link-item">Encrypted Chat</Link></li>
              <li><Link to="/groups" className="footer-link-item">Medical Groups</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '16px', fontWeight: 600 }}>Verification</h4>
            <p style={{ fontSize: '12px', lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.45)', margin: 0 }}>
              Automatic vetting enabled via NPPES NPI registries and NMC Medical Registration records.
            </p>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>LinkeDoc Corporation © 2026. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/privacy" className="footer-link-item" style={{ fontSize: '11px' }}>Privacy Policy</Link>
            <Link to="/privacy" className="footer-link-item" style={{ fontSize: '11px' }}>Terms of Service</Link>
            <Link to="/accessibility" className="footer-link-item" style={{ fontSize: '11px' }}>ADA Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
