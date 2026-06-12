import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { useSEO } from '../utils/seo';

export const NotFound: React.FC = () => {
  useSEO('Page Not Found', 'The requested medical resource or directory page could not be located.');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="card-glass" style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AlertCircle size={36} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Resource Not Found
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.6
        }}>
          The page or medical file you are trying to access doesn't exist, has been archived, or is restricted to authenticated clinical staff.
        </p>

        <Link
          to="/"
          id="notfound-home-link"
          className="btn-primary"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            marginTop: '8px'
          }}
        >
          <Home size={16} />
          <span>Go to Home Feed</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
