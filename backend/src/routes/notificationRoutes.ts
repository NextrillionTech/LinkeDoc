import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
