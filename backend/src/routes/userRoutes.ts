import { Router } from 'express';
import { getProfile, updateProfile, createConnection, updateConnectionStatus } from '../controllers/userController';
import { registerPublicKey, getPublicKey } from '../controllers/messagingController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, connectionSchema, publicKeySchema } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

// Public Key Exchange routes (registered before dynamic ID routing to prevent parameter collision)
router.put('/public-key', requireApprovedUser, validateBody(publicKeySchema), registerPublicKey);
router.get('/:id/public-key', getPublicKey);

router.get('/:id', getProfile);
router.put('/:id', updateProfile);

// Connection routes require an approved medical professional account
router.post('/connections', requireApprovedUser, validateBody(connectionSchema), createConnection);
router.put('/connections/:id', requireApprovedUser, updateConnectionStatus);

export default router;
