import { Router } from 'express';
import { createGroup, getGroups, joinGroup, leaveGroup, getGroupFeed } from '../controllers/groupController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, groupSchema } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireApprovedUser, validateBody(groupSchema), createGroup);
router.get('/', getGroups);
router.post('/:id/join', requireApprovedUser, joinGroup);
router.post('/:id/leave', requireApprovedUser, leaveGroup);
router.get('/:id/feed', getGroupFeed);

export default router;
