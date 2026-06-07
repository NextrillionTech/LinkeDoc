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
