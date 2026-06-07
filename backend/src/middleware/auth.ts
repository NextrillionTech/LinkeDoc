import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: string;
  email: string;
  role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'RESEARCHER' | 'RECRUITER' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Extend Request type to include user payload
export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header with Bearer token is required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired authorization token' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Access denied: insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireApprovedUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.status !== 'APPROVED') {
    res.status(403).json({ success: false, error: 'Access denied: your account is pending verification' });
    return;
  }

  next();
};
