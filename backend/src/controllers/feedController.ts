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

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { content, isResearch, researchTitle, researchAbstract, researchLink } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    if (isResearch) {
      if (!['DOCTOR', 'RESEARCHER'].includes(userRole)) {
        res.status(400).json({
          success: false,
          error: 'Only Doctors and Researchers are permitted to upload research papers.',
        });
        return;
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
        isResearch: !!isResearch,
        researchTitle: isResearch ? researchTitle : null,
        researchAbstract: isResearch ? researchAbstract : null,
        researchLink: isResearch ? researchLink : null,
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
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const posts = await prisma.post.findMany({
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

export const toggleLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    const like = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let liked = false;
    if (like) {
      await prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      liked = true;
    }

    const likeCount = await prisma.postLike.count({ where: { postId } });
    res.status(200).json({ success: true, liked, likeCount });
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        content,
        authorId: userId,
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
    });

    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const postId = req.params.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    const comments = await prisma.postComment.findMany({
      where: { postId },
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
    });

    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};
