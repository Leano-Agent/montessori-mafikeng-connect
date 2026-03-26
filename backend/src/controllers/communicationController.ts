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
          recipientType: 'INDIVIDUAL',
          recipientId: otherUserId,
        },
        // Messages sent by other user to current user
        {
          senderId: otherUserId,
          recipientType: 'INDIVIDUAL',
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
    const attachments = req.files
      ? (req.files as Express.Multer.File[]).map(file => getFileUrl(file.filename))
      : []
    
    const messageVoiceUrl = req.files
      ? (req.files as Express.Multer.File[])
          .find(file => file.mimetype.startsWith('audio/'))
          ?.filename
      : undefined
    
    // Create scheduled message
    const scheduledMessage = await prisma.communication.create({
      data: {
        ...validatedData,
        senderId,
        attachments,
        messageVoiceUrl: messageVoiceUrl ? getFileUrl(messageVoiceUrl) : undefined,
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
          recipientType: 'INDIVIDUAL',
        },
        _avg: {
          readReceiptCount: true,
        },
      }),
      
      // SMS fallback rate
      prisma.communication.aggregate({
        where,
        _avg: {
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
        smsFallbackRate: (smsFallbackRate._avg.requiresSmsFallback || 0) * 100,
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