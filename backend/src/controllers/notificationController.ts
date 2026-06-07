import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { pusher } from '../config/pusher';

const prisma = new PrismaClient();

// Helper to create and broadcast notification
export const createNotification = async (userId: string, senderId: string, type: string, relatedId?: string) => {
  if (userId === senderId) return;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        senderId,
        type,
        relatedId: relatedId || null,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
          },
        },
      },
    });

    // Trigger Pusher real-time event
    await pusher.trigger(`private-notifications-${userId}`, 'new-notification', {
      notification,
    });

    return notification;
  } catch (err) {
    console.error('[Notification Helper Error] Failed to create or trigger notification:', err);
  }
};

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
          },
        },
      },
    });

    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
