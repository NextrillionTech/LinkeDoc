import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['DOCTOR', 'NURSE', 'PHARMACIST', 'RESEARCHER', 'RECRUITER', 'ADMIN']),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const connectionSchema = z.object({
  receiverId: z.string().uuid('Invalid user ID format'),
});

export const threadSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID format'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(5, 'Body must be at least 5 characters'),
});

export const replySchema = z.object({
  threadId: z.string().uuid('Invalid thread ID format'),
  body: z.string().min(1, 'Reply content cannot be empty'),
});

export const reportSchema = z.object({
  contentType: z.enum(['THREAD', 'REPLY']),
  contentId: z.string().uuid('Invalid content ID format'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  specialty: z.string().min(2, 'Specialty is required'),
  location: z.string().min(2, 'Location is required'),
});

export const publicKeySchema = z.object({
  publicKey: z.string().min(10, 'Public key must be at least 10 characters'),
});

export const conversationCreateSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID format'),
});

export const messageSendSchema = z.object({
  encryptedBody: z.string().min(1, 'Encrypted body content cannot be empty'),
});

export const postSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty'),
  isResearch: z.boolean().optional(),
  researchTitle: z.string().optional(),
  researchAbstract: z.string().optional(),
  researchLink: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  groupId: z.string().uuid().nullable().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters'),
  description: z.string().min(5, 'Group description must be at least 5 characters'),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
});

export const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: err.errors[0]?.message || 'Validation error',
        });
        return;
      }
      next(err);
    }
  };
};
