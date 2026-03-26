import express from 'express'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { asyncHandler } from '../middlewares/errorMiddleware'
import {
  sendMessage,
  getMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  sendAnnouncement,
  getAnnouncements,
  getConversation,
  markAsRead,
  scheduleMessage,
  cancelScheduledMessage,
  getMessageStats,
} from '../controllers/communicationController'
import { upload } from '../middlewares/uploadMiddleware'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Message routes
router.post('/messages', upload.array('attachments', 5), asyncHandler(sendMessage))
router.get('/messages', asyncHandler(getMessages))
router.get('/messages/conversation/:userId', asyncHandler(getConversation))
router.get('/messages/:id', asyncHandler(getMessageById))
router.put('/messages/:id', upload.array('attachments', 5), asyncHandler(updateMessage))
router.delete('/messages/:id', asyncHandler(deleteMessage))
router.patch('/messages/:id/read', asyncHandler(markAsRead))

// Announcement routes (admin/principal/teacher only)
router.post('/announcements', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), upload.array('attachments', 5), asyncHandler(sendAnnouncement))
router.get('/announcements', asyncHandler(getAnnouncements))

// Scheduled message routes
router.post('/schedule', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), upload.array('attachments', 5), asyncHandler(scheduleMessage))
router.delete('/schedule/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), asyncHandler(cancelScheduledMessage))

// Stats route (admin/principal only)
router.get('/stats', authorize('ADMIN', 'PRINCIPAL'), asyncHandler(getMessageStats))

export default router