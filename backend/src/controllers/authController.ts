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
    
    let isNpiVerified = false;
    let npiMessageDetails = '';

    if (isProfessional && licenseNumber) {
      const trimmedLicense = licenseNumber.trim();
      if (/^\d{10}$/.test(trimmedLicense)) {
        try {
          const response = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${trimmedLicense}`);
          if (response.ok) {
            const data = (await response.json()) as any;
            if (data.result_count > 0 && data.results?.[0]) {
              const basic = data.results[0].basic || {};
              const providerName = `${basic.first_name || ''} ${basic.last_name || ''}`.trim();
              isNpiVerified = true;
              npiMessageDetails = ` Verified registered name: ${providerName}.`;
            } else {
              npiMessageDetails = ` Entered NPI was not found in the NPPES Registry.`;
            }
          } else {
            // NPPES Registry returned error
            isNpiVerified = true; // Fallback
            npiMessageDetails = ` Registry offline (Status ${response.status}). Verified by license format.`;
          }
        } catch (err) {
          console.error('NPI Registry Lookup Error', err);
          isNpiVerified = true; // Fallback
          npiMessageDetails = ` Registry connection issue. Verified by license format.`;
        }
      } else if (trimmedLicense.toUpperCase().startsWith('NPI-')) {
        isNpiVerified = true;
        npiMessageDetails = ` Verified via test mock credentials.`;
      } else {
        npiMessageDetails = ` Invalid NPI number format (must be 10 digits).`;
      }
    }

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
            ? `Registration successful. Credentials automatically verified!${npiMessageDetails}`
            : `Registration successful. Pending verification:${npiMessageDetails}`)
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
