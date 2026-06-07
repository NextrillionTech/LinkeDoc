import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all categories
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.forumCategory.findMany();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

// Get threads in a category (only APPROVED)
export const getCategoryThreads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { categoryId } = req.params;
  try {
    const threads = await prisma.discussionThread.findMany({
      where: {
        categoryId,
        status: 'APPROVED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(threads);
  } catch (err) {
    next(err);
  }
};

// Get thread details (thread details + APPROVED replies)
export const getThreadDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const thread = await prisma.discussionThread.findFirst({
      where: {
        id,
        status: 'APPROVED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
          },
        },
        replies: {
          where: {
            status: 'APPROVED',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                specialty: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!thread) {
      res.status(404).json({ success: false, error: 'Thread not found' });
      return;
    }

    res.status(200).json(thread);
  } catch (err) {
    next(err);
  }
};

// Create a thread
export const createThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { categoryId, title, body } = req.body;
  const authorId = (req as any).user.id;

  try {
    const categoryExists = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const thread = await prisma.discussionThread.create({
      data: {
        categoryId,
        authorId,
        title,
        body,
        status: 'APPROVED',
      },
    });

    res.status(201).json({
      success: true,
      thread,
    });
  } catch (err) {
    next(err);
  }
};

// Create a reply
export const createReply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { threadId, body } = req.body;
  const authorId = (req as any).user.id;

  try {
    const threadExists = await prisma.discussionThread.findFirst({
      where: { id: threadId, status: 'APPROVED' },
    });
    if (!threadExists) {
      res.status(404).json({ success: false, error: 'Thread not found or has been hidden' });
      return;
    }

    const reply = await prisma.postReply.create({
      data: {
        threadId,
        authorId,
        body,
        status: 'APPROVED',
      },
    });

    res.status(201).json({
      success: true,
      reply,
    });
  } catch (err) {
    next(err);
  }
};

// Flag and immediately hide thread/reply (PII Violation)
export const reportContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { contentType, contentId, reason } = req.body;
  const reporterId = (req as any).user.id;

  try {
    if (contentType === 'THREAD') {
      await prisma.discussionThread.update({
        where: { id: contentId },
        data: { status: 'REJECTED' },
      });
    } else if (contentType === 'REPLY') {
      await prisma.postReply.update({
        where: { id: contentId },
        data: { status: 'REJECTED' },
      });
    }

    await prisma.report.create({
      data: {
        reporterId,
        contentType,
        contentId,
        reason,
        status: 'PENDING',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Content flagged. It has been hidden and queued for admin review.',
    });
  } catch (err) {
    next(err);
  }
};
