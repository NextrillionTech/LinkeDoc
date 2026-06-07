import { Router } from 'express';
import { getPendingUsers, verifyUser } from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Apply auth protection & admin authorization to all admin endpoints
router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN'));

router.get('/users/pending', getPendingUsers);
router.put('/users/:id/verify', verifyUser);

export default router;
