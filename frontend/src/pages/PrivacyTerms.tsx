import React from 'react';
import { useSEO } from '../utils/seo';

export const PrivacyTerms: React.FC = () => {
  useSEO('Privacy & Terms', 'LinkeDoc privacy policy and terms of service guidelines for medical professionals.');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-glass" style={{ padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>Privacy Policy & Terms</h1>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          This page outlines our Privacy Policy and Terms of Service. Please review them carefully as they govern your use of the LinkeDoc medical network.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>1. Data Privacy & Confidentiality</h2>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          LinkeDoc is committed to protecting patient confidentiality and practitioner data privacy. Direct messages are encrypted using client-side double-ratchet algorithms, ensuring only intended clinical participants can access the message payloads. We do not store or process clinical images with PII unless manually redacted by verified practitioners.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>2. Professional Conduct & HIPAA</h2>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          By registering on LinkeDoc, you agree that you are a certified medical professional or official healthcare recruiter. Any medical discussions, research papers, or clinical case sharing must follow HIPAA and national healthcare patient privacy rules. Any violation of licensing verification checks or patient privacy will lead to permanent registry bans.
        </p>
      </div>
    </div>
  );
};

export default PrivacyTerms;
