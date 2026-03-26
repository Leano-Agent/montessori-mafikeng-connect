import { Request, Response, NextFunction } from 'express'
import winston from 'winston'
import path from 'path'

// Create logs directory if it doesn't exist
const fs = require('fs')
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Configure Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'montessori-mafikeng-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  // Log request details
  const requestLog = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
  }
  
  logger.info('Incoming request', requestLog)
  
  // Log response details when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
    }
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', responseLog)
    } else {
      logger.info('Request completed successfully', responseLog)
    }
  })
  
  next()
}

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorLog = {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  }
  
  logger.error('Unhandled error occurred', errorLog)
  next(error)
}

// Audit logging middleware
export const auditLogger = (action: string, details: any) => {
  const auditLog = {
    action,
    details,
    timestamp: new Date().toISOString(),
  }
  
  logger.info('Audit log', auditLog)
}

// Performance logging middleware
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  const performanceLog = {
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString(),
  }
  
  if (duration > 1000) { // Log slow operations (>1 second)
    logger.warn('Slow operation detected', performanceLog)
  } else if (duration > 500) { // Log moderately slow operations (>500ms)
    logger.info('Operation performance', performanceLog)
  }
}

// Security logging middleware
export const securityLogger = (event: string, details: any) => {
  const securityLog = {
    event,
    details,
    timestamp: new Date().toISOString(),
  }
  
  logger.warn('Security event', securityLog)
}

// Database query logging
export const dbQueryLogger = (query: string, duration: number, params?: any[]) => {
  const dbLog = {
    query,
    duration: `${duration}ms`,
    params,
    timestamp: new Date().toISOString(),
  }
  
  if (duration > 100) { // Log slow queries (>100ms)
    logger.warn('Slow database query', dbLog)
  }
}

// SMS logging
export const smsLogger = (phone: string, message: string, status: string, error?: string) => {
  const smsLog = {
    phone: phone.substring(0, 6) + '...', // Mask phone for privacy
    messageLength: message.length,
    status,
    error,
    timestamp: new Date().toISOString(),
  }
  
  if (status === 'failed') {
    logger.error('SMS sending failed', smsLog)
  } else {
    logger.info('SMS sent', smsLog)
  }
}

// File upload logging
export const uploadLogger = (filename: string, size: number, userId: string, status: string) => {
  const uploadLog = {
    filename,
    size: `${(size / 1024 / 1024).toFixed(2)}MB`,
    userId,
    status,
    timestamp: new Date().toISOString(),
  }
  
  logger.info('File upload', uploadLog)
}

// Export logger instance for direct use
export default logger