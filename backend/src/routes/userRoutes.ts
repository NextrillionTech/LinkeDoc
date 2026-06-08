import { Router } from 'express';
import { getProfile, updateProfile, createConnection, updateConnectionStatus, listUsers, getConnections } from '../controllers/userController';
import { registerPublicKey, getPublicKey } from '../controllers/messagingController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, connectionSchema, publicKeySchema } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

// Public Key Exchange routes (registered before dynamic ID routing to prevent parameter collision)
router.put('/public-key', requireApprovedUser, validateBody(publicKeySchema), registerPublicKey);
router.get('/:id/public-key', getPublicKey);

// User lists & Connections (must be registered before dynamic /:id parameter)
router.get('/connections', getConnections);
router.get('/', listUsers);

router.get('/:id', getProfile);
router.put('/:id', updateProfile);

// Connection routes require an approved medical professional account
router.post('/connections', requireApprovedUser, validateBody(connectionSchema), createConnection);
router.put('/connections/:id', requireApprovedUser, updateConnectionStatus);

export default router;
