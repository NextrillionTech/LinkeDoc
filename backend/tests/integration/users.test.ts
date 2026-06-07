import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    connection: {
      create: jest.fn(),
      update: jest.fn(),
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
        id: 'user-requester-id',
        email: 'doctor@hospital.org',
        role: 'DOCTOR',
        status: 'APPROVED',
      };
      next();
    },
  };
});

describe('Users & Connections Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/connections', () => {
    it('should create a connection request to another user', async () => {
      (prisma.connection.create as jest.Mock).mockResolvedValue({
        id: 'conn-abc-123',
        requesterId: 'user-requester-id',
        receiverId: 'b182d7a2-f94d-44a3-aa1e-03a0889df123',
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/users/connections')
        .send({
          receiverId: 'b182d7a2-f94d-44a3-aa1e-03a0889df123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.connectionId).toBe('conn-abc-123');
      expect(res.body.status).toBe('PENDING');
    });
  });
});
