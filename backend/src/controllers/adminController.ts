import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getPendingUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        licenseNumber: true,
        medicalRegistrationNumber: true,
        stateMedicalCouncil: true,
        createdAt: true,
      },
    });

    res.status(200).json({ success: true, pendingUsers });
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid verification status' });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `User registration has been ${status.toLowerCase()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};
