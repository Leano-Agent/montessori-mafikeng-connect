import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'

// Validation schemas
const createStudentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string().datetime(),
  gender: z.string().optional(),
  enrollmentDate: z.string().datetime().default(new Date().toISOString()),
  classroomId: z.string().uuid().optional(),
  primaryParentId: z.string().uuid().optional(),
  secondaryParentId: z.string().uuid().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalNotes: z.string().optional(),
  photoUrl: z.string().url().optional(),
})

const updateStudentSchema = createStudentSchema.partial()

// Get students with filters
export const getStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const userRole = req.user?.role
    const {
      classroomId,
      search,
      activeOnly = 'true',
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
    
    if (classroomId) {
      where.classroomId = classroomId as string
    }
    
    if (activeOnly === 'true') {
      where.isActive = true
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ]
    }
    
    // For teachers, only show students in their classrooms
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
      where.classroomId = { in: classroomIds }
    }
    
    // For parents, only show their children
    if (userRole === 'PARENT') {
      where.OR = [
        { primaryParentId: userId },
        { secondaryParentId: userId },
      ]
    }
    
    // Get students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
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
        orderBy: { firstName: 'asc' },
        skip,
        take,
      }),
      prisma.student.count({ where }),
    ])
    
    res.status(200).json({
      success: true,
      data: {
        students,
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

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const userRole = req.user?.role
    
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            assistantTeacher: {
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
    })
    
    if (!student) {
      throw new AppError('Student not found', 404)
    }
    
    // Check authorization
    let isAuthorized = false
    
    if (userRole === 'ADMIN' || userRole === 'PRINCIPAL') {
      isAuthorized = true
    } else if (userRole === 'TEACHER') {
      const isTeacherOfStudent = 
        student.classroom?.teacherId === userId ||
        student.classroom?.assistantTeacherId === userId
      isAuthorized = isTeacherOfStudent
    } else if (userRole === 'PARENT') {
      const isParentOfStudent = 
        student.primaryParentId === userId ||
        student.secondaryParentId === userId
      isAuthorized = isParentOfStudent
    }
    
    if (!isAuthorized) {
      throw new AppError('Not authorized to view this student', 403)
    }
    
    res.status(200).json({
      success: true,
      data: { student },
    })
    
  } catch (error) {
    throw error
  }
}

// Create student
export const createStudent = async (req: Request, res: Response) => {
  try {
    const validatedData = createStudentSchema.parse(req.body)
    
    // Create student
    const student = await prisma.student.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        enrollmentDate: new Date(validatedData.enrollmentDate),
        gender: validatedData.gender,
        classroomId: validatedData.classroomId,
        primaryParentId: validatedData.primaryParentId,
        secondaryParentId: validatedData.secondaryParentId,
        emergencyContactName: validatedData.emergencyContactName,
        emergencyContactPhone: validatedData.emergencyContactPhone,
        medicalNotes: validatedData.medicalNotes,
        photoUrl: validatedData.photoUrl,
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
        primaryParent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        secondaryParent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
    
    // Update classroom enrollment count if classroom assigned
    if (student.classroomId) {
      await prisma.classroom.update({
        where: { id: student.classroomId },
        data: {
          currentEnrollment: { increment: 1 },
        },
      })
    }
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateStudentSchema.parse(req.body)
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    })
    
    if (!existingStudent) {
      throw new AppError('Student not found', 404)
    }
    
    // Handle classroom change
    let oldClassroomId = existingStudent.classroomId
    let newClassroomId = validatedData.classroomId
    
    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        enrollmentDate: validatedData.enrollmentDate ? new Date(validatedData.enrollmentDate) : undefined,
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
      },
    })
    
    // Update classroom enrollment counts if classroom changed
    if (oldClassroomId !== newClassroomId) {
      // Decrement old classroom
      if (oldClassroomId) {
        await prisma.classroom.update({
          where: { id: oldClassroomId },
          data: {
            currentEnrollment: { decrement: 1 },
          },
        })
      }
      
      // Increment new classroom
      if (newClassroomId) {
        await prisma.classroom.update({
          where: { id: newClassroomId },
          data: {
            currentEnrollment: { increment: 1 },
          },
        })
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: { student: updatedStudent },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Delete student (soft delete)
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    })
    
    if (!student) {
      throw new AppError('Student not found', 404)
    }
    
    if (!student.isActive) {
      throw new AppError('Student is already deactivated', 400)
    }
    
    // Soft delete student
    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    })
    
    // Decrement classroom enrollment
    if (student.classroomId) {
      await prisma.classroom.update({
        where: { id: student.classroomId },
        data: {
          currentEnrollment: { decrement: 1 },
        },
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Student deactivated successfully',
    })
    
  } catch (error) {
    throw error
  }
}

