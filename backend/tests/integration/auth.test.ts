import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock the entire Prisma Client to avoid real DB dependency during TDD tests
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hashSync: () => 'hashed_password',
  compareSync: () => true,
}));

const prisma = new PrismaClient();

describe('Auth Integration Tests (TDD - Route validation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a medical professional and set status to PENDING', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        name: 'Dr. Sarah',
        email: 'sarah@hospital.org',
        role: 'DOCTOR',
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dr. Sarah',
          email: 'sarah@hospital.org',
          password: 'securepassword123',
          role: 'DOCTOR',
          specialty: 'Cardiology',
          licenseNumber: 'LIC-987654-NY',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.status).toBe('PENDING');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should reject registration if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dr. Sarah',
          email: 'invalid-email',
          password: '123',
          role: 'DOCTOR',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login if credentials are valid but user is PENDING', async () => {
      // Mock finding user but user is PENDING
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        email: 'sarah@hospital.org',
        passwordHash: '$2a$10$hashedpasswordplaceholder',
        role: 'DOCTOR',
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@hospital.org',
          password: 'securepassword123',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('pending');
    });
  });
});
