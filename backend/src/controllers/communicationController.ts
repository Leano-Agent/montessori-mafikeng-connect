import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'

// Validation schemas
const sendMessageSchema = z.object({
  recipientId: z.string(),
  recipientType: z.enum(['INDIVIDUAL', 'CLASSROOM', 'SCHOOL', 'PARENT_GROUP']),
  messageType: z.enum(['ANNOUNCEMENT', 'MESSAGE', 'EMERGENCY', 'HOMEWORK', 'EVENT']).default('MESSAGE'),
  subject: z.string().max(200).optional(),
  messageText: z.string().min(1).max(5000),
  priority: z.number().int().min(1).max(3).default(1),
  requiresSmsFallback: z.boolean().default(false),
})

const updateMessageSchema = z.object({
  subject: z.string().max(200).optional(),
  messageText: z.string().min(1).max(5000).optional(),
  priority: z.number().int().min(1).max(3).optional(),
})

const announcementFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['ANNOUNCEMENT', 'EMERGENCY']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const scheduleMessageSchema = z.object({
  recipientId: z.string(),
  recipientType: z.enum(['INDIVIDUAL', 'CLASSROOM', 'SCHOOL', 'PARENT_GROUP']),
  messageType: z.enum(['ANNOUNCEMENT', 'MESSAGE', 'EMERGENCY', 'HOMEWORK', 'EVENT']).default('MESSAGE'),
  subject: z.string().max(200).optional(),
  messageText: z.string().min(1).max(5000),
  priority: z.number().int().min(1).max(3).default(1),
  requiresSmsFallback: z.boolean().default(false),
  scheduledFor: z.string().datetime(),
})

// ------------------- MESSAGES -------------------

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId
    if (!senderId) {
      throw new AppError('Not authenticated', 401)
    }
    
    const validatedData = sendMessageSchema.parse(req.body)
    
    const attachmentUrls = (req as any).files 
      ? ((req as any).files as Express.Multer.File[]).map(file => file.filename)
      : []
    
    // Verify recipient exists
    if (validatedData.recipientType === 'INDIVIDUAL') {
      const recipient = await prisma.user.findUnique({ where: { id: validatedData.recipientId } })
      if (!recipient) throw new AppError('Recipient not found', 404)
    } else if (validatedData.recipientType === 'CLASSROOM') {
      const classroom = await prisma.classroom.findUnique({ where: { id: validatedData.recipientId } })
      if (!classroom) throw new AppError('Classroom not found', 404)
    }
    
    const message = await prisma.communication.create({
      data: {
        senderId,
        recipientType: validatedData.recipientType,
        recipientId: validatedData.recipientType === 'SCHOOL' ? null : validatedData.recipientId,
        messageType: validatedData.messageType,
        subject: validatedData.subject,
        messageText: validatedData.messageText,
        attachments: attachmentUrls,
        priority: validatedData.priority,
        requiresSmsFallback: validatedData.requiresSmsFallback,
        sentAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    })
    
    res.status(201).json({ success: true, data: message })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400)
    }
    throw error
  }
}

// Get messages for a user (inbox)
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) throw new AppError('Not authenticated', 401)
    
    const { page = '1', limit = '20', type, unreadOnly } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    // Build where: messages addressed to this user OR classroom-wide OR school-wide
    const where: any = {
      messageType: 'MESSAGE' as const,
      OR: [
        { recipientType: 'INDIVIDUAL' as const, recipientId: userId },
        { recipientType: 'SCHOOL' as const },
      ],
    }
    
    // Also include classroom messages for teacher's classrooms
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, taughtClassrooms: { select: { id: true } } },
    })
    
    if (user) {
      if (user.role === 'TEACHER' || user.role === 'PRINCIPAL') {
        where.OR.push(
          ...user.taughtClassrooms.map((c: { id: string }) => ({
            recipientType: 'CLASSROOM' as const,
            recipientId: c.id,
          }))
        )
      }
    }
    
    if (type) where.messageType = type as string
    if (unreadOnly === 'true') {
      where.readReceiptCount = 0
    }
    
    const [messages, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.communication.count({ where }),
    ])
    
    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Get single message by ID
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) throw new AppError('Not authenticated', 401)
    
    const { id } = req.params
    
    const message = await prisma.communication.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
        },
      },
    })
    
    if (!message) throw new AppError('Message not found', 404)
    
    // Increment read receipt
    await prisma.communication.update({
      where: { id },
      data: { readReceiptCount: { increment: 1 } },
    })
    
    res.status(200).json({ success: true, data: message })
    
  } catch (error) {
    throw error
  }
}

