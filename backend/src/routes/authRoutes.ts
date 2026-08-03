import { Router } from 'express';
import {
  registerAccount,
  loginToAccount,
  authInfo,
  logout,
  generateTwoFactorQR,
  disableTwoFactor,
  verifyTwoFactorCode,
  loginWithTotp,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authControllers';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerAccount);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', loginToAccount);
router.get('/info', authenticateUser, authInfo);
router.post('/logout', authenticateUser, logout);
router.get('/2fa/setup', authenticateUser, generateTwoFactorQR);
router.post('/2fa/verify', authenticateUser, verifyTwoFactorCode);
router.post('/2fa/disable', authenticateUser, disableTwoFactor);
router.post('/2fa/login', loginWithTotp);

export default router;