// Get student progress
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Get student observations with statistics
    const [observations, observationStats] = await Promise.all([
      prisma.montessoriObservation.findMany({
        where: { studentId: id },
        select: {
          id: true,
          area: true,
          milestoneAchieved: true,
          concentrationLevel: true,
          workCycleDuration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.montessoriObservation.groupBy({
        by: ['area'],
        where: { studentId: id },
        _count: true,
        _avg: {
          concentrationLevel: true,
          workCycleDuration: true,
        },
      }),
    ])
    
    // Calculate progress by area
    const areaProgress = observationStats.map(stat => ({
      area: stat.area,
      observationCount: stat._count,
      averageConcentration: stat._avg.concentrationLevel,
      averageWorkCycleDuration: stat._avg.workCycleDuration,
    }))
    
    // Get milestones achieved
    const milestones = await prisma.montessoriObservation.findMany({
      where: {
        studentId: id,
        milestoneAchieved: true,
      },
      select: {
        id: true,
        area: true,
        milestoneDescription: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    res.status(200).json({
      success: true,
      data: {
        observations,
        areaProgress,
        milestones,
        totalObservations: observations.length,
        milestonesAchieved: milestones.length,
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Assign student to classroom
export const assignStudentToClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { classroomId } = req.body
    
    if (!classroomId) {
      throw new AppError('Classroom ID required', 400)
    }
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    })
    
    if (!student) {
      throw new AppError('Student not found', 404)
    }
    
    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    })
    
    if (!classroom) {
      throw new AppError('Classroom not found', 404)
    }
    
    // Check classroom capacity
    if (classroom.currentEnrollment >= classroom.capacity) {
      throw new AppError('Classroom is at full capacity', 400)
    }
    
    let oldClassroomId = student.classroomId
    
    // Update student classroom
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { classroomId },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
      },
    })
    
    // Update classroom enrollment counts
    if (oldClassroomId) {
      await prisma.classroom.update({
        where: { id: oldClassroomId },
        data: {
          currentEnrollment: { decrement: 1 },
        },
      })
    }
    
    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        currentEnrollment: { increment: 1 },
      },
    })
    
    res.status(200).json({
      success: true,
      message: 'Student assigned to classroom successfully',
      data: { student: updatedStudent },
    })
    
  } catch (error) {
    throw error
  }
}

// Transfer student (with additional logic)
export const transferStudent = async (req: Request, res: Response) => {
  // Similar to assignStudentToClassroom but with additional transfer logic
  return await assignStudentToClassroom(req, res)
}

// Get student attendance
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query
    
    // Build where clause
    const where: any = { studentId: id }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string)
      }
    }
    
    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
    })
    
    // Calculate attendance statistics
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'PRESENT').length
    const absentDays = attendance.filter(a => a.status === 'ABSENT').length
    const lateDays = attendance.filter(a => a.status === 'LATE').length
    
    res.status(200).json({
      success: true,
      data: {
        attendance,
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
        },
      },
    })
    
  } catch (error) {
    throw error
  }
}

// Get student observations
export const getStudentObservations = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    const [observations, total] = await Promise.all([
      prisma.montessoriObservation.findMany({
        where: { studentId: id },
        include: {
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
      prisma.montessoriObservation.count({ where: { studentId: id } }),
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