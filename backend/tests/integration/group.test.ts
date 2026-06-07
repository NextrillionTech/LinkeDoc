import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    group: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    groupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
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

describe('Clinical Groups API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'doctor1@hospital.org',
      role: 'DOCTOR',
      status: 'APPROVED',
    };
  });

  describe('POST /api/groups', () => {
    it('should create a new clinical group', async () => {
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.group.create as jest.Mock).mockResolvedValue({
        id: 'group-1',
        name: 'Cardiology Focus Group',
        description: 'Cardiology discussions.',
        creatorId: mockCurrentUser.id,
        creator: { id: mockCurrentUser.id, name: 'John Doe' },
        members: [{ id: 'member-1', userId: mockCurrentUser.id, groupId: 'group-1' }],
      });

      const res = await request(app)
        .post('/api/groups')
        .send({
          name: 'Cardiology Focus Group',
          description: 'Cardiology discussions.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.group.name).toBe('Cardiology Focus Group');
      expect(prisma.group.create).toHaveBeenCalled();
    });

    it('should prevent creating a group with duplicate name', async () => {
      (prisma.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-existing',
        name: 'Cardiology Focus Group',
      });

      const res = await request(app)
        .post('/api/groups')
        .send({
          name: 'Cardiology Focus Group',
          description: 'Different description.',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('POST /api/groups/:id/join', () => {
    it('should allow user to join group if not already a member', async () => {
      (prisma.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        name: 'Cardiology Focus Group',
      });
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.groupMember.create as jest.Mock).mockResolvedValue({
        id: 'member-1',
        groupId: 'group-1',
        userId: mockCurrentUser.id,
      });

      const res = await request(app)
        .post('/api/groups/group-1/join')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.groupMember.create).toHaveBeenCalled();
    });

    it('should return 400 if user is already a group member', async () => {
      (prisma.group.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        name: 'Cardiology Focus Group',
      });
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-existing',
        groupId: 'group-1',
        userId: mockCurrentUser.id,
      });

      const res = await request(app)
        .post('/api/groups/group-1/join')
        .send();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Already a member');
    });
  });

  describe('GET /api/groups/:id/feed', () => {
    it('should retrieve feed posts inside a joined group', async () => {
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'member-existing',
        groupId: 'group-1',
        userId: mockCurrentUser.id,
      });

      (prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'post-1',
          content: 'Discussing cardiac ultrasound details',
          isResearch: false,
          mediaUrls: [],
          groupId: 'group-1',
          createdAt: new Date(),
          author: { id: mockCurrentUser.id, name: 'Doctor One', role: 'DOCTOR', specialty: 'Cardiology' },
          likes: [],
          comments: [],
        },
      ]);

      const res = await request(app)
        .get('/api/groups/group-1/feed');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].content).toBe('Discussing cardiac ultrasound details');
      expect(prisma.post.findMany).toHaveBeenCalled();
    });

    it('should block users who are not members of the group from viewing the feed', async () => {
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/groups/group-1/feed');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('must join this group');
    });
  });
});
