import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Feed } from '../../src/pages/Feed';
import { api } from '../../src/services/api';

// Mock API service layer
vi.mock('../../src/services/api', () => ({
  api: {
    getCurrentUser: vi.fn().mockReturnValue({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Jane Smith',
      role: 'DOCTOR',
      status: 'APPROVED',
    }),
    getFeed: vi.fn().mockResolvedValue([
      {
        id: 'post-1',
        content: 'Excited to share my cardiology insights',
        isResearch: false,
        createdAt: new Date().toISOString(),
        author: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Sarah Connor',
          role: 'DOCTOR',
          specialty: 'Cardiology',
        },
        likesCount: 3,
        commentsCount: 1,
        hasLiked: false,
        comments: [
          {
            id: 'comment-1',
            content: 'Great post doctor!',
            createdAt: new Date().toISOString(),
            author: {
              id: '33333333-3333-3333-3333-333333333333',
              name: 'John Doe',
              role: 'NURSE',
            },
          },
        ],
      },
    ]),
    createPost: vi.fn().mockResolvedValue({ success: true }),
    toggleLike: vi.fn().mockResolvedValue({ success: true, liked: true, likeCount: 4 }),
    addComment: vi.fn().mockResolvedValue({
      success: true,
      comment: {
        id: 'comment-2',
        content: 'Inspiring!',
        createdAt: new Date().toISOString(),
        author: {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Jane Smith',
          role: 'DOCTOR',
        },
      },
    }),
  },
}));

describe('Home Feed Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 3-column layout and post composer', async () => {
    render(
      <BrowserRouter>
        <Feed />
      </BrowserRouter>
    );

    // Left Profile Card
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();

    // Center Composer
    expect(screen.getByPlaceholderText(/What medical update or clinical finding/i)).toBeInTheDocument();

    // Right Trending Card
    expect(screen.getByText('Trending Discussions')).toBeInTheDocument();

    // Post content in feed
    await waitFor(() => {
      expect(screen.getByText('Excited to share my cardiology insights')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Connor')).toBeInTheDocument();
    });
  });

  it('allows DOCTOR user to toggle research paper fields and create a post', async () => {
    render(
      <BrowserRouter>
        <Feed />
      </BrowserRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /Attach Research Paper/i });
    fireEvent.click(toggleButton);

    // Research paper input fields should appear
    expect(screen.getByPlaceholderText('Paper Title *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Abstract / Summary Outline *')).toBeInTheDocument();

    // Input values
    const textarea = screen.getByPlaceholderText(/What medical update or clinical finding/i);
    fireEvent.change(textarea, { target: { value: 'New paper abstract' } });

    fireEvent.change(screen.getByPlaceholderText('Paper Title *'), { target: { value: 'COVID-19 Analysis' } });
    fireEvent.change(screen.getByPlaceholderText('Abstract / Summary Outline *'), { target: { value: 'Summary of details' } });

    const postButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledWith({
        content: 'New paper abstract',
        isResearch: true,
        mediaUrls: [],
        researchTitle: 'COVID-19 Analysis',
        researchAbstract: 'Summary of details',
        researchLink: '',
      });
    });
  });

  it('toggles liking a post', async () => {
    render(
      <BrowserRouter>
        <Feed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Excited to share my cardiology insights')).toBeInTheDocument();
    });

    const likeButton = screen.getByRole('button', { name: /Like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(api.toggleLike).toHaveBeenCalledWith('post-1');
      expect(screen.getByText('4 likes')).toBeInTheDocument();
    });
  });

  it('expands comments list and submits a comment', async () => {
    render(
      <BrowserRouter>
        <Feed />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Excited to share my cardiology insights')).toBeInTheDocument();
    });

    const commentToggle = screen.getByRole('button', { name: /Comment/i });
    fireEvent.click(commentToggle);

    // Comment input should render
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a professional reply...')).toBeInTheDocument();
    });

    // Existing comment
    expect(screen.getByText('Great post doctor!')).toBeInTheDocument();

    // Submit a new comment
    const commentInput = screen.getByPlaceholderText('Add a professional reply...');
    fireEvent.change(commentInput, { target: { value: 'Inspiring!' } });

    const submitCommentButton = screen.getAllByRole('button', { name: 'Post' })[1];
    fireEvent.click(submitCommentButton);

    await waitFor(() => {
      expect(api.addComment).toHaveBeenCalledWith('post-1', 'Inspiring!');
      expect(screen.getByText('Inspiring!')).toBeInTheDocument();
      expect(screen.getByText('2 comments')).toBeInTheDocument();
    });
  });
});
