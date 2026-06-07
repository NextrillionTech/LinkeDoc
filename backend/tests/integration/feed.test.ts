import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    postComment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const prisma = new PrismaClient();

// Mock Auth Middleware
let mockCurrentUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'doctor1@hospital.org',
  role: 'DOCTOR',
  status: 'APPROVED',
};

jest.mock('../../src/middleware/auth', () => {
  const actual = jest.requireActual('../../src/middleware/auth');
  return {
    ...actual,
    authenticateJWT: (req: any, res: any, next: any) => {
      req.user = mockCurrentUser;
      next();
    },
    requireApprovedUser: (req: any, res: any, next: any) => {
      if (mockCurrentUser.status !== 'APPROVED') {
        return res.status(403).json({ success: false, error: 'User must be approved to access this resource.' });
      }
      next();
    },
  };
});

describe('Medical Feed API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'doctor1@hospital.org',
      role: 'DOCTOR',
      status: 'APPROVED',
    };
  });

  describe('POST /api/feed', () => {
    it('should create a new text update for approved users', async () => {
      (prisma.post.create as jest.Mock).mockResolvedValue({
        id: 'post-1',
        content: 'Excited to announce my new research',
        authorId: mockCurrentUser.id,
        isResearch: false,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/feed')
        .send({
          content: 'Excited to announce my new research',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post.content).toBe('Excited to announce my new research');
      expect(prisma.post.create).toHaveBeenCalled();
    });

    it('should allow DOCTOR or RESEARCHER to post a research paper', async () => {
      (prisma.post.create as jest.Mock).mockResolvedValue({
        id: 'post-2',
        content: 'Abstract details here...',
        authorId: mockCurrentUser.id,
        isResearch: true,
        researchTitle: 'Cardiovascular Analysis',
        researchAbstract: 'A deep dive into cardiac metrics',
        researchLink: 'https://cardio-journal.org/pdf',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/feed')
        .send({
          content: 'Abstract details here...',
          isResearch: true,
          researchTitle: 'Cardiovascular Analysis',
          researchAbstract: 'A deep dive into cardiac metrics',
          researchLink: 'https://cardio-journal.org/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post.isResearch).toBe(true);
      expect(res.body.post.researchTitle).toBe('Cardiovascular Analysis');
    });

    it('should block non-doctors/researchers from posting a research paper', async () => {
      mockCurrentUser.role = 'RECRUITER';

      const res = await request(app)
        .post('/api/feed')
        .send({
          content: 'Hiring nurses',
          isResearch: true,
          researchTitle: 'Cardiovascular Analysis',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only Doctors and Researchers');
    });

    it('should block PENDING users from posting', async () => {
      mockCurrentUser.status = 'PENDING';

      const res = await request(app)
        .post('/api/feed')
        .send({
          content: 'Pending post',
        });

      console.log('FEED TEST PENDING RESPONSE:', res.status, res.body, res.text);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/feed', () => {
    it('should retrieve feed posts including like & comment metadata', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'post-1',
          content: 'My clinical update',
          authorId: 'user-2',
          isResearch: false,
          createdAt: new Date(),
          author: { id: 'user-2', name: 'Dr. Jane Smith', role: 'DOCTOR', specialty: 'Neurology' },
          likes: [],
          comments: [],
        },
      ]);

      const res = await request(app).get('/api/feed');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].content).toBe('My clinical update');
      expect(res.body[0].author.name).toBe('Dr. Jane Smith');
    });
  });

  describe('POST /api/feed/:id/like', () => {
    it('should toggle like on a post (like case)', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.postLike.create as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prisma.postLike.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .post('/api/feed/post-1/like')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.liked).toBe(true);
      expect(res.body.likeCount).toBe(1);
    });

    it('should toggle like on a post (unlike case)', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prisma.postLike.delete as jest.Mock).mockResolvedValue({ id: 'like-1' });
      (prisma.postLike.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/feed/post-1/like')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.liked).toBe(false);
      expect(res.body.likeCount).toBe(0);
    });
  });

  describe('POST /api/feed/:id/comments', () => {
    it('should add comment for approved users', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-1' });
      (prisma.postComment.create as jest.Mock).mockResolvedValue({
        id: 'comment-1',
        content: 'Great research paper!',
        postId: 'post-1',
        authorId: mockCurrentUser.id,
        createdAt: new Date(),
        author: { id: mockCurrentUser.id, name: 'Dr. Sarah Smith' },
      });

      const res = await request(app)
        .post('/api/feed/post-1/comments')
        .send({
          content: 'Great research paper!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.content).toBe('Great research paper!');
      expect(prisma.postComment.create).toHaveBeenCalled();
    });
  });
});
