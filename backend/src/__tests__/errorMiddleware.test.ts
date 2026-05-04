/**
 * Unit tests for Error Middleware
 *
 * Tests: AppError class, errorHandler, notFound, asyncHandler
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'
import { errorHandler, notFound, asyncHandler } from '../middlewares/errorMiddleware'

// ── Helpers ────────────────────────────────────────────────────────
function mockRes(): Partial<Response> {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

function mockReq(overrides: Record<string, any> = {}): Partial<Request> {
  return {
    path: '/api/test',
    method: 'GET',
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════
// AppError CLASS TESTS
// ══════════════════════════════════════════════════════════════════════
describe('AppError', () => {
  it('should create an operational error with default status 500', () => {
    const error = new AppError('Something broke')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
    expect(error.message).toBe('Something broke')
    expect(error.statusCode).toBe(500)
    expect(error.isOperational).toBe(true)
  })

  it('should accept custom status code', () => {
    const error = new AppError('Not found', 404)
    expect(error.statusCode).toBe(404)
  })

  it('should accept validation errors array', () => {
    const validationErrors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Too short' },
    ]
    const error = new AppError('Validation failed', 400, validationErrors)
    expect(error.errors).toEqual(validationErrors)
  })

  it('should capture stack trace', () => {
    const error = new AppError('Test')
    expect(error.stack).toBeDefined()
    expect(typeof error.stack).toBe('string')
    expect(error.stack!.length).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════════════
// ERROR HANDLER MIDDLEWARE TESTS
// ══════════════════════════════════════════════════════════════════════
describe('errorHandler', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  it('should return JSON error response with status code', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new AppError('Test error', 400)

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Test error',
          statusCode: 400,
          path: '/api/test',
        }),
      })
    )
  })

  it('should default to 500 for unknown errors', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new Error('Unknown crash')

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Unknown crash',
          statusCode: 500,
        }),
      })
    )
  })

  it('should handle CastError as 404', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new Error('Cast error') as any
    error.name = 'CastError'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Resource not found' }),
      })
    )
  })

  it('should handle ValidationError', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new Error('Validation error') as any
    error.name = 'ValidationError'
    error.errors = {
      email: { message: 'Invalid email' },
      password: { message: 'Too short' },
    }

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining('Invalid email'),
        }),
      })
    )
  })

  it('should handle duplicate key errors (code 11000)', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new Error('Duplicate') as any
    error.code = 11000

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Duplicate field value entered',
        }),
      })
    )
  })

  it('should handle JWT errors', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()

    // JsonWebTokenError
    const jwtError = new Error('jwt malformed') as any
    jwtError.name = 'JsonWebTokenError'
    errorHandler(jwtError, req as Request, res as Response, next)
    expect(res.status).toHaveBeenCalledWith(401)

    // TokenExpiredError
    const expiredError = new Error('jwt expired') as any
    expiredError.name = 'TokenExpiredError'
    errorHandler(expiredError, req as Request, res as Response, next)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('should include timestamp in error response', () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new AppError('Timed error', 400)

    errorHandler(error, req as Request, res as Response, next)

    const callArgs = (res.json as jest.Mock).mock.calls[0][0]
    expect(callArgs.error.timestamp).toBeDefined()
    expect(new Date(callArgs.error.timestamp).getTime()).not.toBeNaN()
  })

  it('should include stack trace in development', () => {
    process.env.NODE_ENV = 'development'
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const error = new AppError('Dev error', 400)

    errorHandler(error, req as Request, res as Response, next)

    const callArgs = (res.json as jest.Mock).mock.calls[0][0]
    expect(callArgs.error.stack).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════════════
// NOT FOUND MIDDLEWARE TESTS
// ══════════════════════════════════════════════════════════════════════
describe('notFound', () => {
  it('should create a 404 AppError with the original URL', () => {
    const req = mockReq({ originalUrl: '/api/nonexistent' })
    const res = mockRes()
    const next = jest.fn()

    notFound(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('/api/nonexistent'),
        statusCode: 404,
      })
    )
  })
})

// ══════════════════════════════════════════════════════════════════════
// ASYNC HANDLER TESTS
// ══════════════════════════════════════════════════════════════════════
describe('asyncHandler', () => {
  it('should pass resolved value through', async () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const handler = asyncHandler(async (_req: Request, _res: Response) => {
      return 'success'
    })

    await handler(req as Request, res as Response, next)

    expect(next).not.toHaveBeenCalled()
  })

  it('should catch errors and pass them to next()', async () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const testError = new Error('Async failure')
    const handler = asyncHandler(async () => {
      throw testError
    })

    await handler(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(testError)
  })

  it('should handle non-async functions', async () => {
    const req = mockReq()
    const res = mockRes()
    const next = jest.fn()
    const handler = asyncHandler((_req: Request, _res: Response) => {
      return 'ok'
    })

    await handler(req as Request, res as Response, next)

    expect(next).not.toHaveBeenCalled()
  })
})
