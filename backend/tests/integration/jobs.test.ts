import request from 'supertest';
import app from '../../src/config/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    jobListing: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const prisma = new PrismaClient();

// Dynamic mock user for testing different roles/status
let mockCurrentUser = {
  id: 'rec123-rec123-rec123-rec123-rec123rec123',
  email: 'recruiter@neonhospital.org',
  role: 'RECRUITER',
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

describe('Healthcare Job Board Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to approved recruiter default
    mockCurrentUser = {
      id: 'rec123-rec123-rec123-rec123-rec123rec123',
      email: 'recruiter@neonhospital.org',
      role: 'RECRUITER',
      status: 'APPROVED',
    };
  });

  describe('POST /api/jobs', () => {
    it('should create a new job listing when authenticated as approved Recruiter', async () => {
      const mockJob = {
        id: 'job555-job555-job555-job555-job555job555',
        recruiterId: mockCurrentUser.id,
        title: 'Chief Resident - Internal Medicine',
        description: 'We are seeking a Chief Resident to lead clinical training, schedule rotations, and supervise internal medicine interns.',
        specialty: 'Internal Medicine',
        location: 'Chicago, IL',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      (prisma.jobListing.create as jest.Mock).mockResolvedValue(mockJob);

      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Chief Resident - Internal Medicine',
          description: 'We are seeking a Chief Resident to lead clinical training, schedule rotations, and supervise internal medicine interns.',
          specialty: 'Internal Medicine',
          location: 'Chicago, IL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.title).toBe('Chief Resident - Internal Medicine');
      expect(res.body.job.recruiterId).toBe(mockCurrentUser.id);
      expect(prisma.jobListing.create).toHaveBeenCalled();
    });

    it('should reject job creation if user is not a RECRUITER', async () => {
      mockCurrentUser.role = 'DOCTOR';

      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Chief Resident - Internal Medicine',
          description: 'We are seeking a Chief Resident to lead clinical training, schedule rotations, and supervise internal medicine interns.',
          specialty: 'Internal Medicine',
          location: 'Chicago, IL',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access denied');
      expect(prisma.jobListing.create).not.toHaveBeenCalled();
    });

    it('should reject job creation if validation fails (missing fields)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Short',
          description: 'Too short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(prisma.jobListing.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs', () => {
    it('should list all active (non-expired) job listings', async () => {
      const mockJobs = [
        {
          id: 'job1',
          title: 'Cardiologist',
          specialty: 'Cardiology',
          location: 'New York, NY',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          recruiter: { name: 'NY Hospital Systems' },
        },
        {
          id: 'job2',
          title: 'Pediatric Nurse',
          specialty: 'Pediatrics',
          location: 'Chicago, IL',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          recruiter: { name: 'Chicago Pediatrics Clinic' },
        },
      ];

      (prisma.jobListing.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const res = await request(app).get('/api/jobs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].recruiterName).toBe('NY Hospital Systems');
      expect(prisma.jobListing.findMany).toHaveBeenCalled();
    });

    it('should filter jobs by specialty and location', async () => {
      (prisma.jobListing.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/jobs')
        .query({ specialty: 'Cardiology', location: 'Chicago' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.jobListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: expect.any(Object),
            specialty: expect.objectContaining({ contains: 'Cardiology', mode: 'insensitive' }),
            location: expect.objectContaining({ contains: 'Chicago', mode: 'insensitive' }),
          }),
        })
      );
    });
  });
});
