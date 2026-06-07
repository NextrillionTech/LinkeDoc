import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    forumCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    discussionThread: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postReply: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    report: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const prisma = new PrismaClient();

// Mock Auth Middleware payload
jest.mock('../../src/middleware/auth', () => {
  const actual = jest.requireActual('../../src/middleware/auth');
  return {
    ...actual,
    authenticateJWT: (req: any, res: any, next: any) => {
      req.user = {
        id: 'a444a444-a444-a444-a444-a444a444a444',
        email: 'doctor@hospital.org',
        role: 'DOCTOR',
        status: 'APPROVED',
      };
      next();
    },
  };
});

const VALID_CAT_ID = 'c111c111-c111-c111-c111-c111c111c111';
const VALID_THREAD_ID = 'd222d222-d222-d222-d222-d222d222d222';
const VALID_REPLY_ID = 'e333e333-e333-e333-e333-e333e333e333';

describe('Forums & Flagging Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/forums/categories', () => {
    it('should list all forum categories', async () => {
      const mockCategories = [
        { id: VALID_CAT_ID, name: 'Cardiology', slug: 'cardiology', description: 'Heart health' },
        { id: 'c222c222-c222-c222-c222-c222c222c222', name: 'Pediatrics', slug: 'pediatrics', description: 'Child care' },
      ];
      (prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const res = await request(app).get('/api/forums/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Cardiology');
      expect(prisma.forumCategory.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/forums/threads', () => {
    it('should create a new thread in a category', async () => {
      const mockThread = {
        id: VALID_THREAD_ID,
        categoryId: VALID_CAT_ID,
        authorId: 'a444a444-a444-a444-a444-a444a444a444',
        title: 'New ACC Guidelines',
        body: 'Let us discuss...',
        status: 'APPROVED',
      };
      (prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({ id: VALID_CAT_ID });
      (prisma.discussionThread.create as jest.Mock).mockResolvedValue(mockThread);

      const res = await request(app)
        .post('/api/forums/threads')
        .send({
          categoryId: VALID_CAT_ID,
          title: 'New ACC Guidelines',
          body: 'Let us discuss...',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.thread.title).toBe('New ACC Guidelines');
      expect(prisma.discussionThread.create).toHaveBeenCalled();
    });

    it('should fail if fields are missing', async () => {
      const res = await request(app)
        .post('/api/forums/threads')
        .send({
          title: 'Missing Category',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/forums/replies', () => {
    it('should add a reply comment to a thread', async () => {
      const mockReply = {
        id: VALID_REPLY_ID,
        threadId: VALID_THREAD_ID,
        authorId: 'a444a444-a444-a444-a444-a444a444a444',
        body: 'I agree with this research.',
        status: 'APPROVED',
      };
      (prisma.discussionThread.findFirst as jest.Mock).mockResolvedValue({ id: VALID_THREAD_ID });
      (prisma.postReply.create as jest.Mock).mockResolvedValue(mockReply);

      const res = await request(app)
        .post('/api/forums/replies')
        .send({
          threadId: VALID_THREAD_ID,
          body: 'I agree with this research.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reply.body).toBe('I agree with this research.');
      expect(prisma.postReply.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/forums/report', () => {
    it('should flag and immediately hide a thread', async () => {
      (prisma.discussionThread.update as jest.Mock).mockResolvedValue({
        id: VALID_THREAD_ID,
        status: 'REJECTED',
      });
      (prisma.report.create as jest.Mock).mockResolvedValue({
        id: 'rep-123',
      });

      const res = await request(app)
        .post('/api/forums/report')
        .send({
          contentType: 'THREAD',
          contentId: VALID_THREAD_ID,
          reason: 'Patient data disclosure',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.discussionThread.update).toHaveBeenCalledWith({
        where: { id: VALID_THREAD_ID },
        data: { status: 'REJECTED' },
      });
      expect(prisma.report.create).toHaveBeenCalled();
    });

    it('should flag and immediately hide a reply', async () => {
      (prisma.postReply.update as jest.Mock).mockResolvedValue({
        id: VALID_REPLY_ID,
        status: 'REJECTED',
      });
      (prisma.report.create as jest.Mock).mockResolvedValue({
        id: 'rep-123',
      });

      const res = await request(app)
        .post('/api/forums/report')
        .send({
          contentType: 'REPLY',
          contentId: VALID_REPLY_ID,
          reason: 'Contains patient PII',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.postReply.update).toHaveBeenCalledWith({
        where: { id: VALID_REPLY_ID },
        data: { status: 'REJECTED' },
      });
      expect(prisma.report.create).toHaveBeenCalled();
    });
  });
});
