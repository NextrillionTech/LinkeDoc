import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

// Lucide React Icons
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  Link2,
  FileText,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  PenTool,
  Square,
  RefreshCw,
  Info,
  Film,
  EyeOff,
  ArrowUpRight,
  Type,
  BarChart2
} from 'lucide-react';

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
  poll?: any;
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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const [hipaaConsentConfirmed, setHipaaConsentConfirmed] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // PubMed search state
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [pubmedSearching, setPubmedSearching] = useState(false);
  const [pubmedAlert, setPubmedAlert] = useState('');

  // Media attachment picker modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [inputMediaUrl, setInputMediaUrl] = useState('');

  // Poll Creator State
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']); // default two options
  const [pollDurationHours, setPollDurationHours] = useState(24);
  const [composerModalOpen, setComposerModalOpen] = useState(false);
  const [trendingCategories, setTrendingCategories] = useState<any[]>([]);



  // Preset Clinical Media files for quick selection & annotation
  const presetMedia = [
    {
      name: 'Chest X-Ray',
      url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      type: 'image'
    },
    {
      name: 'Brain MRI Scan',
      url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      type: 'image'
    },
    {
      name: 'ECG Patient Graph',
      url: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&w=800&q=80',
      type: 'image'
    },
    {
      name: 'Ultrasound Scan (Video)',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'video'
    }
  ];

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

  const fetchJoinedGroups = async () => {
    try {
      const res = await api.getGroups();
      if (Array.isArray(res)) {
        setJoinedGroups(res.filter((g: any) => g.isMember));
      }
    } catch (e) {
      console.error('Failed to fetch user groups for composer', e);
    }
  };

  const fetchTrendingCategories = async () => {
    try {
      const res = await api.getCategories();
      if (Array.isArray(res)) {
        setTrendingCategories(res.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch categories for trending', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFeed();
      fetchJoinedGroups();
      fetchTrendingCategories();
    }
  }, []);

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) return;
    if (!content.trim() && mediaUrls.length === 0 && (!showPollComposer || !pollQuestion.trim())) {
      setPostError('Post content, media attachments, or a poll question are required.');
      return;
    }

    if (mediaUrls.length > 0 && !hipaaConsentConfirmed) {
      setPostError('You must confirm HIPAA compliance for clinical image/video attachments.');
      return;
    }

    try {
      setPostSubmitting(true);
      setPostError('');
      setPostSuccess('');

      const payload: any = {
        content: content.trim(),
        isResearch,
        mediaUrls,
        ...(isResearch ? {
          researchTitle: researchTitle.trim(),
          researchAbstract: researchAbstract.trim(),
          researchLink: researchLink.trim(),
        } : {}),
      };

      if (selectedGroupId) {
        payload.groupId = selectedGroupId;
      }

      if (showPollComposer && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
        payload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(o => o.trim()),
          durationHours: Number(pollDurationHours)
        };
      }

      const res = await api.createPost(payload);
      if (res.success) {
        setPostSuccess('Post published successfully!');
        setContent('');
        setIsResearch(false);
        setResearchTitle('');
        setResearchAbstract('');
        setResearchLink('');
        setMediaUrls([]);
        setHipaaConsentConfirmed(false);
        setSelectedGroupId('');
        setShowPollComposer(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollDurationHours(24);
        setComposerModalOpen(false);
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

  const handleVote = async (pollId: string, optionId: string) => {
    if (!isApproved) return;
    if (votingInProgress[pollId]) return;
    try {
      setVotingInProgress(prev => ({ ...prev, [pollId]: true }));
      const res = await api.votePoll(pollId, optionId);
      if (res.success) {
        setVotedPollOptions(prev => ({ ...prev, [pollId]: optionId }));
        fetchFeed();
      } else {
        alert(res.error || 'Failed to register vote');
      }
    } catch (err) {
      console.error('Failed to vote', err);
    } finally {
      setVotingInProgress(prev => ({ ...prev, [pollId]: false }));
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
      console.error('Failed to add comment', err);
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // PubMed / DOI search trigger
  const handlePubMedLookup = async () => {
    if (!pubmedQuery.trim()) return;
    try {
      setPubmedSearching(true);
      setPubmedAlert('');
      const data = await api.searchPubMed(pubmedQuery.trim());
      if (data.success) {
        setResearchTitle(data.title || '');
        setResearchAbstract(data.abstract || '');
        setResearchLink(data.link || '');
        setPubmedAlert('Successfully fetched paper details from PubMed!');
      } else {
        setPubmedAlert('No articles found matching that query. Pre-filled standard details.');
      }
    } catch (e) {
      setPubmedAlert('Could not connect to database registry. Entered demo records.');
    } finally {
      setPubmedSearching(false);
    }
  };

  // Clinical Canvas Annotation tool state
  const [canvasModalOpen, setCanvasModalOpen] = useState(false);
  const [activeCanvasImage, setActiveCanvasImage] = useState('');
  const [drawingColor, setDrawingColor] = useState('#EF4444'); // default Red
  const [drawingTool, setDrawingTool] = useState<'pen' | 'redact' | 'blur' | 'arrow' | 'text'>('pen');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [arrowStartX, setArrowStartX] = useState(0);
  const [arrowStartY, setArrowStartY] = useState(0);
  const [zoomFactor, setZoomFactor] = useState(1);

  // Initialize Canvas
  useEffect(() => {
    if (canvasModalOpen && canvasRef.current && activeCanvasImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeCanvasImage;
      img.onload = () => {
        // Clear canvas
        canvas.width = 600;
        canvas.height = 400;
        
        // Draw image keeping ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * zoomFactor;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
    }
  }, [canvasModalOpen, activeCanvasImage, zoomFactor]);

  // Carousel slider active index trackers mapped by post ID
  const [carousels, setCarousels] = useState<{ [postId: string]: number }>({});

  // UI Interactive States
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [postId: string]: boolean }>({});
  const [expandedAbstracts, setExpandedAbstracts] = useState<{ [postId: string]: boolean }>({});
  const [votedPollOptions, setVotedPollOptions] = useState<{ [pollId: string]: string }>({});
  const [votingInProgress, setVotingInProgress] = useState<{ [pollId: string]: boolean }>({});

  // Canvas pixelate anonymizer helper
  const applyPixelate = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const size = 30;
    const pixelSize = 6;
    const startX = Math.max(0, x - size / 2);
    const startY = Math.max(0, y - size / 2);
    
    try {
      const imgData = ctx.getImageData(startX, startY, size, size);
      const data = imgData.data;
      
      for (let py = 0; py < size; py += pixelSize) {
        for (let px = 0; px < size; px += pixelSize) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = 0; dy < pixelSize && (py + dy) < size; dy++) {
            for (let dx = 0; dx < pixelSize && (px + dx) < size; dx++) {
              const idx = ((py + dy) * size + (px + dx)) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          
          for (let dy = 0; dy < pixelSize && (py + dy) < size; dy++) {
            for (let dx = 0; dx < pixelSize && (px + dx) < size; dx++) {
              const idx = ((py + dy) * size + (px + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(imgData, startX, startY);
    } catch (e) {
      console.error('Failed to pixelate canvas region:', e);
    }
  };

  // Canvas Drawing controls
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    if (drawingTool === 'arrow') {
      setArrowStartX(x);
      setArrowStartY(y);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawingTool === 'redact') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 25, y - 15, 50, 30);
    } else if (drawingTool === 'blur') {
      applyPixelate(ctx, x, y);
    } else if (drawingTool === 'text') {
      setIsDrawing(false);
      const text = prompt('Enter text annotation:');
      if (text) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = drawingColor;
        ctx.fillText(text, x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool === 'pen') {
      ctx.beginPath();
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      setLastX(x);
      setLastY(y);
    } else if (drawingTool === 'blur') {
      applyPixelate(ctx, x, y);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool === 'arrow') {
      const headLength = 12;
      const dx = x - arrowStartX;
      const dy = y - arrowStartY;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowStartY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLength * Math.cos(angle - Math.PI / 6), y - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x - headLength * Math.cos(angle + Math.PI / 6), y - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = drawingColor;
      ctx.fill();
    }
  };

  const handleSaveCanvasAnnotation = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const annotatedDataUri = canvas.toDataURL('image/jpeg', 0.85);
      setMediaUrls(prev => [...prev, annotatedDataUri]);
      setCanvasModalOpen(false);
      setMediaModalOpen(false);
    }
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  // Helper to get name initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Carousel navigation
  const navigateCarousel = (postId: string, direction: number, max: number) => {
    setCarousels(prev => {
      const current = prev[postId] || 0;
      let next = current + direction;
      if (next < 0) next = max - 1;
      if (next >= max) next = 0;
      return { ...prev, [postId]: next };
    });
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
      {/* Styles inline for advanced LinkedIn components */}
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

        /* Profile Left sidebar card */
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

        /* Start a Post Composer */
        .post-composer-card {
          margin-bottom: 16px;
          padding: 16px;
        }

        .composer-trigger-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
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
          min-height: 54px;
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

        .composer-quick-actions {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          padding-left: 56px;
        }

        .btn-quick-media {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }

        .btn-quick-media:hover {
          background-color: var(--bg-tertiary);
          border-color: var(--primary);
          color: var(--primary);
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

        /* Media display widgets */
        .media-attachments-container {
          position: relative;
          margin-bottom: 16px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
          background: #000;
        }

        .carousel-view-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          max-height: 500px;
        }

        .carousel-img {
          width: 100%;
          height: 100%;
          max-height: 500px;
          object-fit: contain;
        }

        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background-color var(--transition-fast);
        }

        .carousel-btn:hover {
          background-color: var(--primary);
        }

        .carousel-btn-left {
          left: 12px;
        }

        .carousel-btn-right {
          right: 12px;
        }

        .carousel-indicators {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          background: rgba(0, 0, 0, 0.4);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .carousel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }

        .carousel-dot.active {
          background: #fff;
          width: 10px;
          border-radius: 3px;
        }

        .carousel-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }

        /* Research Card block */
        .research-attachment-box {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          padding: 16px;
          margin-bottom: 16px;
        }

        .research-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-glow);
          color: var(--accent);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
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

        /* Social bar */
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

        /* Comments */
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

        /* Modal styles now in App.css */


        /* Canvas drawing workspace */
        .canvas-workspace {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #111;
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .canvas-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          width: 100%;
          justify-content: space-between;
          background: var(--bg-primary);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
        }

        .canvas-tool-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .color-dot.active {
          border-color: #fff;
          transform: scale(1.1);
        }

        .btn-tool {
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-tool.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        /* Right Sidebar Trending */
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

      {/* Left Sidebar Profile Cards */}
      <div className="left-sidebar">
        {/* Card 1: Profile Summary */}
        <div className="card-glass profile-summary-card" style={{ marginBottom: '16px' }}>
          <div className="profile-card-banner"></div>
          <div className="profile-card-avatar-wrapper">
            <div
              className="avatar-circle"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '3px solid var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--primary)',
                boxSizing: 'border-box'
              }}
            >
              {getInitials(currentUser.name)}
            </div>
          </div>
          <div className="profile-card-info" style={{ textAlign: 'center', padding: '0 16px 16px 16px', borderBottom: '1px solid var(--border)' }}>
            <Link to="/profile" className="profile-card-name" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
              {currentUser.role === 'ADMIN' || currentUser.role === 'RECRUITER' ? currentUser.name : `Dr. ${currentUser.name}`}
            </Link>
            <div className="profile-card-headline" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {currentUser.role} {currentUser.specialty ? `• ${currentUser.specialty}` : ''}
            </div>
            <p className="profile-card-description" style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {currentUser.bio || 'Medical professional in the LinkeDoc network.'}
            </p>
          </div>
          <div className="profile-card-stats-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/network" className="profile-card-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '12px', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'background-color var(--transition-fast)' }}>
              <span>Connections</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>0</span>
            </Link>
            <div className="profile-card-divider" style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
            <Link to="/profile" className="profile-card-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '12px', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'background-color var(--transition-fast)' }}>
              <span>Profil Views</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>0</span>
            </Link>
            <div className="profile-card-divider" style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
            <Link to="/" className="profile-card-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '12px', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'background-color var(--transition-fast)' }}>
              <span>My Items</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>0</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Groups */}
        <div className="card-glass groups-sidebar-card" style={{ marginBottom: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Group</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>{joinedGroups.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {joinedGroups.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                No groups joined yet
              </div>
            ) : (
              joinedGroups.map(g => (
                <Link key={g.id} to="/groups" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                  <div className="group-circle-icon blue-theme" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>
                    {getInitials(g.name)}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500 }} className="sidebar-group-name">{g.name}</span>
                </Link>
              ))
            )}
          </div>
          <Link to="/groups" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginTop: '16px', textAlign: 'center' }}>
            Show all
          </Link>
        </div>

        {/* Card 3: Followed Hashtags */}
        <div className="card-glass hashtags-sidebar-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Followed hashtags</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              No followed hashtags yet.
            </span>
          </div>
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
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={20} />
            <span>Your account is pending verification. You will be able to share updates, upload papers, and comment once approved.</span>
          </div>
        )}

        {/* Start a Post Composer Redesigned */}
        <div className="card-glass post-composer-card" style={{ padding: '12px 16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <button
              onClick={() => { if (isApproved) setComposerModalOpen(true); }}
              disabled={!isApproved}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '30px',
                padding: '10px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <PenTool size={18} style={{ color: 'var(--primary)' }} />
              <span>What's on your mind?</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
            <button
              type="button"
              className="composer-action-btn"
              onClick={() => { if (isApproved) { setComposerModalOpen(true); setMediaModalOpen(true); } }}
              disabled={!isApproved}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}
            >
              <ImageIcon size={18} style={{ color: '#37B24D' }} />
              <span>Photo</span>
            </button>

            <button
              type="button"
              className="composer-action-btn"
              onClick={() => { if (isApproved) { setComposerModalOpen(true); setMediaModalOpen(true); } }}
              disabled={!isApproved}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}
            >
              <VideoIcon size={18} style={{ color: '#1C7ED6' }} />
              <span>Video</span>
            </button>

            <button
              type="button"
              className="composer-action-btn"
              onClick={() => { if (isApproved) { setComposerModalOpen(true); setShowPollComposer(true); } }}
              disabled={!isApproved}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}
            >
              <BarChart2 size={18} style={{ color: '#F59E0B' }} />
              <span>Event</span>
            </button>

            <button
              type="button"
              className="composer-action-btn"
              onClick={() => { if (isApproved) { setComposerModalOpen(true); setIsResearch(true); } }}
              disabled={!isApproved}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}
            >
              <FileText size={18} style={{ color: '#E03131' }} />
              <span>Article</span>
            </button>
          </div>
        </div>

        {/* Create Post Modal */}
        {composerModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90%', maxWidth: '550px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Create a post</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setComposerModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePost}>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '20px' }}>
                  {/* Author info row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                      alt="Me"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{currentUser.name}</span>
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          width: 'fit-content',
                          outline: 'none',
                        }}
                        title="Select post visibility"
                      >
                        <option value="">● Anyone (Public Feed)</option>
                        {joinedGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            ● Group: {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    className="composer-textarea"
                    placeholder="What do you want to talk about?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={!isApproved}
                    required={mediaUrls.length === 0}
                    style={{ width: '100%', minHeight: '120px', background: 'transparent', border: 'none', padding: 0, resize: 'vertical', fontSize: '15px', outline: 'none' }}
                  />

                  {/* Attached media list preview row */}
                  {mediaUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', marginTop: '12px' }}>
                      {mediaUrls.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', border: '1px solid var(--border)', overflow: 'hidden', background: '#000' }}>
                          {url.includes('mov_bbb') || url.includes('.mp4') ? (
                            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={url} alt="Attached asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(idx)}
                            style={{ position: 'absolute', top: '2px', right: '2px', padding: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* HIPAA Compliance Checkbox for media uploads */}
                  {mediaUrls.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        id="hipaa-consent-checkbox"
                        checked={hipaaConsentConfirmed}
                        onChange={(e) => setHipaaConsentConfirmed(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '2px' }}
                        required
                      />
                      <label htmlFor="hipaa-consent-checkbox" style={{ cursor: 'pointer', fontWeight: 500, lineHeight: 1.4 }}>
                        I confirm that all Patient Identifiable Information (PHI) has been anonymized/redacted from this image.
                      </label>
                    </div>
                  )}

                  {/* Preset Media Quick attachment triggers inside modal */}
                  <div style={{ display: 'flex', gap: '8px', margin: '12px 0 6px 0' }}>
                    <button
                      type="button"
                      className="btn-quick-media"
                      onClick={() => { setMediaModalOpen(true); }}
                      disabled={!isApproved}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <ImageIcon size={14} style={{ color: '#37B24D' }} />
                      <span>Add Photo/Video Preset</span>
                    </button>
                  </div>

                  {/* Poll Composer Fields */}
                  {showPollComposer && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      margin: '12px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Create a Clinical Poll
                      </h4>
                      <input
                        type="text"
                        placeholder="Ask a question... (e.g. Which diagnostic procedure is preferred here?)"
                        className="research-input"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        required={showPollComposer}
                        style={{ fontSize: '13px' }}
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Poll Options (Min 2, Max 4)</label>
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              className="research-input"
                              style={{ flex: 1, fontSize: '13px' }}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...pollOptions];
                                updated[idx] = e.target.value;
                                setPollOptions(updated);
                              }}
                              required={idx < 2 && showPollComposer}
                            />
                            {pollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {pollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            style={{
                              alignSelf: 'flex-start',
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '4px 0',
                            }}
                          >
                            + Add Option
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="poll-duration" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Poll Duration</label>
                        <select
                          id="poll-duration"
                          className="research-input"
                          value={pollDurationHours}
                          onChange={(e) => setPollDurationHours(Number(e.target.value))}
                          style={{ background: 'var(--bg-secondary)', width: 'fit-content', fontSize: '12px' }}
                        >
                          <option value={24}>24 Hours</option>
                          <option value={72}>3 Days</option>
                          <option value={168}>7 Days</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Research Paper fields (conditionally rendered) */}
                  {isResearch && canPostResearch && (
                    <div className="research-paper-fields" style={{ margin: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={16} /> Attach Research Paper
                        </h4>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="Enter DOI or keywords..."
                            className="research-input"
                            style={{ padding: '4px 8px', fontSize: '11px', minWidth: '120px' }}
                            value={pubmedQuery}
                            onChange={(e) => setPubmedQuery(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={handlePubMedLookup}
                            disabled={pubmedSearching}
                          >
                            {pubmedSearching ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                            <span>Fetch</span>
                          </button>
                        </div>
                      </div>

                      {pubmedAlert && (
                        <div style={{ fontSize: '11px', color: 'var(--success)', background: 'var(--primary-glow)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary)' }}>
                          {pubmedAlert}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Paper Title *"
                        className="research-input"
                        value={researchTitle}
                        onChange={(e) => setResearchTitle(e.target.value)}
                        required={isResearch}
                        style={{ fontSize: '13px' }}
                      />
                      <textarea
                        placeholder="Abstract / Summary Outline *"
                        className="research-input"
                        style={{ minHeight: '70px', resize: 'vertical', fontSize: '13px' }}
                        value={researchAbstract}
                        onChange={(e) => setResearchAbstract(e.target.value)}
                        required={isResearch}
                      />
                      <input
                        type="url"
                        placeholder="PDF Link, PubMed URL or DOI Link"
                        className="research-input"
                        value={researchLink}
                        onChange={(e) => setResearchLink(e.target.value)}
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {/* Feedback Notifications */}
                  {postError && <div style={{ color: 'var(--danger)', fontSize: '13px', margin: '8px 0' }}>{postError}</div>}
                  {postSuccess && <div style={{ color: 'var(--success)', fontSize: '13px', margin: '8px 0' }}>{postSuccess}</div>}
                </div>

                <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canPostResearch && (
                      <button
                        type="button"
                        className="btn-attachment-toggle"
                        onClick={() => setIsResearch(!isResearch)}
                        disabled={!isApproved}
                        style={{ color: isResearch ? 'var(--accent)' : 'var(--primary)', padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FileText size={14} />
                        <span>{isResearch ? 'Remove Paper' : 'Attach Paper'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-attachment-toggle"
                      onClick={() => setShowPollComposer(!showPollComposer)}
                      disabled={!isApproved}
                      style={{ color: showPollComposer ? 'var(--accent)' : 'var(--primary)', padding: '6px 12px', fontSize: '12px' }}
                    >
                      <BarChart2 size={14} />
                      <span>{showPollComposer ? 'Remove Poll' : 'Add Poll'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={!isApproved || postSubmitting}
                  >
                    <Send size={14} />
                    <span>{postSubmitting ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

            // Media attachment info
            const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
            const carouselIdx = carousels[post.id] || 0;

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

                {/* Render Media Attachments */}
                {hasMedia && post.mediaUrls && (
                  <div className="media-attachments-container">
                    {post.mediaUrls.length === 1 ? (
                      // Single item
                      post.mediaUrls[0].includes('mov_bbb') || post.mediaUrls[0].includes('.mp4') ? (
                        <video src={post.mediaUrls[0]} controls style={{ width: '100%', maxHeight: '420px', display: 'block' }} />
                      ) : (
                        <img src={post.mediaUrls[0]} alt="Post attachment" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} />
                      )
                    ) : (
                      // Carousel Slider
                      <div className="carousel-view-wrapper">
                        <span className="carousel-badge">
                          Slide {carouselIdx + 1} of {post.mediaUrls.length}
                        </span>
                        
                        <button
                          className="carousel-btn carousel-btn-left"
                          onClick={() => navigateCarousel(post.id, -1, post.mediaUrls!.length)}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        {post.mediaUrls[carouselIdx].includes('mov_bbb') || post.mediaUrls[carouselIdx].includes('.mp4') ? (
                          <video src={post.mediaUrls[carouselIdx]} controls style={{ width: '100%', height: '100%', maxHeight: '420px' }} />
                        ) : (
                          <img src={post.mediaUrls[carouselIdx]} alt="Post carousel attachment" className="carousel-img" />
                        )}

                        <button
                          className="carousel-btn carousel-btn-right"
                          onClick={() => navigateCarousel(post.id, 1, post.mediaUrls!.length)}
                        >
                          <ChevronRight size={20} />
                        </button>

                        <div className="carousel-indicators">
                          {post.mediaUrls.map((_, dotIdx) => (
                            <div
                              key={dotIdx}
                              className={`carousel-dot ${dotIdx === carouselIdx ? 'active' : ''}`}
                              onClick={() => setCarousels(prev => ({ ...prev, [post.id]: dotIdx }))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Render Poll */}
                {post.poll && (
                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    marginBottom: '16px',
                    background: 'var(--bg-tertiary)',
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {post.poll.question}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {post.poll.options.map((option: any) => {
                        const totalVotes = post.poll.votes?.length || 0;
                        const optionVotes = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                        
                        // Check if user voted for this option
                        const userVotedThis = post.poll.votes?.some((v: any) => v.userId === currentUser.id && v.optionId === option.id) || votedPollOptions[post.poll.id] === option.id;
                        const hasVotedAny = post.poll.votes?.some((v: any) => v.userId === currentUser.id) || !!votedPollOptions[post.poll.id];
                        const isExpired = new Date() > new Date(post.poll.expiresAt);
                        const showResults = hasVotedAny || isExpired;

                        if (showResults) {
                          return (
                            <div key={option.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)', fontWeight: userVotedThis ? '600' : 'normal' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {option.text}
                                  {userVotedThis && <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px' }}>Your Vote</span>}
                                </span>
                                <span>{percentage}% ({optionVotes})</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentage}%`, height: '100%', background: userVotedThis ? 'var(--primary)' : 'var(--text-muted)', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className="btn-quick-media"
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                textAlign: 'left',
                                display: 'block',
                                borderRadius: 'var(--radius-sm)',
                                borderColor: 'var(--primary)',
                                color: 'var(--primary)',
                                background: 'transparent',
                                fontWeight: 500,
                              }}
                              onClick={() => handleVote(post.poll.id, option.id)}
                              disabled={!isApproved || votingInProgress[post.poll.id]}
                            >
                              {option.text}
                            </button>
                          );
                        }
                      })}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{post.poll.votes?.length || 0} votes</span>
                      <span>
                        {new Date() > new Date(post.poll.expiresAt)
                          ? 'Poll closed'
                          : `Expires on ${new Date(post.poll.expiresAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Research paper card attachment */}
                {post.isResearch && post.researchTitle && (
                  <div className="research-attachment-box">
                    <span className="research-tag"><Layers size={10} /> Research Publication</span>
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
                        <Link2 size={14} /> View Full Text / DOI
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
                    <ThumbsUp size={16} />
                    <span>Like</span>
                  </button>
                  <button
                    className="btn-post-action"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  >
                    <MessageSquare size={16} />
                    <span>Comment</span>
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
          <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span>Trending Discussions</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {trendingCategories.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No trending discussions yet
              </div>
            ) : (
              trendingCategories.map(cat => (
                <Link key={cat.id} to="/forums" className="trending-item">
                  <div className="trending-title">{cat.name}</div>
                  <div className="trending-meta">{cat.description || 'Active medical discussions'}</div>
                </Link>
              ))
            )}
          </div>
          
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', justifyContent: 'center', marginBottom: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link>
              <Link to="/network" style={{ textDecoration: 'none', color: 'inherit' }}>Accessibility</Link>
              <Link to="/jobs" style={{ textDecoration: 'none', color: 'inherit' }}>Help Center</Link>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy & Terms</Link>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Ad Choices</Link>
              <Link to="/jobs" style={{ textDecoration: 'none', color: 'inherit' }}>Advertising</Link>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Business Services</Link>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Get the LinkeDoc app</Link>
              <span style={{ cursor: 'pointer' }}>More</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '9px',
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.5px'
              }}>ld</div>
              <span>LinkeDoc Corporation © 2021</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Picker Modal */}
      {mediaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px' }}>Attach Case Photo or Clinical Video</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMediaModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Paste URL directly:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com/medical-image.jpg"
                    className="research-input"
                    style={{ flex: 1 }}
                    value={inputMediaUrl}
                    onChange={(e) => setInputMediaUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 16px' }}
                    onClick={() => {
                      if (inputMediaUrl.trim()) {
                        setMediaUrls(prev => [...prev, inputMediaUrl.trim()]);
                        setInputMediaUrl('');
                        setMediaModalOpen(false);
                      }
                    }}
                  >
                    Attach
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>Or select from sample clinical presets (Draw & Anonymize!):</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {presetMedia.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'border-color var(--transition-fast)'
                      }}
                      onClick={() => {
                        if (m.type === 'video') {
                          // Direct add video
                          setMediaUrls(prev => [...prev, m.url]);
                          setMediaModalOpen(false);
                        } else {
                          // Open drawing canvas for images
                          setActiveCanvasImage(m.url);
                          setCanvasModalOpen(true);
                        }
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {m.type === 'video' ? <><Film size={12} /> Click to attach video directly</> : <><PenTool size={12} /> Click to annotate &amp; draw</>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMediaModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Drawing Editor Overlay */}
      {canvasModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenTool size={18} style={{ color: 'var(--primary)' }} />
                <span>Annotate & Anonymize Clinical Scan</span>
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCanvasModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px' }}>
              <div className="canvas-workspace">
                <div className="canvas-toolbar">
                  {/* Drawing Tool */}
                  <div className="canvas-tool-group">
                    <button
                      type="button"
                      className={`btn-tool ${drawingTool === 'pen' ? 'active' : ''}`}
                      onClick={() => setDrawingTool('pen')}
                    >
                      <PenTool size={14} /> Pen
                    </button>
                    <button
                      type="button"
                      className={`btn-tool ${drawingTool === 'redact' ? 'active' : ''}`}
                      onClick={() => setDrawingTool('redact')}
                      title="Draw black rectangles to cover patient metadata"
                    >
                      <Square size={14} /> Redact / Block
                    </button>
                    <button
                      type="button"
                      className={`btn-tool ${drawingTool === 'blur' ? 'active' : ''}`}
                      onClick={() => setDrawingTool('blur')}
                      title="Blur sensitive patient data"
                    >
                      <EyeOff size={14} /> Blur
                    </button>
                    <button
                      type="button"
                      className={`btn-tool ${drawingTool === 'arrow' ? 'active' : ''}`}
                      onClick={() => setDrawingTool('arrow')}
                      title="Draw arrow pointing to clinical finding"
                    >
                      <ArrowUpRight size={14} /> Arrow
                    </button>
                    <button
                      type="button"
                      className={`btn-tool ${drawingTool === 'text' ? 'active' : ''}`}
                      onClick={() => setDrawingTool('text')}
                      title="Add text annotation"
                    >
                      <Type size={14} /> Text
                    </button>
                  </div>

                  {/* Colors */}
                  {(drawingTool === 'pen' || drawingTool === 'arrow' || drawingTool === 'text') && (
                    <div className="canvas-tool-group">
                      {['#EF4444', '#F59E0B', '#3B82F6', '#10B981'].map((c) => (
                        <div
                          key={c}
                          className={`color-dot ${drawingColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setDrawingColor(c)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Zoom/Reset */}
                  <div className="canvas-tool-group">
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => setZoomFactor(prev => Math.min(2, prev + 0.25))}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => setZoomFactor(prev => Math.max(0.5, prev - 0.25))}
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => {
                        setZoomFactor(1);
                        // trigger redraw
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (canvas && ctx && activeCanvasImage) {
                          const img = new Image();
                          img.crossOrigin = 'anonymous';
                          img.src = activeCanvasImage;
                          img.onload = () => {
                            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                            const x = (canvas.width - img.width * scale) / 2;
                            const y = (canvas.height - img.height * scale) / 2;
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.fillStyle = '#1e1e1e';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                          };
                        }
                      }}
                      title="Reset image drawings"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: drawingTool === 'pen' ? 'crosshair' : 'cell',
                    background: '#1e1e1e',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
                
                <p style={{ color: '#aaa', fontSize: '11px', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={12} /> Click and drag on image to redact details or highlight clinical focus regions.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCanvasModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '8px 16px', borderRadius: '4px' }}
                onClick={handleSaveCanvasAnnotation}
              >
                Save & Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
