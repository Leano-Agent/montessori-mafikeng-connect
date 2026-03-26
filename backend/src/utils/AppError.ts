export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: any[]

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.errors = errors

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  // Handle specific error types
  if (err.name === 'ValidationError') {
    err.statusCode = 400
    err.message = 'Validation Error'
  }

  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401
    err.message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401
    err.message = 'Token expired'
  }

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}

export const notFound = (req: any, res: any, next: any) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404)
  next(error)
}