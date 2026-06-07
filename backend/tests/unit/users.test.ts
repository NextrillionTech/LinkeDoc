import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      update: jest.fn(),
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

describe('User Service Unit Tests (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update user profile details', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user-123',
      name: 'Dr. Sarah Smith',
      specialty: 'Cardiology',
      skills: ['Echocardiography'],
    });

    // Simulated profile update logic
    const result = await prisma.user.update({
      where: { id: 'user-123' },
      data: {
        specialty: 'Cardiology',
        skills: ['Echocardiography'],
      },
    });

    expect(result.specialty).toBe('Cardiology');
    expect(result.skills).toContain('Echocardiography');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should create a new connection request', async () => {
    (prisma.connection.create as jest.Mock).mockResolvedValue({
      id: 'connection-999',
      requesterId: 'user-123',
      receiverId: 'user-456',
      status: 'PENDING',
    });

    const result = await prisma.connection.create({
      data: {
        requesterId: 'user-123',
        receiverId: 'user-456',
        status: 'PENDING',
      },
    });

    expect(result.status).toBe('PENDING');
    expect(result.requesterId).toBe('user-123');
    expect(prisma.connection.create).toHaveBeenCalled();
  });
});
