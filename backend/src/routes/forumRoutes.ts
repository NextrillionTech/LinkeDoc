import { Router } from 'express';
import {
  getCategories,
  getCategoryThreads,
  getThreadDetails,
  createThread,
  createReply,
  reportContent,
} from '../controllers/forumController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import {
  validateBody,
  threadSchema,
  replySchema,
  reportSchema,
} from '../middleware/validation';

const router = Router();

// Public routes (authenticated but don't strictly require approved state for reading,
// though they require approval for posting/commenting)
router.get('/categories', getCategories);
router.get('/categories/:categoryId/threads', getCategoryThreads);
router.get('/threads/:id', getThreadDetails);

// Protected routes (require authenticated and approved medical professional)
router.post('/threads', authenticateJWT, requireApprovedUser, validateBody(threadSchema), createThread);
router.post('/replies', authenticateJWT, requireApprovedUser, validateBody(replySchema), createReply);

// Reporting route (requires authentication, allows user to report PII violations)
router.post('/report', authenticateJWT, validateBody(reportSchema), reportContent);

export default router;
