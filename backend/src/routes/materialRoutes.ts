import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  checkOutMaterial,
  checkInMaterial,
  getMaterialUsage,
  getMaterialStats,
  reportMaterialIssue,
  scheduleMaintenance,
} from '../controllers/materialController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Material management (admin/principal/teacher)
router.post('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(createMaterial))
router.get('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getMaterials))
router.get('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getMaterialById))
router.put('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(updateMaterial))
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(deleteMaterial))
router.get('/:id/usage', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getMaterialUsage))
router.get('/stats', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(getMaterialStats))
router.post('/:id/report-issue', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(reportMaterialIssue))
router.post('/:id/schedule-maintenance', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(scheduleMaintenance))

// Material usage (teacher)
router.post('/:id/checkout', authorize('TEACHER'), asyncHandler(checkOutMaterial))
router.post('/:id/checkin', authorize('TEACHER'), asyncHandler(checkInMaterial))

export default router