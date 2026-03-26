import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcryptjs'

// Validation schemas
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  languagePreference: z.enum(['SETSWANA', 'ENGLISH']).optional(),
  avatarUrl: z.string().url().optional(),
})

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  languagePreference: z.enum(['SETSWANA', 'ENGLISH']).optional(),
  avatarUrl: z.string().url().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
}).refine(data => {
  // If newPassword is provided, currentPassword must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: 'Current password is required when setting a new password',
  path: ['currentPassword'],
})

// Get all users (admin/principal only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    
    // Build where clause
    const where: any = {}
    
    if (role) {
      where.role = role
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ]
    }
    
    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          languagePreference: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ])
    
    res.status(200).json({
      success: true,
      data: {
        users,
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

// Get user by ID (admin/principal only)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Include relationships based on role
        taughtClassrooms: {
          select: {
            id: true,
            name: true,
            ageRange: true,
            currentEnrollment: true,
          },
        },
        assistedClassrooms: {
          select: {
            id: true,
            name: true,
            ageRange: true,
            currentEnrollment: true,
          },
        },
        primaryStudents: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
        secondaryStudents: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            classroom: {
              select: {
                id: true,
                name: true,
                ageRange: true,
              },
            },
          },
        },
      },
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    res.status(200).json({
      success: true,
      data: { user },
    })
    
  } catch (error) {
    throw error
  }
}

// Update user (admin/principal only)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateUserSchema.parse(req.body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!existingUser) {
      throw new AppError('User not found', 404)
    }
    
    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })
      
      if (emailExists) {
        throw new AppError('Email already in use', 400)
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        avatarUrl: true,
        isActive: true,
        updatedAt: true,
      },
    })
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Update user profile (user themselves)
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const validatedData = updateProfileSchema.parse(req.body)
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    // Handle password change if requested
    if (validatedData.newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(
        validatedData.currentPassword!,
        user.passwordHash
      )
      
      if (!isValidPassword) {
        throw new AppError('Current password is incorrect', 400)
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(validatedData.newPassword, salt)
      
      // Update with new password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...validatedData,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          languagePreference: true,
          avatarUrl: true,
          updatedAt: true,
        },
      })
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      })
    } else {
      // Update without password change
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          languagePreference: true,
          avatarUrl: true,
          updatedAt: true,
        },
      })
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      })
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Deactivate user (admin/principal only)
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    if (!user.isActive) {
      throw new AppError('User is already deactivated', 400)
    }
    
    // Deactivate user
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })
    
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    })
    
  } catch (error) {
    throw error
  }
}

// Activate user (admin/principal only)
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    if (user.isActive) {
      throw new AppError('User is already active', 400)
    }
    
    // Activate user
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    })
    
    res.status(200).json({
      success: true,
      message: 'User activated successfully',
    })
    
  } catch (error) {
    throw error
  }
}

// Get user's students (for teachers and parents)
export const getUserStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const userRole = req.user?.role
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    let students
    
    if (userRole === 'TEACHER') {
      // Get students from teacher's classrooms
      const classrooms = await prisma.classroom.findMany({
        where: {
          OR: [
            { teacherId: userId },
            { assistantTeacherId: userId },
          ],
        },
        include: {
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              enrollmentDate: true,
              photoUrl: true,
              isActive: true,
              classroom: {
                select: {
                  id: true,
                  name: true,
                  ageRange: true,
                },
              },
            },
            orderBy: { firstName: 'asc' },
          },
        },
      })
      
      // Flatten students from all classrooms
      students = classrooms.flatMap(classroom => classroom.students)
    } else if (userRole === 'PARENT') {
      // Get parent's children
      students = await prisma.student.findMany({
        where: {
          OR: [
            { primaryParentId: userId },
            { secondaryParentId: userId },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          enrollmentDate: true,
          photoUrl: true,
          isActive: true,
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
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { firstName: 'asc' },
      })
    } else {
      throw new AppError('Not authorized', 403)
    }
    
    res.status(200).json({
      success: true,
      data: { students },
    })
    
  } catch (error) {
    throw error
  }
}

// Get user's classrooms (for teachers)
export const getUserClassrooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    const classrooms = await prisma.classroom.findMany({
      where: {
        OR: [
          { teacherId: userId },
          { assistantTeacherId: userId },
        ],
      },
      select: {
        id: true,
        name: true,
        ageRange: true,
        capacity: true,
        currentEnrollment: true,
        roomNumber: true,
        isActive: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assistantTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            photoUrl: true,
          },
          orderBy: { firstName: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
    
    res.status(200).json({
      success: true,
      data: { classrooms },
    })
    
  } catch (error) {
    throw error
  }
}