import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  getUpcomingEvents,
  getEventStats,
} from '../controllers/eventController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Event management (admin/principal/teacher)
router.post('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(createEvent))
router.get('/', asyncHandler(getEvents))
router.get('/upcoming', asyncHandler(getUpcomingEvents))
router.get('/:id', asyncHandler(getEventById))
router.put('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(updateEvent))
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(deleteEvent))
router.patch('/:id/publish', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(publishEvent))
router.patch('/:id/unpublish', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(unpublishEvent))
router.get('/:id/registrations', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getEventRegistrations))
router.get('/stats', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getEventStats))

// Event registration (all authenticated users)
router.post('/:id/register', asyncHandler(registerForEvent))
router.delete('/:id/register', asyncHandler(cancelRegistration))

export default router