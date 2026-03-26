import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  markAttendance,
  getAttendance,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
  getStudentAttendance,
  getClassroomAttendance,
  getAttendanceStats,
  exportAttendance,
} from '../controllers/attendanceController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Attendance marking (teacher/admin)
router.post('/', authorize('TEACHER', 'ADMIN'), asyncHandler(markAttendance))
router.get('/', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getAttendance))
router.get('/date/:date', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getAttendanceByDate))
router.get('/student/:studentId', authorize('TEACHER', 'ADMIN', 'PRINCIPAL', 'PARENT'), asyncHandler(getStudentAttendance))
router.get('/classroom/:classroomId', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getClassroomAttendance))
router.get('/stats', authorize('TEACHER', 'ADMIN', 'PRINCIPAL'), asyncHandler(getAttendanceStats))
router.get('/export', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(exportAttendance))

// Attendance management (teacher/admin)
router.put('/:id', authorize('TEACHER', 'ADMIN'), asyncHandler(updateAttendance))
router.delete('/:id', authorize('TEACHER', 'ADMIN'), asyncHandler(deleteAttendance))

export default router