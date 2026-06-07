import { Router } from 'express';
import { getProfile, updateProfile, createConnection, updateConnectionStatus } from '../controllers/userController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, connectionSchema } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/:id', getProfile);
router.put('/:id', updateProfile);

// Connection routes require an approved medical professional account
router.post('/connections', requireApprovedUser, validateBody(connectionSchema), createConnection);
router.put('/connections/:id', requireApprovedUser, updateConnectionStatus);

export default router;
