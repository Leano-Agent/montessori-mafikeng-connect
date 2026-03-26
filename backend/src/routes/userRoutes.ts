import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserProfile,
  deactivateUser,
  activateUser,
  getUserStudents,
  getUserClassrooms,
} from '../controllers/userController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Admin-only routes
router.get('/', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(getUsers))
router.get('/:id', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(getUserById))
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(updateUser))
router.patch('/:id/deactivate', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(deactivateUser))
router.patch('/:id/activate', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(activateUser))

// User profile routes (accessible by user themselves)
router.put('/profile/me', asyncHandler(updateUserProfile))

// Teacher-specific routes
router.get('/me/students', authorize('TEACHER'), asyncHandler(getUserStudents))
router.get('/me/classrooms', authorize('TEACHER'), asyncHandler(getUserClassrooms))

// Parent-specific routes
router.get('/me/children', authorize('PARENT'), asyncHandler(getUserStudents))

export default router