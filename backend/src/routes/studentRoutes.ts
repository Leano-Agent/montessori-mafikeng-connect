import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress,
  assignStudentToClassroom,
  transferStudent,
  getStudentAttendance,
  getStudentObservations,
} from '../controllers/studentController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get students (admin/principal/teacher)
router.get('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getStudents))
router.get('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'), asyncHandler(getStudentById))
router.get('/:id/progress', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'), asyncHandler(getStudentProgress))
router.get('/:id/attendance', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'), asyncHandler(getStudentAttendance))
router.get('/:id/observations', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'), asyncHandler(getStudentObservations))

// Student management (admin/principal only)
router.post('/', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(createStudent))
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(updateStudent))
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(deleteStudent))
router.patch('/:id/assign-classroom', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(assignStudentToClassroom))
router.patch('/:id/transfer', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(transferStudent))

export default router