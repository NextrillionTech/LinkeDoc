import React, { useState } from 'react';
import { api } from '../services/api';

interface CreateThreadFormProps {
  categoryId: string;
  onSuccess: () => void;
}

export const CreateThreadForm: React.FC<CreateThreadFormProps> = ({ categoryId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.createThread(categoryId, title, body);
      if (res.success) {
        setMessage('Thread created successfully!');
        setTitle('');
        setBody('');
        onSuccess();
      } else {
        setError(res.error || 'Failed to create thread.');
      }
    } catch (err) {
      setError('An error occurred while creating the thread.');
    }
  };

  return (
    <div className="card-glass" style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '16px' }}>Start a New Clinical Discussion</h3>
      {message && <div style={{ color: 'var(--success)', marginBottom: '12px', fontSize: '14px' }}>{message}</div>}
      {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="thread-title" style={{ fontSize: '14px', fontWeight: 500 }}>Topic / Title</label>
          <input
            id="thread-title"
            type="text"
            className="input-glass"
            placeholder="e.g. Analysis of ACC Hypertension Guidelines"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="thread-body" style={{ fontSize: '14px', fontWeight: 500 }}>Discussion Details</label>
          <textarea
            id="thread-body"
            className="input-glass"
            placeholder="What would you like to discuss with the community? Remember to NOT include any patient PII."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical' }}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
          Publish Topic
        </button>
      </form>
    </div>
  );
};

interface CreateReplyFormProps {
  threadId: string;
  onSuccess: () => void;
}

export const CreateReplyForm: React.FC<CreateReplyFormProps> = ({ threadId, onSuccess }) => {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.createReply(threadId, body);
      if (res.success) {
        setBody('');
        onSuccess();
      } else {
        setError(res.error || 'Failed to submit comment.');
      }
    } catch (err) {
      setError('An error occurred while posting your comment.');
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          className="input-glass"
          placeholder="Share your clinical insight or reply to this thread... (Strictly no patient PII)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: '80px', resize: 'vertical' }}
          required
        />
        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
          Post Comment
        </button>
      </form>
    </div>
  );
};

interface ReportModalProps {
  contentType: 'THREAD' | 'REPLY';
  contentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ contentType, contentId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please select a reason for reporting.');
      return;
    }

    try {
      const res = await api.reportContent(contentType, contentId, reason);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Failed to submit report.');
      }
    } catch (err) {
      setError('An error occurred while submitting the report.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card-glass" style={{ width: '100%', maxWidth: '500px' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Report Patient PII Disclosure</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          This will immediately hide the flagged content from all feeds and alert the platform administrators for moderation review.
        </p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="reason" style={{ fontSize: '14px', fontWeight: 500 }}>Reason for Flag</label>
            <select
              id="reason"
              className="input-glass"
              style={{ background: 'var(--bg-primary)' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">-- Select reason --</option>
              <option value="Contains patient full name">Contains patient full name</option>
              <option value="Unmasked patient date of birth / medical record number">Unmasked patient DOB/MRN</option>
              <option value="Clinical photography showing patient identifiers">Identifiable patient photography</option>
              <option value="Other HIPAA / GDPR privacy violation">Other privacy violation</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', boxShadow: 'none' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'var(--danger)', boxShadow: 'none' }}>
              Confirm & Hide Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
