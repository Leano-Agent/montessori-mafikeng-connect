import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  deleteObservation,
  getStudentObservations,
  getClassroomObservations,
  getObservationsByArea,
  getObservationStats,
} from '../controllers/observationController'
import { upload } from '../middlewares/uploadMiddleware'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Teacher-only routes
router.post('/', authorize('TEACHER'), upload.array('photos', 5), asyncHandler(createObservation))
router.get('/', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getObservations))
router.get('/stats', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getObservationStats))
router.get('/student/:studentId', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getStudentObservations))
router.get('/classroom/:classroomId', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getClassroomObservations))
router.get('/area/:area', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getObservationsByArea))
router.get('/:id', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getObservationById))
router.put('/:id', authorize('TEACHER'), upload.array('photos', 5), asyncHandler(updateObservation))
router.delete('/:id', authorize('TEACHER'), asyncHandler(deleteObservation))

// Parent routes (read-only access to their children's observations)
router.get('/my-children', authorize('PARENT'), asyncHandler(getStudentObservations))

export default router