// Update a message (sender only)
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) throw new AppError('Not authenticated', 401)
    
    const { id } = req.params
    const validatedData = updateMessageSchema.parse(req.body)
    
    const message = await prisma.communication.findUnique({ where: { id } })
    if (!message) throw new AppError('Message not found', 404)
    if (message.senderId !== userId) throw new AppError('Not authorized to update this message', 403)
    
    const updated = await prisma.communication.update({
      where: { id },
      data: validatedData,
    })
    
    res.status(200).json({ success: true, data: updated })
    
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError(error.errors[0].message, 400)
    throw error
  }
}

// Delete a message (sender only)
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) throw new AppError('Not authenticated', 401)
    
    const { id } = req.params
    
    const message = await prisma.communication.findUnique({ where: { id } })
    if (!message) throw new AppError('Message not found', 404)
    if (message.senderId !== userId) throw new AppError('Not authorized to delete this message', 403)
    
    await prisma.communication.delete({ where: { id } })
    
    res.status(200).json({ success: true, message: 'Message deleted successfully' })
    
  } catch (error) {
    throw error
  }
}

// ------------------- ANNOUNCEMENTS -------------------

// Send announcement
export const sendAnnouncement = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId
    if (!senderId) throw new AppError('Not authenticated', 401)
    
    const validatedData = sendMessageSchema.parse(req.body)
    
    const attachmentUrls = (req as any).files
      ? ((req as any).files as Express.Multer.File[]).map(file => file.filename)
      : []
    
    const announcement = await prisma.communication.create({
      data: {
        senderId,
        recipientType: validatedData.recipientType,
        recipientId: validatedData.recipientType === 'SCHOOL' ? null : validatedData.recipientId,
        messageType: 'ANNOUNCEMENT' as const,
        subject: validatedData.subject,
        messageText: validatedData.messageText,
        attachments: attachmentUrls,
        priority: validatedData.priority,
        requiresSmsFallback: validatedData.requiresSmsFallback,
        sentAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        classroomRecipient: {
          select: { id: true, name: true, ageRange: true },
        },
      },
    })
    
    res.status(201).json({ success: true, data: announcement })
    
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError(error.errors[0].message, 400)
    throw error
  }
}

// Get announcements
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) throw new AppError('Not authenticated', 401)
    
    const { page = '1', limit = '20', type, startDate, endDate } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    // Build where: school-wide announcements + classroom announcements
    const where: any = {
      messageType: type || { in: ['ANNOUNCEMENT' as const, 'EMERGENCY' as const, 'HOMEWORK' as const] },
      OR: [
        { recipientType: 'SCHOOL' as const },
        { recipientType: 'CLASSROOM' as const, recipientId: { not: null } },
        // Include classroom announcements for user's classrooms
        ...(await getParentClassroomIds(userId).then(classroomIds =>
          classroomIds.map(classroomId => ({
            recipientType: 'CLASSROOM' as const,
            recipientId: classroomId,
          }))
        )),
      ],
    }
    
    if (startDate || endDate) {
      where.sentAt = {}
      if (startDate) {
        where.sentAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.sentAt.lte = new Date(endDate as string)
      }
    }
    
    // Get announcements with pagination
    const [announcements, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
          classroomRecipient: {
            select: {
              id: true,
              name: true,
              ageRange: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take,
      }),
      prisma.communication.count({ where }),
    ])
    
    res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Get conversation between two users
export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { userId: otherUserId } = req.params
    const { page = 1, limit = 50 } = req.query
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    // Get conversation messages
    const where = {
      OR: [
        // Messages sent by current user to other user
        {
          senderId: userId,
          recipientType: 'INDIVIDUAL' as const,
          recipientId: otherUserId,
        },
        // Messages sent by other user to current user
        {
          senderId: otherUserId,
          recipientType: 'INDIVIDUAL' as const,
          recipientId: userId,
        },
      ],
    }
    
    const [messages, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take,
      }),
      prisma.communication.count({ where }),
    ])
    
    // Mark received messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.senderId === otherUserId && msg.readReceiptCount === 0)
      .map(msg => msg.id)
    
    if (unreadMessageIds.length > 0) {
      await prisma.communication.updateMany({
        where: {
          id: { in: unreadMessageIds },
        },
        data: {
          readReceiptCount: { increment: 1 },
        },
      })
    }
    
    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check if message exists and user is recipient
    const message = await prisma.communication.findUnique({
      where: { id },
    })
    
    if (!message) {
      throw new AppError('Message not found', 404)
    }
    
    if (message.recipientType !== 'INDIVIDUAL' || message.recipientId !== userId) {
      throw new AppError('Not authorized to mark this message as read', 403)
    }
    
    // Mark as read
    await prisma.communication.update({
      where: { id },
      data: {
        readReceiptCount: { increment: 1 },
      },
    })
    
    res.status(200).json({
      success: true,
      message: 'Message marked as read',
    })
    
  } catch (error) {
    throw error
  }
}

