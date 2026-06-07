import { Router } from 'express';
import {
  createConversation,
  getConversations,
  createMessage,
  getMessages,
  pusherAuth,
} from '../controllers/messagingController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, conversationCreateSchema, messageSendSchema } from '../middleware/validation';

const router = Router();

// Apply JWT authentication and APPROVED status checks to all messaging endpoints
router.use(authenticateJWT);
router.use(requireApprovedUser);

router.post('/', validateBody(conversationCreateSchema), createConversation);
router.get('/', getConversations);
router.post('/pusher/auth', pusherAuth);
router.post('/:id/messages', validateBody(messageSendSchema), createMessage);
router.get('/:id/messages', getMessages);

export default router;
