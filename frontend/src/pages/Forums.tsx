import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CreateThreadForm, CreateReplyForm, ReportModal } from '../components/ForumPostForm';
import { ArrowLeft } from 'lucide-react';

export const Forums: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  
  // Modal state
  const [reportState, setReportState] = useState<{ isOpen: boolean; contentType: 'THREAD' | 'REPLY'; contentId: string } | null>(null);

  const isApproved = currentUser?.status === 'APPROVED';

  // Load categories on mount
  useEffect(() => {
    api.getCategories().then((data) => {
      if (Array.isArray(data)) {
        setCategories(data);
      }
    });
  }, []);

  // Load threads when category changes
  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category);
    setSelectedThread(null);
    api.getThreads(category.id).then((data) => {
      if (Array.isArray(data)) {
        setThreads(data);
      }
    });
  };

  // Load thread details and replies
  const handleSelectThread = (threadId: string) => {
    api.getThread(threadId).then((data) => {
      if (data && !data.error) {
        setSelectedThread(data);
      }
    });
  };

  // Refresh thread comments after a successful reply
  const refreshThreadReplies = () => {
    if (selectedThread) {
      handleSelectThread(selectedThread.id);
    }
  };

  // Refresh threads list after starting a new thread
  const refreshCategoryThreads = () => {
    if (selectedCategory) {
      handleSelectCategory(selectedCategory);
    }
  };

  const handleReportSuccess = () => {
    setReportState(null);
    if (selectedThread && reportState?.contentType === 'THREAD') {
      // If thread was hidden, go back to category
      setSelectedThread(null);
      refreshCategoryThreads();
    } else {
      // If reply comment was hidden, refresh thread replies
      refreshThreadReplies();
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Clinical Discussion Boards</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Collaborate, share insights, and discuss cases with other verified medical professionals.
        </p>
        {!isApproved && (
          <div style={{ color: 'var(--warning)', padding: '12px 16px', background: 'rgba(202, 138, 4, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(202, 138, 4, 0.2)', fontSize: '14px', marginTop: '16px' }}>
            <strong>Verification Required</strong>: Your account is currently pending administrator review. You have read-only access to the forums and cannot create threads, post replies, or flag posts.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        
        {/* Sidebar: Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Specialty Boards</h3>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="card-glass"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                cursor: 'pointer',
                background: selectedCategory?.id === cat.id ? 'var(--primary-glow)' : 'var(--glass-bg)',
                borderColor: selectedCategory?.id === cat.id ? 'var(--primary)' : 'var(--glass-border)',
                transform: 'none',
                boxShadow: 'none'
              }}
              onClick={() => handleSelectCategory(cat)}
            >
              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>{cat.name}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{cat.description}</p>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div>
          {!selectedCategory ? (
            <div className="card-glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.5, marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <h3>Select a boards topic to view discussions</h3>
              <p>Choose a medical specialty board from the sidebar to browse clinical topics.</p>
            </div>
          ) : !selectedThread ? (
            /* Threads List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '24px' }}>Category: {selectedCategory.name}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {threads.length === 0 ? (
                  <div className="card-glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No discussions started in this category yet.
                  </div>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="card-glass"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectThread(thread.id)}
                    >
                      <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>{thread.title}</h4>
                      <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                        {thread.body.length > 200 ? `${thread.body.slice(0, 200)}...` : thread.body}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Posted by Dr. {thread.author?.name} ({thread.author?.specialty || 'Generalist'})</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Thread Creator Form (Only show to approved users) */}
              {isApproved && (
                <CreateThreadForm
                  categoryId={selectedCategory.id}
                  onSuccess={refreshCategoryThreads}
                />
              )}
            </div>
          ) : (
            /* Thread Detail & Comments View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Back to threads list */}
              <button
                className="btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'none',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setSelectedThread(null)}
              >
                <ArrowLeft size={16} /> Back to Category Threads
              </button>

              {/* Thread Core Content */}
              <div className="card-glass" style={{ position: 'relative' }}>
                {isApproved && (
                  <button
                    className="btn-primary"
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: 'transparent',
                      color: 'var(--danger)',
                      boxShadow: 'none',
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid var(--danger)',
                    }}
                    onClick={() => setReportState({ isOpen: true, contentType: 'THREAD', contentId: selectedThread.id })}
                  >
                    Flag PII
                  </button>
                )}

                <h3 style={{ fontSize: '24px', marginBottom: '12px', paddingRight: '80px' }}>{selectedThread.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Posted by Dr. {selectedThread.author?.name} ({selectedThread.author?.specialty || 'Generalist'}) | {new Date(selectedThread.createdAt).toLocaleString()}
                </p>
                <div style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedThread.body}
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Clinical Insights ({selectedThread.replies?.length || 0})
                </h4>
                
                {selectedThread.replies?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No replies posted yet.</p>
                ) : (
                  selectedThread.replies.map((reply: any) => (
                    <div
                      key={reply.id}
                      className="card-glass"
                      style={{ padding: '20px', background: 'var(--bg-tertiary)', position: 'relative' }}
                    >
                      {isApproved && (
                        <button
                          className="btn-primary"
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'transparent',
                            color: 'var(--danger)',
                            boxShadow: 'none',
                            padding: '2px 6px',
                            fontSize: '11px',
                            border: '1px solid var(--danger)',
                          }}
                          onClick={() => setReportState({ isOpen: true, contentType: 'REPLY', contentId: reply.id })}
                        >
                          Flag PII
                        </button>
                      )}
                      
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Dr. {reply.author?.name} ({reply.author?.specialty || 'Generalist'}) | {new Date(reply.createdAt).toLocaleString()}
                      </p>
                      <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', paddingRight: '80px' }}>
                        {reply.body}
                      </p>
                    </div>
                  ))
                )}

                {/* Reply Form */}
                {isApproved ? (
                  <CreateReplyForm
                    threadId={selectedThread.id}
                    onSuccess={refreshThreadReplies}
                  />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', marginTop: '10px' }}>
                    Only verified accounts can add comments.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Flag PII Reporting Modal */}
      {reportState?.isOpen && (
        <ReportModal
          contentType={reportState.contentType}
          contentId={reportState.contentId}
          onClose={() => setReportState(null)}
          onSuccess={handleReportSuccess}
        />
      )}

    </div>
  );
};