// Schedule message
export const scheduleMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId
    const validatedData = scheduleMessageSchema.parse(req.body)
    
    if (!senderId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Process uploaded files
    const attachments = (req as any).files
      ? ((req as any).files as Express.Multer.File[]).map(file => file.filename)
      : []
    
    const messageVoiceUrl = (req as any).files
      ? ((req as any).files as Express.Multer.File[])
          .find(file => file.mimetype.startsWith('audio/'))
          ?.filename
      : undefined
    
    // Create scheduled message
    const scheduledMessage = await prisma.communication.create({
      data: {
        senderId,
        recipientType: validatedData.recipientType,
        recipientId: validatedData.recipientType === 'SCHOOL' ? null : validatedData.recipientId,
        messageType: validatedData.messageType,
        subject: validatedData.subject,
        messageText: validatedData.messageText,
        priority: validatedData.priority,
        requiresSmsFallback: validatedData.requiresSmsFallback,
        attachments,
        messageVoiceUrl: messageVoiceUrl ? messageVoiceUrl : undefined,
        isScheduled: true,
        scheduledFor: new Date(validatedData.scheduledFor),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })
    
    // TODO: Schedule job to send message at scheduled time
    
    res.status(201).json({
      success: true,
      message: 'Message scheduled successfully',
      data: { message: scheduledMessage },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Cancel scheduled message
export const cancelScheduledMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const senderId = req.user?.userId
    
    if (!senderId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check if message exists, is scheduled, and belongs to sender
    const message = await prisma.communication.findUnique({
      where: { id },
    })
    
    if (!message) {
      throw new AppError('Message not found', 404)
    }
    
    if (!message.isScheduled) {
      throw new AppError('Message is not scheduled', 400)
    }
    
    if (message.senderId !== senderId) {
      throw new AppError('Not authorized to cancel this message', 403)
    }
    
    // Delete scheduled message
    await prisma.communication.delete({
      where: { id },
    })
    
    // TODO: Cancel scheduled job
    
    res.status(200).json({
      success: true,
      message: 'Scheduled message cancelled',
    })
    
  } catch (error) {
    throw error
  }
}

// Get message statistics
export const getMessageStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { startDate, endDate } = req.query
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Build where clause
    const where: any = {
      senderId: userId,
    }
    
    if (startDate || endDate) {
      where.sentAt = {}
      if (startDate) {
        where.sentAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.sentAt.lte = new Date(endDate as string)
      }
    }
    
    // Get statistics
    const [
      totalMessages,
      messagesByType,
      messagesByRecipientType,
      readRate,
      smsFallbackRate,
    ] = await Promise.all([
      // Total messages
      prisma.communication.count({ where }),
      
      // Messages by type
      prisma.communication.groupBy({
        by: ['messageType'],
        where,
        _count: true,
      }),
      
      // Messages by recipient type
      prisma.communication.groupBy({
        by: ['recipientType'],
        where,
        _count: true,
      }),
      
      // Read rate (for individual messages)
      prisma.communication.aggregate({
        where: {
          ...where,
          recipientType: 'INDIVIDUAL' as const,
        },
        _avg: {
          readReceiptCount: true,
        },
      }),
      
      // SMS fallback rate
      prisma.communication.count({
        where: {
          ...where,
          requiresSmsFallback: true,
        },
      }),
    ])
    
    // Format statistics
    const typeStats = messagesByType.map(stat => ({
      type: stat.messageType,
      count: stat._count,
      percentage: totalMessages > 0 ? (stat._count / totalMessages) * 100 : 0,
    }))
    
    const recipientStats = messagesByRecipientType.map(stat => ({
      recipientType: stat.recipientType,
      count: stat._count,
      percentage: totalMessages > 0 ? (stat._count / totalMessages) * 100 : 0,
    }))
    
    res.status(200).json({
      success: true,
      data: {
        totalMessages,
        typeStats,
        recipientStats,
        readRate: readRate._avg.readReceiptCount || 0,
        smsFallbackRate: totalMessages > 0 ? (smsFallbackRate / totalMessages) * 100 : 0,
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Helper function to get parent's classroom IDs
async function getParentClassroomIds(parentId: string): Promise<string[]> {
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { primaryParentId: parentId },
        { secondaryParentId: parentId },
      ],
    },
    select: { classroomId: true },
  })
  
  return students
    .map(student => student.classroomId)
    .filter((id): id is string => id !== null)
}

// Helper function to check if parent is in classroom
async function isParentInClassroom(parentId: string, classroomId: string): Promise<boolean> {
  const student = await prisma.student.findFirst({
    where: {
      classroomId,
      OR: [
        { primaryParentId: parentId },
        { secondaryParentId: parentId },
      ],
    },
  })
  
  return !!student
}