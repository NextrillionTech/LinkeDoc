import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController';
import { validateBody, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

export default router;
