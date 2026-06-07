import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;
