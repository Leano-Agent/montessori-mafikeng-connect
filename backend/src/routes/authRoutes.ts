import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { loginRateLimiter, strictRateLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────

// Registration: strict rate limit to prevent abuse
router.post('/register', strictRateLimiter, asyncHandler(register));

// Login: dedicated brute-force rate limiter (5 attempts / 15 min)
router.post('/login', loginRateLimiter, asyncHandler(login));

// Token refresh
router.post('/refresh-token', asyncHandler(refreshToken));

// Forgot password: strict rate limit to prevent enumeration/spam
router.post('/forgot-password', strictRateLimiter, asyncHandler(forgotPassword));

// Reset password: strict rate limit
router.post('/reset-password', strictRateLimiter, asyncHandler(resetPassword));

// ── Protected routes ───────────────────────────────────────────────

// Logout (requires auth so we know which tokens to invalidate)
router.post('/logout', authenticate, asyncHandler(logout));

// Current user profile
router.get('/me', authenticate, asyncHandler(getCurrentUser));

export default router;
