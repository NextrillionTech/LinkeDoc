import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, description } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const existing = await prisma.group.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ success: false, error: 'A group with this name already exists' });
      return;
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        creatorId: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        members: true,
      },
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
};

export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        members: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // Format list and check if current user is a member
    const formatted = groups.map((g) => {
      const isMember = g.members.some((m) => m.userId === userId);
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        creatorId: g.creatorId,
        creatorName: g.creator.name,
        memberCount: g.members.length,
        postCount: g._count.posts,
        isMember,
        createdAt: g.createdAt,
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const groupId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (member) {
      res.status(400).json({ success: false, error: 'Already a member of this group' });
      return;
    }

    await prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });

    res.status(200).json({ success: true, message: 'Joined group successfully' });
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const groupId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      res.status(400).json({ success: false, error: 'Not a member of this group' });
      return;
    }

    if (group.creatorId === userId) {
      res.status(400).json({ success: false, error: 'Group creators cannot leave their own group' });
      return;
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    res.status(200).json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    next(err);
  }
};

export const getGroupFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const groupId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    // Check if user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      res.status(403).json({ success: false, error: 'You must join this group to view its feed.' });
      return;
    }

    const posts = await prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            specialty: true,
          },
        },
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    const feed = posts.map((p) => {
      const likesCount = p.likes.length;
      const commentsCount = p.comments.length;
      const hasLiked = p.likes.some((like) => like.userId === userId);

      return {
        id: p.id,
        content: p.content,
        isResearch: p.isResearch,
        researchTitle: p.researchTitle,
        researchAbstract: p.researchAbstract,
        researchLink: p.researchLink,
        mediaUrls: p.mediaUrls,
        groupId: p.groupId,
        createdAt: p.createdAt,
        author: p.author,
        likesCount,
        commentsCount,
        hasLiked,
        comments: p.comments,
      };
    });

    res.status(200).json(feed);
  } catch (err) {
    next(err);
  }
};
