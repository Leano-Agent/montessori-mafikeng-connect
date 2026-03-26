import express from 'express'
import { authenticate } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  syncData,
  getSyncQueue,
  processSyncQueue,
  clearSyncQueue,
  getSyncStatus,
  forceSync,
  getConflicts,
  resolveConflict,
} from '../controllers/syncController'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Sync operations
router.post('/', asyncHandler(syncData))
router.get('/queue', asyncHandler(getSyncQueue))
router.post('/process', asyncHandler(processSyncQueue))
router.delete('/queue', asyncHandler(clearSyncQueue))
router.get('/status', asyncHandler(getSyncStatus))
router.post('/force', asyncHandler(forceSync))
router.get('/conflicts', asyncHandler(getConflicts))
router.post('/conflicts/:id/resolve', asyncHandler(resolveConflict))

export default router