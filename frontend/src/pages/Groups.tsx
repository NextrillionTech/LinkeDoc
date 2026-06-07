import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Lucide React Icons
import {
  Users,
  Plus,
  ThumbsUp,
  MessageSquare,
  X,
  Sparkles,
  FolderOpen,
  ArrowRight,
  LogOut,
  ChevronLeft
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  createdAt: string;
}

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
  mediaUrls?: string[];
  groupId?: string | null;
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  comments: Comment[];
}

export const Groups: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const currentUser = api.getCurrentUser();
  const isApproved = currentUser?.status === 'APPROVED';

  // Group listings
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  // Group Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [content, setContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Create Group Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createError, setCreateError] = useState('');

  // Timeline comments state
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [postId: string]: boolean }>({});

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await api.getGroups();
      if (Array.isArray(res)) {
        setGroups(res);
        // Sync active group if already selected
        if (id) {
          const active = res.find(g => g.id === id);
          if (active) setActiveGroup(active);
        }
      }
    } catch (e) {
      console.error('Failed to load groups:', e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupFeed = async (groupId: string) => {
    try {
      setLoadingFeed(true);
      const res = await api.getGroupFeed(groupId);
      if (Array.isArray(res)) {
        setPosts(res);
      } else {
        setPosts([]);
      }
    } catch (e) {
      console.error('Failed to fetch group feed:', e);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [id]);

  useEffect(() => {
    if (activeGroup) {
      if (activeGroup.isMember) {
        fetchGroupFeed(activeGroup.id);
      } else {
        setPosts([]);
      }
    }
  }, [activeGroup]);

  // Create Group submission
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    try {
      setCreateError('');
      const res = await api.createGroup(newGroupName.trim(), newGroupDesc.trim());
      if (res.success && res.group) {
        setCreateModalOpen(false);
        setNewGroupName('');
        setNewGroupDesc('');
        // Reload list and navigate to new group
        await fetchGroups();
        navigate(`/groups/${res.group.id}`);
      } else {
        setCreateError(res.error || 'Failed to create group');
      }
    } catch (err) {
      setCreateError('Network error. Failed to create group.');
    }
  };

  // Join group
  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await api.joinGroup(groupId);
      if (res.success) {
        fetchGroups();
        if (activeGroup && activeGroup.id === groupId) {
          setActiveGroup(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId: string) => {
    try {
      const res = await api.leaveGroup(groupId);
      if (res.success) {
        fetchGroups();
        if (activeGroup && activeGroup.id === groupId) {
          setActiveGroup(prev => prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Group Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !isApproved || !content.trim()) return;

    try {
      setPostSubmitting(true);
      const res = await api.createGroupPost(activeGroup.id, {
        content: content.trim()
      });
      if (res.success) {
        setContent('');
        fetchGroupFeed(activeGroup.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPostSubmitting(false);
    }
  };

  // Handle Like inside Group Feed
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
      console.error(err);
    }
  };

  // Add Comment inside Group Feed
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!isApproved) return;
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    try {
      setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
      const res = await api.addComment(postId, commentText.trim());
      if (res.success && res.comment) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
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
      console.error(err);
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const myGroups = groups.filter(g => g.isMember);
  const discoverGroups = groups.filter(g => !g.isMember);

  return (
    <div className="groups-layout-container">
      {/* Styles for Groups panels */}
      <style>{`
        .groups-layout-container {
          max-width: 1200px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          height: calc(100vh - 140px);
          min-height: 550px;
        }

        @media (max-width: 768px) {
          .groups-layout-container {
            grid-template-columns: 1fr;
            height: auto;
          }
          .groups-sidebar {
            display: ${activeGroup ? 'none' : 'block'};
          }
          .groups-main-panel {
            display: ${activeGroup ? 'block' : 'none'};
          }
        }

        /* Sidebar Panels */
        .groups-sidebar {
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .groups-sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-tertiary);
        }

        .groups-section {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .groups-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .group-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          cursor: pointer;
          border-bottom: 1px dashed rgba(255,255,255,0.03);
        }

        .group-list-item:last-child {
          border-bottom: none;
        }

        .group-item-meta {
          flex: 1;
          margin-right: 12px;
          overflow: hidden;
        }

        .group-item-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-item-desc {
          font-size: 11px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Main details pane */
        .groups-main-panel {
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .group-detail-banner {
          height: 100px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          padding: 16px 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .group-detail-header-card {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-tertiary);
        }

        .group-feed-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: rgba(15, 23, 42, 0.01);
        }

        /* Compose Box Group */
        .group-post-composer {
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 20px;
        }

        .group-composer-textarea {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 12px;
          font-size: 13px;
          font-family: var(--font-body);
          resize: none;
          min-height: 48px;
          margin-bottom: 12px;
        }

        .group-composer-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }
      `}</style>

      {/* Left Column: Sidebar with Group listing */}
      <div className="groups-sidebar">
        <div className="groups-sidebar-header">
          <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} />
            <span>Clinical Groups</span>
          </h3>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setCreateModalOpen(true)}
            disabled={!isApproved}
          >
            <Plus size={14} /> Create
          </button>
        </div>

        {/* Section 1: My Groups */}
        <div className="groups-section">
          <div className="groups-section-title">My Groups ({myGroups.length})</div>
          {loadingGroups ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : myGroups.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>You haven't joined any groups yet.</div>
          ) : (
            myGroups.map(g => (
              <div
                key={g.id}
                className="group-list-item"
                onClick={() => {
                  setActiveGroup(g);
                  navigate(`/groups/${g.id}`);
                }}
                style={{ opacity: activeGroup?.id === g.id ? 1 : 0.85, borderLeft: activeGroup?.id === g.id ? '2px solid var(--primary)' : 'none', paddingLeft: activeGroup?.id === g.id ? '6px' : 'none' }}
              >
                <div className="group-item-meta">
                  <div className="group-item-name">{g.name}</div>
                  <div className="group-item-desc">{g.description}</div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))
          )}
        </div>

        {/* Section 2: Discover Groups */}
        <div className="groups-section" style={{ borderBottom: 'none', flex: 1 }}>
          <div className="groups-section-title">Discover ({discoverGroups.length})</div>
          {loadingGroups ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : discoverGroups.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>No more groups to discover.</div>
          ) : (
            discoverGroups.map(g => (
              <div
                key={g.id}
                className="group-list-item"
                onClick={() => {
                  setActiveGroup(g);
                  navigate(`/groups/${g.id}`);
                }}
                style={{ opacity: activeGroup?.id === g.id ? 1 : 0.85 }}
              >
                <div className="group-item-meta">
                  <div className="group-item-name">{g.name}</div>
                  <div className="group-item-desc">{g.description}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinGroup(g.id);
                  }}
                  style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Main detail panel */}
      <div className="groups-main-panel">
        {activeGroup ? (
          <>
            {/* Group Banner */}
            <div className="group-detail-banner">
              {/* Back to list button on mobile */}
              <button
                className="btn-tool"
                style={{ display: 'none', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff' }}
                onClick={() => {
                  setActiveGroup(null);
                  navigate('/groups');
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            </div>

            {/* Group Header details */}
            <div className="group-detail-header-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700 }}>{activeGroup.name}</h2>
                  <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{activeGroup.description}</p>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span>👥 {activeGroup.memberCount} members</span>
                    <span>📝 {activeGroup.postCount} posts</span>
                    <span>Created by: <strong>{activeGroup.creatorName}</strong></span>
                  </div>
                </div>

                <div>
                  {activeGroup.isMember ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--border)' }}
                      onClick={() => handleLeaveGroup(activeGroup.id)}
                      disabled={activeGroup.creatorId === currentUser.id}
                      title={activeGroup.creatorId === currentUser.id ? "Creators cannot leave their own group" : ""}
                    >
                      <LogOut size={14} /> Leave Group
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '4px' }}
                      onClick={() => handleJoinGroup(activeGroup.id)}
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Group Feed Area */}
            <div className="group-feed-container">
              {activeGroup.isMember ? (
                <>
                  {/* Group Post Composer */}
                  <div className="group-post-composer">
                    <form onSubmit={handleCreatePost}>
                      <textarea
                        className="group-composer-textarea"
                        placeholder={`Share an update or pose a question to members of ${activeGroup.name}...`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={!isApproved}
                        required
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ padding: '6px 18px', fontSize: '12px', borderRadius: '4px' }}
                          disabled={!isApproved || postSubmitting}
                        >
                          {postSubmitting ? 'Posting...' : 'Share'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Group Feed list */}
                  {loadingFeed ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading group discussions...</div>
                  ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>Welcome to the group feed!</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Be the first to share a case or pose a clinical inquiry.</p>
                    </div>
                  ) : (
                    posts.map(post => {
                      const authorInitials = getInitials(post.author.name);
                      const authorDisplayName = post.author.role === 'ADMIN' ? post.author.name : post.author.role === 'RECRUITER' ? post.author.name : `Dr. ${post.author.name}`;
                      const postTimeStr = new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const isCommentsOpen = !!expandedComments[post.id];

                      return (
                        <div key={post.id} className="card-glass post-card" style={{ padding: '16px', marginBottom: '16px' }}>
                          {/* Post Header */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                            <div className="post-author-avatar" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                              {authorInitials}
                            </div>
                            <div className="post-author-meta">
                              <span className="post-author-name">{authorDisplayName}</span>
                              <span className="post-author-title">
                                {post.author.role} {post.author.specialty ? `• ${post.author.specialty}` : ''}
                              </span>
                              <span className="post-time">{postTimeStr}</span>
                            </div>
                          </div>

                          {/* Post Body */}
                          <div className="post-body-text" style={{ fontSize: '13.5px', marginBottom: '12px' }}>
                            {post.content}
                          </div>

                          {/* Social Actions */}
                          <div className="social-counters">
                            <span>{post.likesCount} likes</span>
                            <span>{post.commentsCount} comments</span>
                          </div>

                          <div className="post-actions-bar">
                            <button
                              className={`btn-post-action ${post.hasLiked ? 'active-liked' : ''}`}
                              onClick={() => handleToggleLike(post.id)}
                              disabled={!isApproved}
                            >
                              <ThumbsUp size={14} />
                              <span>Like</span>
                            </button>
                            <button
                              className="btn-post-action"
                              onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            >
                              <MessageSquare size={14} />
                              <span>Comment</span>
                            </button>
                          </div>

                          {/* Comments section */}
                          {isCommentsOpen && (
                            <div className="comments-section">
                              <form onSubmit={(e) => handleAddComment(e, post.id)} className="comment-composer">
                                <input
                                  type="text"
                                  className="comment-composer-input"
                                  placeholder={isApproved ? "Write a comment..." : "Verification pending..."}
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  disabled={!isApproved || commentSubmitting[post.id]}
                                  required
                                />
                                <button
                                  type="submit"
                                  className="btn-primary"
                                  style={{ padding: '6px 14px', fontSize: '11px', borderRadius: 'var(--radius-full)' }}
                                  disabled={!isApproved || commentSubmitting[post.id]}
                                >
                                  Comment
                                </button>
                              </form>

                              <div className="comment-list">
                                {post.comments && post.comments.length > 0 ? (
                                  post.comments.map(c => {
                                    const commentAuthorName = c.author.role === 'ADMIN' ? c.author.name : c.author.role === 'RECRUITER' ? c.author.name : `Dr. ${c.author.name}`;
                                    const commentTimeStr = new Date(c.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });

                                    return (
                                      <div key={c.id} className="comment-item">
                                        <div className="composer-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                          {getInitials(c.author.name)}
                                        </div>
                                        <div className="comment-bubble">
                                          <div className="comment-author-meta">
                                            <div>
                                              <span className="comment-author-name" style={{ fontSize: '12px' }}>{commentAuthorName}</span>
                                              <span className="comment-author-headline" style={{ fontSize: '10px' }}>
                                                ({c.author.role})
                                              </span>
                                            </div>
                                            <span className="comment-time">{commentTimeStr}</span>
                                          </div>
                                          <div className="comment-text" style={{ fontSize: '12px' }}>{c.content}</div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>No comments yet.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <Users size={48} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>You are not a member</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '360px' }}>
                    Join this group to browse the feed, see active discussions, and post professional cases with peers.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 24px', borderRadius: '4px' }}
                    onClick={() => handleJoinGroup(activeGroup.id)}
                  >
                    Join {activeGroup.name}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Placeholder screen when no group is selected */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto', padding: '40px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '56px',
                marginBottom: '16px',
                color: 'var(--primary)',
                filter: 'drop-shadow(0 0 15px var(--primary-glow))',
              }}
            >
              <Sparkles size={64} />
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', fontWeight: 700 }}>Welcome to Clinical Groups</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '360px' }}>
              Select a group from the sidebar to view active discussions, or click Create to start a new peer interest space.
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal Overlay */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px' }}>Create Clinical Group</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {createError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px' }}>
                    {createError}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="groupName" style={{ fontSize: '13px', fontWeight: 600 }}>Group Name *</label>
                  <input
                    id="groupName"
                    type="text"
                    placeholder="e.g., Cardiology Peer Focus"
                    className="research-input"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="groupDesc" style={{ fontSize: '13px', fontWeight: 600 }}>Description *</label>
                  <textarea
                    id="groupDesc"
                    placeholder="e.g., Collaborative review of cardiology case findings, papers, and diagnostics."
                    className="research-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ background: 'none', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 16px', borderRadius: '4px' }}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
