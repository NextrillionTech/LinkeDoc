import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Author {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Post {
  id: string;
  content: string;
  isResearch: boolean;
  researchTitle?: string | null;
  researchAbstract?: string | null;
  researchLink?: string | null;
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  comments: Comment[];
}

export const Feed: React.FC = () => {
  const currentUser = api.getCurrentUser();
  const isApproved = currentUser?.status === 'APPROVED';
  const canPostResearch = currentUser?.role === 'DOCTOR' || currentUser?.role === 'RESEARCHER';

  // Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Post State
  const [content, setContent] = useState('');
  const [isResearch, setIsResearch] = useState(false);
  const [researchTitle, setResearchTitle] = useState('');
  const [researchAbstract, setResearchAbstract] = useState('');
  const [researchLink, setResearchLink] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  // UI Interactive States
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [postId: string]: boolean }>({});
  const [expandedAbstracts, setExpandedAbstracts] = useState<{ [postId: string]: boolean }>({});

  // Fetch Feed
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await api.getFeed();
      if (data && !data.error) {
        setPosts(data);
      } else {
        setError(data?.error || 'Failed to fetch medical feed');
      }
    } catch (err) {
      setError('An error occurred loading the feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFeed();
    }
  }, []);

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) return;
    if (!content.trim()) {
      setPostError('Post content cannot be empty.');
      return;
    }

    try {
      setPostSubmitting(true);
      setPostError('');
      setPostSuccess('');

      const payload = {
        content: content.trim(),
        isResearch,
        ...(isResearch ? {
          researchTitle: researchTitle.trim(),
          researchAbstract: researchAbstract.trim(),
          researchLink: researchLink.trim(),
        } : {}),
      };

      const res = await api.createPost(payload);
      if (res.success) {
        setPostSuccess('Post published successfully!');
        setContent('');
        setIsResearch(false);
        setResearchTitle('');
        setResearchAbstract('');
        setResearchLink('');
        // Reload Feed
        fetchFeed();
      } else {
        setPostError(res.error || 'Failed to publish post');
      }
    } catch (err) {
      setPostError('An error occurred publishing the post');
    } finally {
      setPostSubmitting(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (postId: string) => {
    if (!isApproved) return;
    try {
      const res = await api.toggleLike(postId);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: res.liked,
              likesCount: res.likeCount,
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  // Submit Comment
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!isApproved) return;
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    try {
      setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
      const res = await api.addComment(postId, commentText.trim());
      if (res.success && res.comment) {
        // Clear input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // Append comment locally
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [...p.comments, res.comment],
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Helper to get name initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please log in to view the medical feed.</h2>
      </div>
    );
  }

  return (
    <div className="feed-layout-container">
      {/* Local styles for LinkedIn Look & Feel */}
      <style>{`
        .feed-layout-container {
          max-width: 1200px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 240px 1fr 280px;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .feed-layout-container {
            grid-template-columns: 220px 1fr;
          }
          .right-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .feed-layout-container {
            grid-template-columns: 1fr;
          }
          .left-sidebar {
            display: none;
          }
        }

        /* Profile Card Left */
        .profile-summary-card {
          padding: 0;
          overflow: hidden;
          position: sticky;
          top: 85px;
        }

        .profile-card-banner {
          height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
        }

        .profile-card-avatar-wrapper {
          display: flex;
          justify-content: center;
          margin-top: -30px;
          margin-bottom: 12px;
        }

        .avatar-circle {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          border: 3px solid var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          color: var(--primary);
        }

        .profile-card-info {
          text-align: center;
          padding: 0 16px 16px 16px;
          border-bottom: 1px solid var(--border);
        }

        .profile-card-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          text-decoration: none;
        }
        
        .profile-card-name:hover {
          color: var(--primary);
        }

        .profile-card-headline {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .profile-card-stats {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          text-decoration: none;
        }

        .profile-card-stats:hover {
          background-color: var(--bg-tertiary);
        }

        /* Post Composer Box */
        .post-composer-card {
          margin-bottom: 16px;
          padding: 16px;
        }

        .composer-trigger-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .composer-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .composer-textarea {
          flex: 1;
          resize: none;
          min-height: 48px;
          border-radius: var(--radius-lg);
          padding: 12px 16px;
          border: 1px solid var(--border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          transition: border-color var(--transition-fast);
        }

        .composer-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }

        .composer-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }

        .btn-attachment-toggle {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .btn-attachment-toggle:hover {
          background-color: var(--primary-glow);
        }

        .research-paper-fields {
          background: var(--bg-tertiary);
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .research-input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 13px;
        }

        .research-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        /* Post Card Item */
        .post-card {
          margin-bottom: 16px;
          padding: 16px;
        }

        .post-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .post-author-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 15px;
        }

        .post-author-meta {
          display: flex;
          flex-direction: column;
        }

        .post-author-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .post-author-title {
          font-size: 12px;
          color: var(--text-muted);
        }

        .post-time {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .post-body-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.5;
          margin-bottom: 16px;
          white-space: pre-wrap;
        }

        /* Research Paper Card Attachment */
        .research-attachment-box {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          padding: 16px;
          margin-bottom: 16px;
        }

        .research-tag {
          display: inline-block;
          background: var(--accent-glow);
          color: var(--accent);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .research-card-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .research-card-abstract {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .btn-doi-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          padding: 6px 12px;
          border: 1px solid var(--primary);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .btn-doi-link:hover {
          background-color: var(--primary-glow);
        }

        /* Social Counters & Actions */
        .social-counters {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }

        .post-actions-bar {
          display: flex;
          gap: 8px;
        }

        .btn-post-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-post-action:hover {
          background-color: var(--bg-tertiary);
        }

        .btn-post-action.active-liked {
          color: var(--primary);
        }

        /* Comment Section Styles */
        .comments-section {
          border-top: 1px solid var(--border);
          margin-top: 12px;
          padding-top: 12px;
        }

        .comment-composer {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .comment-composer-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 13px;
        }

        .comment-composer-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .comment-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comment-item {
          display: flex;
          gap: 10px;
        }

        .comment-bubble {
          flex: 1;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }

        .comment-author-meta {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }

        .comment-author-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .comment-author-headline {
          font-size: 11px;
          color: var(--text-muted);
        }

        .comment-time {
          font-size: 9px;
          color: var(--text-muted);
        }

        .comment-text {
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        /* Right Sidebar Trending card */
        .right-sidebar-sticky {
          position: sticky;
          top: 85px;
        }

        .trending-item {
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          display: block;
        }

        .trending-item:last-child {
          border-bottom: none;
        }

        .trending-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .trending-title:hover {
          color: var(--primary);
        }

        .trending-meta {
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>

      {/* Left Sidebar Profile Summary Card */}
      <div className="left-sidebar">
        <div className="card-glass profile-summary-card">
          <div className="profile-card-banner"></div>
          <div className="profile-card-avatar-wrapper">
            <div className="avatar-circle">
              {getInitials(currentUser.name)}
            </div>
          </div>
          <div className="profile-card-info">
            <Link to="/profile" className="profile-card-name">
              {currentUser.role === 'ADMIN' ? currentUser.name : currentUser.role === 'RECRUITER' ? currentUser.name : `Dr. ${currentUser.name}`}
            </Link>
            <div className="profile-card-headline">
              {currentUser.role} {currentUser.specialty ? `• ${currentUser.specialty}` : ''}
            </div>
          </div>
          <Link to="/network" className="profile-card-stats">
            <span>Connections</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>12</span>
          </Link>
        </div>
      </div>

      {/* Center Main Feed Column */}
      <div className="main-feed-column">
        {/* Verification Warning Alert for Pending Users */}
        {!isApproved && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '16px',
            color: 'var(--warning)',
            fontSize: '14px',
            fontWeight: 500
          }}>
            ⚠️ Your account is pending verification by an administrator. You will be able to share updates, upload papers, and comment once approved.
          </div>
        )}

        {/* Start a Post Composer */}
        <div className="card-glass post-composer-card">
          <form onSubmit={handleCreatePost}>
            <div className="composer-trigger-row">
              <div className="composer-avatar">
                {getInitials(currentUser.name)}
              </div>
              <textarea
                className="composer-textarea"
                placeholder="What medical update or clinical finding would you like to share?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isApproved}
                required
              />
            </div>

            {/* Research Paper fields (conditionally rendered) */}
            {isResearch && canPostResearch && (
              <div className="research-paper-fields">
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)' }}>Attach Research Paper</h4>
                <input
                  type="text"
                  placeholder="Paper Title *"
                  className="research-input"
                  value={researchTitle}
                  onChange={(e) => setResearchTitle(e.target.value)}
                  required={isResearch}
                />
                <textarea
                  placeholder="Abstract / Summary Outline *"
                  className="research-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={researchAbstract}
                  onChange={(e) => setResearchAbstract(e.target.value)}
                  required={isResearch}
                />
                <input
                  type="url"
                  placeholder="PDF Link, PubMed URL or DOI Link (e.g. https://doi.org/10.1000/xyz123)"
                  className="research-input"
                  value={researchLink}
                  onChange={(e) => setResearchLink(e.target.value)}
                />
              </div>
            )}

            {/* Feedback Notifications */}
            {postError && <div style={{ color: 'var(--danger)', fontSize: '13px', margin: '8px 0' }}>{postError}</div>}
            {postSuccess && <div style={{ color: 'var(--success)', fontSize: '13px', margin: '8px 0' }}>{postSuccess}</div>}

            {/* Composer Footer Actions */}
            <div className="composer-actions-row">
              {canPostResearch ? (
                <button
                  type="button"
                  className="btn-attachment-toggle"
                  onClick={() => setIsResearch(!isResearch)}
                  disabled={!isApproved}
                  style={{ color: isResearch ? 'var(--accent)' : 'var(--primary)' }}
                >
                  📝 {isResearch ? 'Remove Paper' : 'Attach Research Paper'}
                </button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Clinical discussion only
                </span>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
                disabled={!isApproved || postSubmitting}
              >
                {postSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts Timeline */}
        {loading && posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading medical updates...</div>
        ) : error ? (
          <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '40px' }}>{error}</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>No posts in the network yet.</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Be the first to share clinical research or professional updates!</p>
          </div>
        ) : (
          posts.map(post => {
            const isCommentsOpen = !!expandedComments[post.id];
            const isAbstractExpanded = !!expandedAbstracts[post.id];
            const authorInitials = getInitials(post.author.name);
            const authorDisplayName = post.author.role === 'ADMIN' ? post.author.name : post.author.role === 'RECRUITER' ? post.author.name : `Dr. ${post.author.name}`;
            const timeFormatted = new Date(post.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={post.id} className="card-glass post-card">
                {/* Author row */}
                <div className="post-header">
                  <div className="post-author-avatar">
                    {authorInitials}
                  </div>
                  <div className="post-author-meta">
                    <span className="post-author-name">{authorDisplayName}</span>
                    <span className="post-author-title">
                      {post.author.role} {post.author.specialty ? `• ${post.author.specialty}` : ''}
                    </span>
                    <span className="post-time">{timeFormatted}</span>
                  </div>
                </div>

                {/* Post Body text */}
                <div className="post-body-text">
                  {post.content}
                </div>

                {/* Research paper card attachment */}
                {post.isResearch && post.researchTitle && (
                  <div className="research-attachment-box">
                    <span className="research-tag">🔬 Research Publication</span>
                    <h4 className="research-card-title">{post.researchTitle}</h4>
                    {post.researchAbstract && (
                      <div className="research-card-abstract">
                        <strong>Abstract:</strong>{' '}
                        {isAbstractExpanded || post.researchAbstract.length < 180 ? (
                          post.researchAbstract
                        ) : (
                          <>
                            {post.researchAbstract.slice(0, 180)}...{' '}
                            <button
                              onClick={() => setExpandedAbstracts(prev => ({ ...prev, [post.id]: true }))}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: '12px' }}
                            >
                              Show more
                            </button>
                          </>
                        )}
                        {isAbstractExpanded && (
                          <button
                            onClick={() => setExpandedAbstracts(prev => ({ ...prev, [post.id]: false }))}
                            style={{ display: 'block', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: '12px', marginTop: '6px' }}
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    )}
                    {post.researchLink && (
                      <a
                        href={post.researchLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-doi-link"
                      >
                        🔗 View Full Text / DOI
                      </a>
                    )}
                  </div>
                )}

                {/* Social Counters */}
                <div className="social-counters">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>

                {/* Action buttons */}
                <div className="post-actions-bar">
                  <button
                    className={`btn-post-action ${post.hasLiked ? 'active-liked' : ''}`}
                    onClick={() => handleToggleLike(post.id)}
                    disabled={!isApproved}
                  >
                    👍 Like
                  </button>
                  <button
                    className="btn-post-action"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  >
                    💬 Comment
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="comments-section">
                    {/* Add comment composer */}
                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="comment-composer">
                      <input
                        type="text"
                        className="comment-composer-input"
                        placeholder={isApproved ? "Add a professional reply..." : "Verification pending..."}
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        disabled={!isApproved || commentSubmitting[post.id]}
                        required
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: '12px', borderRadius: 'var(--radius-full)', boxShadow: 'none' }}
                        disabled={!isApproved || commentSubmitting[post.id]}
                      >
                        Post
                      </button>
                    </form>

                    {/* Comments list */}
                    <div className="comment-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map(c => {
                          const commentAuthorName = c.author.role === 'ADMIN' ? c.author.name : c.author.role === 'RECRUITER' ? c.author.name : `Dr. ${c.author.name}`;
                          const commentTimeFormatted = new Date(c.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div key={c.id} className="comment-item">
                              <div className="composer-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                {getInitials(c.author.name)}
                              </div>
                              <div className="comment-bubble">
                                <div className="comment-author-meta">
                                  <div>
                                    <span className="comment-author-name">{commentAuthorName}</span>
                                    <span className="comment-author-headline" style={{ marginLeft: '6px' }}>
                                      ({c.author.role} {c.author.specialty ? `• ${c.author.specialty}` : ''})
                                    </span>
                                  </div>
                                  <span className="comment-time">{commentTimeFormatted}</span>
                                </div>
                                <div className="comment-text">{c.content}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                          No comments yet. Be the first to start the discussion!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Right Sidebar Trending and Community Column */}
      <div className="right-sidebar">
        <div className="card-glass right-sidebar-sticky" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Trending Discussions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/forums" className="trending-item">
              <div className="trending-title">Cardiology Research Updates</div>
              <div className="trending-meta">48 active discussions today</div>
            </Link>
            <Link to="/forums" className="trending-item">
              <div className="trending-title">AI diagnostic accuracy in radiology</div>
              <div className="trending-meta">32 comments • Oncology</div>
            </Link>
            <Link to="/jobs" className="trending-item">
              <div className="trending-title">New ICU Resident openings</div>
              <div className="trending-meta">24 recruiters active</div>
            </Link>
            <Link to="/forums" className="trending-item">
              <div className="trending-title">Pediatric dosing safety parameters</div>
              <div className="trending-meta">15 replies • Pediatrics</div>
            </Link>
          </div>
          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            LinkeDoc for Medical Professionals © 2026
          </div>
        </div>
      </div>
    </div>
  );
};
