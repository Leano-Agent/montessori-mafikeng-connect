import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError, asyncHandler } from './errorMiddleware'
import { prisma } from '../services/database'
import { redisClient } from '../services/redis'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        role: string
        email?: string
        languagePreference?: string
      }
    }
  }
}

// Get token from request
const getTokenFromRequest = (req: Request): string | null => {
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1]
  }
  
  // Check for token in cookies
  if (req.cookies?.access_token) {
    return req.cookies.access_token
  }
  
  // Check for token in query string (for password reset, etc.)
  if (req.query.token) {
    return req.query.token as string
  }
  
  return null
}

// Authenticate user - require authentication
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req)

  // Make sure token exists
  if (!token) {
    return next(new AppError('Authentication required', 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      userId: string
      role: string
    }

    // Check if token is blacklisted (for logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return next(new AppError('Token is no longer valid', 401))
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return next(new AppError('User no longer exists or is inactive', 401))
    }

    // Add user to request object
    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      languagePreference: user.languagePreference,
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401))
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401))
    }
    return next(new AppError('Authentication failed', 401))
  }
})

// Alias for backward compatibility
export const protect = authenticate

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized to access this route', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      )
    }

    next()
  }
}

// Language preference middleware
export const languageMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get language from user preference, header, or default
    let language = 'setswana' // Default to Setswana for African context

    if (req.user?.languagePreference) {
      language = req.user.languagePreference.toLowerCase()
    } else if (req.headers['accept-language']) {
      const preferredLang = req.headers['accept-language'].split(',')[0]
      if (preferredLang.startsWith('tn') || preferredLang.startsWith('setswana')) {
        language = 'setswana'
      } else if (preferredLang.startsWith('en')) {
        language = 'english'
      }
    }

    // Set language in request for use in controllers
    req.headers['x-language'] = language
    next()
  }
)

// Offline mode detection middleware
export const offlineModeMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if request is from offline sync
    const isOfflineSync = req.headers['x-offline-sync'] === 'true'
    
    if (isOfflineSync) {
      // Add offline context to request
      req.headers['x-offline-timestamp'] = req.headers['x-offline-timestamp'] as string || new Date().toISOString()
      req.headers['x-device-id'] = req.headers['x-device-id'] as string || 'unknown'
    }

    next()
  }
)

// Rate limiting for sensitive operations
export const sensitiveOperationLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Implement additional rate limiting for sensitive operations
  // like password reset, SMS sending, etc.
  next()
}

// Audit logging middleware
export const auditMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send

    // Override send function to log after response is sent
    res.send = function (body: any) {
      // Log audit trail for sensitive operations
      if (req.user && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const auditData = {
          userId: req.user.id,
          action: `${req.method} ${req.path}`,
          entityType: req.path.split('/')[2], // Extract entity type from path
          entityId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date(),
        }

        // Log to database (async, don't wait)
        prisma.auditLog.create({
          data: auditData,
        }).catch(console.error)
      }

      // Call original send function
      return originalSend.call(this, body)
    }

    next()
  }
)