import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    connection: {
      create: jest.fn(),
      update: jest.fn(),
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

  describe('GET /api/users', () => {
    it('should search and return list of users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-2',
          name: 'Dr. Jane Smith',
          specialty: 'Cardiology',
          medicalRegistrationNumber: 'MRN54321',
          stateMedicalCouncil: 'NMC',
          status: 'APPROVED',
        },
      ]);

      const res = await request(app)
        .get('/api/users')
        .query({ query: 'Jane' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].name).toBe('Dr. Jane Smith');
    });
  });

  describe('GET /api/users/connections', () => {
    it('should retrieve list of connections', async () => {
      (prisma.connection.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'conn-1',
          status: 'PENDING',
          requesterId: 'user-requester-id',
          receiverId: 'user-2',
          requester: { id: 'user-requester-id', name: 'Dr. John Doe', role: 'DOCTOR' },
          receiver: { id: 'user-2', name: 'Dr. Jane Smith', role: 'DOCTOR' },
        },
      ]);

      const res = await request(app)
        .get('/api/users/connections');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connections).toHaveLength(1);
    });
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
