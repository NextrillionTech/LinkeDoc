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
        education: true,
        experience: true,
        skills: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found' });
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { specialty, education, experience, skills } = req.body;

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
