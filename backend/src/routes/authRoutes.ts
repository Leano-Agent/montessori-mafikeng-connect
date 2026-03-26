import express from 'express'
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController'
import { authenticate } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'

const router = express.Router()

// Public routes
router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/refresh-token', asyncHandler(refreshToken))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.post('/reset-password', asyncHandler(resetPassword))

// Protected routes
router.post('/logout', authenticate, asyncHandler(logout))
router.get('/me', authenticate, asyncHandler(getCurrentUser))

export default router