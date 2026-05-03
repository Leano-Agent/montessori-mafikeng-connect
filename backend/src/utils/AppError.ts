/**
 * Canonical application error class.
 * Used across all controllers and middleware to produce consistent error responses.
 */
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: any[]

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.errors = errors

    // Preserve the original stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}
