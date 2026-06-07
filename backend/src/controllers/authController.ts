import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, role, specialty, licenseNumber } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const isProfessional = ['DOCTOR', 'NURSE', 'PHARMACIST', 'RESEARCHER'].includes(role);
    
    // NPI lookup mockup: check if licenseNumber is a 10-digit code or starts with NPI-
    const isNpiVerified = isProfessional && licenseNumber && (/^\d{10}$/.test(licenseNumber.trim()) || licenseNumber.trim().toUpperCase().startsWith('NPI-'));
    const initialStatus = isProfessional ? (isNpiVerified ? 'APPROVED' : 'PENDING') : 'APPROVED';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        specialty,
        licenseNumber,
        status: initialStatus,
      },
    });

    res.status(201).json({
      success: true,
      message: isProfessional
        ? (isNpiVerified
            ? 'Registration successful. Your credentials have been automatically verified via NPI database mockup!'
            : 'Registration successful. Your account is pending verification by administration.')
        : 'Registration successful.',
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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        success: false,
        error: 'Your registration is still pending administrator review.',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        error: 'Your registration request has been rejected by the administrator.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      secret,
      { expiresIn: '1d' },
    );

    res.status(200).json({
      success: true,
      token,
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
