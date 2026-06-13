import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from './notificationController';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        licenseNumber: true,
        medicalRegistrationNumber: true,
        stateMedicalCouncil: true,
        education: true,
        experience: true,
        skills: true,
        status: true,
        avatarUrl: true,
        bannerUrl: true,
        location: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found' });
      return;
    }

    const connectionsCount = await prisma.connection.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: id },
          { receiverId: id },
        ],
      },
    });

    res.status(200).json({ ...user, connectionsCount });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { specialty, education, experience, skills, licenseNumber, medicalRegistrationNumber, stateMedicalCouncil, avatarUrl, bannerUrl, location } = req.body;

  if (!req.user || req.user.id !== id) {
    res.status(403).json({ success: false, error: 'Access denied: can only update your own profile' });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        specialty,
        education,
        experience,
        skills,
        licenseNumber,
        medicalRegistrationNumber,
        stateMedicalCouncil,
        avatarUrl,
        bannerUrl,
        location,
      },
    });

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        specialty: updatedUser.specialty,
        education: updatedUser.education,
        experience: updatedUser.experience,
        skills: updatedUser.skills,
        licenseNumber: updatedUser.licenseNumber,
        medicalRegistrationNumber: updatedUser.medicalRegistrationNumber,
        stateMedicalCouncil: updatedUser.stateMedicalCouncil,
        avatarUrl: updatedUser.avatarUrl,
        bannerUrl: updatedUser.bannerUrl,
        location: updatedUser.location,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createConnection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { receiverId } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const requesterId = req.user.id;

  if (requesterId === receiverId) {
    res.status(400).json({ success: false, error: 'Cannot connect with yourself' });
    return;
  }

  try {
    const connection = await prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        status: 'PENDING',
      },
    });

    // Trigger notification
    await createNotification(receiverId, requesterId, 'CONNECTION_REQUEST', connection.id);

    res.status(201).json({
      success: true,
      connectionId: connection.id,
      status: connection.status,
    });
  } catch (err) {
    next(err);
  }
};

export const updateConnectionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { action } = req.body; // 'ACCEPT' or 'REJECT'

  if (!['ACCEPT', 'REJECT'].includes(action)) {
    res.status(400).json({ success: false, error: 'Invalid connection action' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const userId = req.user.id;

  try {
    const connection = await prisma.connection.findUnique({ where: { id } });

    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection request not found' });
      return;
    }

    // Only the receiver of the connection can accept or reject it
    if (connection.receiverId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied: only the recipient can accept this request' });
      return;
    }

    const updatedStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status: updatedStatus },
    });

    // Trigger notification if accepted
    if (updatedStatus === 'ACCEPTED') {
      await createNotification(connection.requesterId, userId, 'CONNECTION_ACCEPTED', connection.id);
    }

    res.status(200).json({
      success: true,
      connectionId: updatedConnection.id,
      status: updatedConnection.status,
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const query = req.query.query as string;
  const currentUserId = req.user?.id;

  try {
    const users = await prisma.user.findMany({
      where: {
        id: currentUserId ? { not: currentUserId } : undefined,
        role: { notIn: ['ADMIN', 'RECRUITER'] },
        OR: query ? [
          { name: { contains: query, mode: 'insensitive' } },
          { specialty: { contains: query, mode: 'insensitive' } },
          { stateMedicalCouncil: { contains: query, mode: 'insensitive' } },
          { medicalRegistrationNumber: { contains: query, mode: 'insensitive' } },
        ] : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        medicalRegistrationNumber: true,
        stateMedicalCouncil: true,
        status: true,
        avatarUrl: true,
      },
      take: 20,
    });
    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

export const getConnections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const userId = req.user.id;

  try {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
            status: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
            status: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, connections });
  } catch (err) {
    next(err);
  }
};
