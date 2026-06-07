import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
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
  };
});

// Mock Pusher
jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => ({
    trigger: jest.fn().mockResolvedValue({}),
  }));
});

describe('E2EE Messaging & Key Exchange Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'doctor1@hospital.org',
      role: 'DOCTOR',
      status: 'APPROVED',
    };
  });

  describe('PUT /api/users/public-key', () => {
    it('should register public key for an approved user', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: mockCurrentUser.id,
        publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEthisisavalidkey',
      });

      const res = await request(app)
        .put('/api/users/public-key')
        .send({
          publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEthisisavalidkey',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockCurrentUser.id },
        data: { publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEthisisavalidkey' },
      });
    });

    it('should block registration if user is pending approval', async () => {
      mockCurrentUser.status = 'PENDING';

      const res = await request(app)
        .put('/api/users/public-key')
        .send({
          publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEthisisavalidkey',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('pending verification');
    });

    it('should reject registration if payload is invalid (key too short)', async () => {
      const res = await request(app)
        .put('/api/users/public-key')
        .send({
          publicKey: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/public-key', () => {
    it('should retrieve a target user public key', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        publicKey: 'targetuserpublickeybundlebase64',
      });

      const res = await request(app).get('/api/users/22222222-2222-2222-2222-222222222222/public-key');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.publicKey).toBe('targetuserpublickeybundlebase64');
    });
  });

  describe('POST /api/conversations', () => {
    it('should create or fetch a unique conversation with another approved user', async () => {
      const mockConversation = {
        id: '55555555-5555-5555-5555-555555555555',
        participant1Id: mockCurrentUser.id,
        participant2Id: '22222222-2222-2222-2222-222222222222',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        status: 'APPROVED',
      });
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.conversation.create as jest.Mock).mockResolvedValue(mockConversation);

      const res = await request(app)
        .post('/api/conversations')
        .send({
          participantId: '22222222-2222-2222-2222-222222222222',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.conversationId).toBe(mockConversation.id);
    });
  });

  describe('POST /api/conversations/:id/messages', () => {
    it('should send an encrypted message payload', async () => {
      const mockMessage = {
        id: '77777777-7777-7777-7777-777777777777',
        conversationId: '55555555-5555-5555-5555-555555555555',
        senderId: mockCurrentUser.id,
        encryptedBody: 'ciphertextgoesherebase64',
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };

      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
        id: '55555555-5555-5555-5555-555555555555',
        participant1Id: mockCurrentUser.id,
        participant2Id: '22222222-2222-2222-2222-222222222222',
      });
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const res = await request(app)
        .post('/api/conversations/55555555-5555-5555-5555-555555555555/messages')
        .send({
          encryptedBody: 'ciphertextgoesherebase64',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message.encryptedBody).toBe('ciphertextgoesherebase64');
    });
  });
});
