import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.validator';
import { loginLimiter } from '../middleware/rateLimiter';
import { bruteForceProtection } from '../middleware/security';

const router = Router();

router.post('/login', loginLimiter, bruteForceProtection, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

export default router;
