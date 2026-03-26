import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'
import { getFileUrl } from '../middlewares/uploadMiddleware'

// Validation schemas
const createObservationSchema = z.object({
  studentId: z.string().uuid(),
  area: z.enum(['PRACTICAL_LIFE', 'SENSORIAL', 'LANGUAGE', 'MATHEMATICS', 'CULTURE', 'ART', 'MUSIC']),
  subArea: z.string().optional(),
  observationText: z.string().min(10).max(2000),
  milestoneAchieved: z.boolean().default(false),
  milestoneDescription: z.string().optional(),
  workCycleDuration: z.number().int().min(1).max(180).optional(), // Minutes
  concentrationLevel: z.number().int().min(1).max(5).default(3),
  materialsUsed: z.array(z.string()).default([]),
})

const updateObservationSchema = createObservationSchema.partial()

// Create observation
export const createObservation = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.userId
    const validatedData = createObservationSchema.parse(req.body)
    
    if (!teacherId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check if student exists and belongs to teacher's classroom
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        classroom: {
          include: {
            teacher: true,
            assistantTeacher: true,
          },
        },
      },
    })
    
    if (!student) {
      throw new AppError('Student not found', 404)
    }
    
    // Verify teacher has access to this student
    const isTeacherOfStudent = 
      student.classroom?.teacherId === teacherId ||
      student.classroom?.assistantTeacherId === teacherId
    
    if (!isTeacherOfStudent) {
      throw new AppError('Not authorized to create observations for this student', 403)
    }
    
    // Process uploaded files
    const photos = req.files
      ? (req.files as Express.Multer.File[])
          .filter(file => file.mimetype.startsWith('image/'))
          .map(file => getFileUrl(file.filename))
      : []
    
    const observationVoiceUrl = req.files
      ? (req.files as Express.Multer.File[])
          .find(file => file.mimetype.startsWith('audio/'))
          ?.filename
      : undefined
    
    // Create observation
    const observation = await prisma.montessoriObservation.create({
      data: {
        ...validatedData,
        teacherId,
        photos,
        observationVoiceUrl: observationVoiceUrl ? getFileUrl(observationVoiceUrl) : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
    
    // Emit WebSocket event for real-time updates
    const io = req.app.get('io')
    if (io) {
      // Notify parent if available
      if (student.primaryParentId) {
        io.to(`user:${student.primaryParentId}`).emit('observation:created', {
          observation,
          student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          },
        })
      }
      
      // Notify classroom
      if (student.classroomId) {
        io.to(`classroom:${student.classroomId}`).emit('observation:created', {
          observation,
          student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          },
        })
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Observation created successfully',
      data: { observation },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Get observations with filters
export const getObservations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const userRole = req.user?.role
    const {
      studentId,
      classroomId,
      area,
      startDate,
      endDate,
      milestone,
      page = 1,
      limit = 20,
    } = req.query
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    // Build where clause
    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId as string
    }
    
    if (classroomId) {
      where.student = {
        classroomId: classroomId as string,
      }
    }
    
    if (area) {
      where.area = area
    }
    
    if (milestone !== undefined) {
      where.milestoneAchieved = milestone === 'true'
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }
    
    // For teachers, only show observations they created or for their students
    if (userRole === 'TEACHER') {
      const teacherClassrooms = await prisma.classroom.findMany({
        where: {
          OR: [
            { teacherId: userId },
            { assistantTeacherId: userId },
          ],
        },
        select: { id: true },
      })
      
      const classroomIds = teacherClassrooms.map(c => c.id)
      
      where.OR = [
        { teacherId: userId },
        {
          student: {
            classroomId: { in: classroomIds },
          },
        },
      ]
    }
    
    // For parents, only show observations for their children
    if (userRole === 'PARENT') {
      const children = await prisma.student.findMany({
        where: {
          OR: [
            { primaryParentId: userId },
            { secondaryParentId: userId },
          ],
        },
        select: { id: true },
      })
      
      const childIds = children.map(c => c.id)
      where.studentId = { in: childIds }
    }
    
    // Get observations with pagination
    const [observations, total] = await Promise.all([
      prisma.montessoriObservation.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              classroom: {
                select: {
                  id: true,
                  name: true,
                  ageRange: true,
                },
              },
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.montessoriObservation.count({ where }),
    ])
    
    res.status(200).json({
      success: true,
      data: {
        observations,
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

// Get observation by ID
export const getObservationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const userRole = req.user?.role
    
    const observation = await prisma.montessoriObservation.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                assistantTeacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            primaryParent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            secondaryParent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        teacher: {
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
    
    if (!observation) {
      throw new AppError('Observation not found', 404)
    }
    
    // Check authorization
    if (userRole === 'TEACHER') {
      // Teachers can only view observations they created or for their students
      if (observation.teacherId !== userId) {
        const teacherClassrooms = await prisma.classroom.findMany({
          where: {
            OR: [
              { teacherId: userId },
              { assistantTeacherId: userId },
            ],
          },
          select: { id: true },
        })
        
        const classroomIds = teacherClassrooms.map(c => c.id)
        const isStudentInTeacherClassroom = classroomIds.includes(observation.student.classroomId || '')
        
        if (!isStudentInTeacherClassroom) {
          throw new AppError('Not authorized to view this observation', 403)
        }
      }
    } else if (userRole === 'PARENT') {
      // Parents can only view observations for their children
      const isParentOfStudent = 
        observation.student.primaryParentId === userId ||
        observation.student.secondaryParentId === userId
      
      if (!isParentOfStudent) {
        throw new AppError('Not authorized to view this observation', 403)
      }
    }
    // Admin and Principal can view all observations
    
    res.status(200).json({
      success: true,
      data: { observation },
    })
    
  } catch (error) {
    throw error
  }
}

// Update observation
export const updateObservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const teacherId = req.user?.userId
    const validatedData = updateObservationSchema.parse(req.body)
    
    if (!teacherId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check if observation exists and belongs to teacher
    const existingObservation = await prisma.montessoriObservation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            classroom: true,
          },
        },
      },
    })
    
    if (!existingObservation) {
      throw new AppError('Observation not found', 404)
    }
    
    if (existingObservation.teacherId !== teacherId) {
      throw new AppError('Not authorized to update this observation', 403)
    }
    
    // Process uploaded files
    const newPhotos = req.files
      ? (req.files as Express.Multer.File[])
          .filter(file => file.mimetype.startsWith('image/'))
          .map(file => getFileUrl(file.filename))
      : []
    
    const newObservationVoiceUrl = req.files
      ? (req.files as Express.Multer.File[])
          .find(file => file.mimetype.startsWith('audio/'))
          ?.filename
      : undefined
    
    // Combine existing photos with new ones
    const photos = [...existingObservation.photos, ...newPhotos]
    
    // Update observation
    const updatedObservation = await prisma.montessoriObservation.update({
      where: { id },
      data: {
        ...validatedData,
        photos,
        observationVoiceUrl: newObservationVoiceUrl 
          ? getFileUrl(newObservationVoiceUrl)
          : existingObservation.observationVoiceUrl,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
    
    res.status(200).json({
      success: true,
      message: 'Observation updated successfully',
      data: { observation: updatedObservation },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Delete observation
export const deleteObservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const teacherId = req.user?.userId
    
    if (!teacherId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check if observation exists and belongs to teacher
    const observation = await prisma.montessoriObservation.findUnique({
      where: { id },
    })
    
    if (!observation) {
      throw new AppError('Observation not found', 404)
    }
    
    if (observation.teacherId !== teacherId) {
      throw new AppError('Not authorized to delete this observation', 403)
    }
    
    // Delete observation
    await prisma.montessoriObservation.delete({
      where: { id },
    })
    
    res.status(200).json({
      success: true,
      message: 'Observation deleted successfully',
    })
    
  } catch (error) {
    throw error
  }
}

// Get student observations
export const getStudentObservations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const userRole = req.user?.role
    const studentId = req.params.studentId || (req.path.includes('my-children') ? undefined : req.query.studentId)
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // For parent accessing "my-children" route
    if (req.path.includes('my-children') && userRole === 'PARENT') {
      const children = await prisma.student.findMany({
        where: {
          OR: [
            { primaryParentId: userId },
            { secondaryParentId: userId },
          ],
        },
        select: { id: true },
      })
      
      const childIds = children.map(c => c.id)
      
      const observations = await prisma.montessoriObservation.findMany({
        where: {
          studentId: { in: childIds },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              classroom: {
                select: {
                  id: true,
                  name: true,
                  ageRange: true,
                },
              },
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit for parent view
      })
      
      return res.status(200).json({
        success: true,
        data: { observations },
      })
    }
    
    // For specific student ID
    if (!studentId) {
      throw new AppError('Student ID required', 400)
    }
    
    // Check authorization
    if (userRole === 'TEACHER') {
      const student = await prisma.student.findUnique({
        where: { id: studentId as string },
        include: {
          classroom: {
            include: {
              teacher: true,
              assistantTeacher: true,
            },
          },
        },
      })
      
      if (!student) {
        throw new AppError('Student not found', 404)
      }
      
      const isTeacherOfStudent = 
        student.classroom?.teacherId === userId ||
        student.classroom?.assistantTeacherId === userId
      
      if (!isTeacherOfStudent) {
        throw new AppError('Not authorized to view observations for this student', 403)
      }
    } else if (userRole === 'PARENT') {
      const student = await prisma.student.findUnique({
        where: { id: studentId as string },
      })
      
      if (!student) {
        throw new AppError('Student not found', 404)
      }
      
      const isParentOfStudent = 
        student.primaryParentId === userId ||
        student.secondaryParentId === userId
      
      if (!isParentOfStudent) {
        throw new AppError('Not authorized to view observations for this student', 403)
      }
    }
    
    const observations = await prisma.montessoriObservation.findMany({
      where: { studentId: studentId as string },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    res.status(200).json({
      success: true,
      data: { observations },
    })
    
  } catch (error) {
    throw error
  }
}

// Get classroom observations
export const getClassroomObservations = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params
    const userId = req.user?.userId
    const userRole = req.user?.role
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Check authorization
    if (userRole === 'TEACHER') {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      })
      
      if (!classroom) {
        throw new AppError('Classroom not found', 404)
      }
      
      const isTeacherOfClassroom = 
        classroom.teacherId === userId ||
        classroom.assistantTeacherId === userId
      
      if (!isTeacherOfClassroom) {
        throw new AppError('Not authorized to view observations for this classroom', 403)
      }
    }
    
    const observations = await prisma.montessoriObservation.findMany({
      where: {
        student: {
          classroomId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for classroom view
    })
    
    res.status(200).json({
      success: true,
      data: { observations },
    })
    
  } catch (error) {
    throw error
  }
}

// Get observations by area
export const getObservationsByArea = async (req: Request, res: Response) => {
  try {
    const { area } = req.params
    const userId = req.user?.userId
    const userRole = req.user?.role
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Build where clause
    const where: any = { area }
    
    // For teachers, only show observations they created or for their students
    if (userRole === 'TEACHER') {
      const teacherClassrooms = await prisma.classroom.findMany({
        where: {
          OR: [
            { teacherId: userId },
            { assistantTeacherId: userId },
          ],
        },
        select: { id: true },
      })
      
      const classroomIds = teacherClassrooms.map(c => c.id)
      
      where.OR = [
        { teacherId: userId },
        {
          student: {
            classroomId: { in: classroomIds },
          },
        },
      ]
    }
    
    // For parents, only show observations for their children
    if (userRole === 'PARENT') {
      const children = await prisma.student.findMany({
        where: {
          OR: [
            { primaryParentId: userId },
            { secondaryParentId: userId },
          ],
        },
        select: { id: true },
      })
      
      const childIds = children.map(c => c.id)
      where.studentId = { in: childIds }
    }
    
    const observations = await prisma.montessoriObservation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    res.status(200).json({
      success: true,
      data: { observations },
    })
    
  } catch (error) {
    throw error
  }
}

// Get observation statistics
export const getObservationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const userRole = req.user?.role
    const { startDate, endDate } = req.query
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Build where clause
    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }
    
    // For teachers, only show stats for their observations
    if (userRole === 'TEACHER') {
      where.teacherId = userId
    }
    
    // For parents, only show stats for their children
    if (userRole === 'PARENT') {
      const children = await prisma.student.findMany({
        where: {
          OR: [
            { primaryParentId: userId },
            { secondaryParentId: userId },
          ],
        },
        select: { id: true },
      })
      
      const childIds = children.map(c => c.id)
      where.studentId = { in: childIds }
    }
    
    // Get statistics
    const [
      totalObservations,
      observationsByArea,
      milestonesAchieved,
      averageConcentration,
      recentObservations,
    ] = await Promise.all([
      // Total observations
      prisma.montessoriObservation.count({ where }),
      
      // Observations by area
      prisma.montessoriObservation.groupBy({
        by: ['area'],
        where,
        _count: true,
      }),
      
      // Milestones achieved
      prisma.montessoriObservation.count({
        where: {
          ...where,
          milestoneAchieved: true,
        },
      }),
      
      // Average concentration level
      prisma.montessoriObservation.aggregate({
        where,
        _avg: {
          concentrationLevel: true,
        },
      }),
      
      // Recent observations (last 7 days)
      prisma.montessoriObservation.findMany({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          area: true,
          milestoneAchieved: true,
          concentrationLevel: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])
    
    // Format area statistics
    const areaStats = observationsByArea.map(stat => ({
      area: stat.area,
      count: stat._count,
      percentage: totalObservations > 0 ? (stat._count / totalObservations) * 100 : 0,
    }))
    
    // Calculate daily trend (last 7 days)
    const dailyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dailyCount = await prisma.montessoriObservation.count({
        where: {
          ...where,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      })
      
      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        count: dailyCount,
      })
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalObservations,
        milestonesAchieved,
        milestonePercentage: totalObservations > 0 ? (milestonesAchieved / totalObservations) * 100 : 0,
        averageConcentration: averageConcentration._avg.concentrationLevel || 0,
        areaStats,
        dailyTrend,
        recentObservations,
      },
    })
    
  } catch (error) {
    throw error
  }
}
