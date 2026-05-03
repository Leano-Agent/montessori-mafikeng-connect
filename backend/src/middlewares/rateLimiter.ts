import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { AppError } from './errorMiddleware'

// General rate limiter for all requests
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many requests, please try again later.', 429)
  },
})

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests to this endpoint, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many requests to this endpoint, please try again later.', 429)
  },
})

// Login rate limiter to prevent brute force attacks
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // successful logins don't count toward the limit
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many login attempts, please try again later.', 429)
  },
})

// SMS rate limiter to prevent abuse
export const smsRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 SMS requests per hour
  message: 'Too many SMS requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many SMS requests, please try again later.', 429)
  },
})

// File upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many file uploads, please try again later.', 429)
  },
})

// API key rate limiter (for future external API access)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each API key to 1000 requests per hour
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    // Use API key from header or query parameter
    return req.headers['x-api-key'] as string || req.query.apiKey as string || req.ip
  },
  handler: (req: Request, res: Response) => {
    throw new AppError('API rate limit exceeded, please try again later.', 429)
  },
})

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = (role: string) => {
  const limits: Record<string, number> = {
    ADMIN: 1000,
    PRINCIPAL: 500,
    TEACHER: 200,
    PARENT: 100,
    DEFAULT: 50,
  }
  
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: limits[role] || limits.DEFAULT,
    message: 'Rate limit exceeded for your role, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.userId || req.ip
    },
    handler: (req: Request, res: Response) => {
      throw new AppError('Rate limit exceeded for your role, please try again later.', 429)
    },
  })
}

// Rate limiter for specific endpoints
export const endpointRateLimiters = {
  auth: loginRateLimiter,
  sms: smsRateLimiter,
  upload: uploadRateLimiter,
  api: apiKeyRateLimiter,
}