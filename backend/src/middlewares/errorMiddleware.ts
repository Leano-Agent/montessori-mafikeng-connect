import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404)
  next(error)
}

// Error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = (err as AppError).statusCode || 500
  let message = err.message || 'Server Error'

  // Handle specific error types
  if (err.name === 'CastError') {
    message = 'Resource not found'
    statusCode = 404
  }

  if (err.name === 'ValidationError') {
    message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(', ')
    statusCode = 400
  }

  if ((err as any).code === 11000) {
    message = 'Duplicate field value entered'
    statusCode = 400
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token'
    statusCode = 401
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired'
    statusCode = 401
  }

  // Log for development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
      body: req.body,
      stack: err.stack,
    })
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  })
}

// Re-export AppError so middleware/rate-limiter imports still work
export { AppError }

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
