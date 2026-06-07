import { Router } from 'express';
import { createJob, getJobs } from '../controllers/jobController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { validateBody, jobSchema } from '../middleware/validation';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('RECRUITER'), validateBody(jobSchema), createJob);
router.get('/', getJobs);

export default router;
