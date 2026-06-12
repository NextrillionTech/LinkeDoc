import React from 'react';
import { useSEO } from '../utils/seo';

export const About: React.FC = () => {
  useSEO('About LinkeDoc', 'Learn about LinkeDoc, the secure professional network and collaboration platform for medical practitioners.');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-glass" style={{ padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>About LinkeDoc</h1>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          LinkeDoc is a specialized, secure professional network and career platform built exclusively for verified medical professionals, healthcare recruiters, and clinical researchers.
        </p>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          Our mission is to foster collaborative medicine, simplify professional connection among clinicians, and facilitate knowledge exchange in a privacy-respecting environment.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Core Pillars</h2>
        
        <ul style={{ paddingLeft: '20px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <strong>Secure Case Collaboration:</strong> Discuss clinical findings with peers using interactive HIPAA-compliant media editing and image anonymization features.
          </li>
          <li>
            <strong>E2EE Direct Messaging:</strong> Communicate in real-time with double-ratchet end-to-end encrypted messaging, ensuring patient confidentiality is maintained.
          </li>
          <li>
            <strong>Verified Registries:</strong> Connect only with actual practitioners who hold verified licenses and state medical council registration numbers.
          </li>
          <li>
            <strong>Healthcare Careers:</strong> Browse residency slots, clinical fellowships, hospital vacancies, and specialized medical recruiter postings.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default About;
