import React from 'react';
import { useSEO } from '../utils/seo';

export const Accessibility: React.FC = () => {
  useSEO('Accessibility Statement', 'LinkeDoc accessibility statement, compliance goals, and feedback contact information.');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-glass" style={{ padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>Accessibility Statement</h1>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          LinkeDoc is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone, and applying the relevant accessibility standards to make professional medical collaboration inclusive.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Conformance Status</h2>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
          The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. LinkeDoc is partially conformant with WCAG 2.1 level AA guidelines.
        </p>
        
        <h2 style={{ fontSize: '20px', marginTop: '30px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Feedback & Technical Specifications</h2>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Accessibility of LinkeDoc relies on HTML, CSS, JavaScript, and WAI-ARIA technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer.
        </p>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '16px' }}>
          We welcome your feedback on the accessibility of LinkeDoc. Please let us know if you encounter accessibility barriers by reaching out to our support channel.
        </p>
      </div>
    </div>
  );
};

export default Accessibility;
