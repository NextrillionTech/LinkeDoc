import React from 'react';
import { useSEO } from '../utils/seo';

export const HelpCenter: React.FC = () => {
  useSEO('Help Center', 'Find articles, guides, and contact options for LinkeDoc platform support and license verification.');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-glass" style={{ padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>Help Center</h1>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          Welcome to the LinkeDoc Help Center. Find answers to common questions, verification details, and guides on secure clinical messaging.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px 0' }}>How do I verify my clinical license?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Provide your Medical Registration Number (MRN) or professional license details during profile onboarding. Our administrator team validates credentials against official licensing databases before approving full read-write privileges.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px 0' }}>How does E2EE messaging protect patient files?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              We implement the double-ratchet key-exchange protocol. When you start a chat, cryptographic keys are exchanged, and message payloads are encrypted locally on your browser before transmission, preventing intercept access.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px 0' }}>How can I censor patient identifiers on attachments?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              When attaching any image/x-ray scan inside the post composer, click 'Annotate & Censor' to launch the canvas editor and apply black rectangles over sensitive areas before sending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
