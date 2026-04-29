import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'
import { redisClient } from '../services/redis'
import { sendSMS } from '../services/sms'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['TEACHER', 'PARENT', 'ADMIN', 'PRINCIPAL']),
  languagePreference: z.enum(['SETSWANA', 'ENGLISH']).default('SETSWANA'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

// Generate JWT tokens
const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  
  return { accessToken, refreshToken }
}

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 400)
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(validatedData.password, salt)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName || '',
        lastName: validatedData.lastName || '',
        passwordHash,
        role: validatedData.role || 'PARENT',
        phone: validatedData.phone || '',
        languagePreference: validatedData.languagePreference || 'SETSWANA',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        createdAt: true,
      }
    })
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role)
    
    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60 // 7 days
    })
    
    // Set cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Send welcome SMS if phone provided
    if (validatedData.phone) {
      try {
        const welcomeMessage = user.languagePreference === 'SETSWANA'
          ? `Re a go amogela ho Montessori Mafikeng Connect! Email: ${user.email}`
          : `Welcome to Montessori Mafikeng Connect! Email: ${user.email}`
        
        await sendSMS(validatedData.phone, welcomeMessage)
      } catch (smsError) {
        console.error('Failed to send welcome SMS:', smsError)
        // Don't fail registration if SMS fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken,
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        isActive: true,
      }
    })
    
    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }
    
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403)
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash)
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401)
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role)
    
    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60 // 7 days
    })
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Set cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken
    
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401)
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string
      role: string
    }
    
    // Check if refresh token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`)
    
    if (storedToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401)
    }
    
    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId,
      decoded.role
    )
    
    // Update refresh token in Redis
    await redisClient.set(`refresh_token:${decoded.userId}`, newRefreshToken, {
      EX: 7 * 24 * 60 * 60 // 7 days
    })
    
    // Set cookies
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })
    
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    })
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401)
    }
    throw error
  }
}

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
          userId: string
        }
        
        // Remove refresh token from Redis
        await redisClient.del(`refresh_token:${decoded.userId}`)
      } catch (error) {
        // Token might be expired, continue with logout
      }
    }
    
    // Clear cookies
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    throw error
  }
}

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, phone: true, firstName: true }
    })
    
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset link'
      })
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_RESET_SECRET!,
      { expiresIn: '1h' }
    )
    
    // Store reset token in Redis
    await redisClient.set(`reset_token:${resetToken}`, user.id, {
      EX: 60 * 60 // 1 hour
    })
    
    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    
    // TODO: Send email with reset link
    console.log(`Password reset link for ${user.email}: ${resetLink}`)
    
    // Send SMS if phone exists
    if (user.phone) {
      try {
        const smsMessage = `Montessori Mafikeng Connect: Password reset link sent to your email. Check your email to reset your password.`
        await sendSMS(user.phone, smsMessage)
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError)
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link'
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body)
    
    // Verify reset token
    const decoded = jwt.verify(validatedData.token, process.env.JWT_RESET_SECRET!) as {
      userId: string
    }
    
    // Check if reset token exists in Redis
    const userId = await redisClient.get(`reset_token:${validatedData.token}`)
    
    if (!userId || userId !== decoded.userId) {
      throw new AppError('Invalid or expired reset token', 401)
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(validatedData.password, salt)
    
    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })
    
    // Remove reset token from Redis
    await redisClient.del(`reset_token:${validatedData.token}`)
    
    // Invalidate all refresh tokens for this user
    await redisClient.del(`refresh_token:${userId}`)
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    })
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid or expired reset token', 401)
    }
    if (error instanceof z.ZodError) {
      throw new AppError('Validation failed', 400, error.errors)
    }
    throw error
  }
}

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      throw new AppError('Not authenticated', 401)
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      }
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    })
    
  } catch (error) {
    throw error
  }
}