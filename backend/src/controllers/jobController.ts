import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { title, description, specialty, location, applyUrl } = req.body;
  const recruiterId = req.user?.id;

  if (!recruiterId) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing recruiter ID' });
    return;
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const job = await prisma.jobListing.create({
      data: {
        recruiterId,
        title,
        description,
        specialty,
        location,
        applyUrl,
        expiresAt,
      },
    });

    res.status(201).json({
      success: true,
      job,
    });
  } catch (err) {
    next(err);
  }
};

export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { specialty, location, query, datePosted } = req.query;

  try {
    const whereClause: any = {
      expiresAt: {
        gt: new Date(),
      },
    };

    if (specialty && typeof specialty === 'string') {
      whereClause.specialty = {
        contains: specialty,
        mode: 'insensitive',
      };
    }

    if (location && typeof location === 'string') {
      whereClause.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (query && typeof query === 'string') {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { recruiter: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (datePosted && typeof datePosted === 'string') {
      const days = parseInt(datePosted);
      if (!isNaN(days)) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);
        whereClause.createdAt = {
          gte: thresholdDate,
        };
      }
    }

    const jobs = await prisma.jobListing.findMany({
      where: whereClause,
      include: {
        recruiter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const results = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      specialty: job.specialty,
      location: job.location,
      applyUrl: job.applyUrl,
      recruiterName: job.recruiter.name,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
    }));

    res.status(200).json({
      success: true,
      results,
    });
  } catch (err) {
    next(err);
  }
};
