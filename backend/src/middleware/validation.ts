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
