/**
 * Auth Controller — thin HTTP handlers.
 *
 * Each function: parse request → call AuthService → set cookies → send response.
 * Business logic lives in AuthService; validators in service schemas.
 * Uses Express.Request with global user augmentation from authMiddleware.
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { AuthService } from '../services/auth.service';

// ── Helpers ────────────────────────────────────────────────────────

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, AuthService.cookieOptions.access());
  res.cookie('refresh_token', refreshToken, AuthService.cookieOptions.refresh());
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

function extractRefreshToken(req: Request): string | undefined {
  return req.cookies?.refresh_token || req.body?.refreshToken;
}

function handleZodError(err: unknown): void {
  if (err instanceof ZodError) {
    throw new AppError(
      'Validation failed',
      400,
      err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    );
  }
  throw err;
}

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/register  →  201 Created
// ════════════════════════════════════════════════════════════════════

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, tokens } = await AuthService.register(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, ...tokens },
    });
  } catch (err) {
    handleZodError(err);
  }
};

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/login  →  200 OK  |  401 Unauthorized  |  403 Forbidden
// ════════════════════════════════════════════════════════════════════

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, tokens } = await AuthService.login(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, ...tokens },
    });
  } catch (err) {
    handleZodError(err);
  }
};

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/refresh-token  →  200 OK  |  401 Unauthorized (rotation)
// ════════════════════════════════════════════════════════════════════

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const rt = extractRefreshToken(req);
  if (!rt) {
    throw new AppError('Refresh token required', 401);
  }

  const tokens = await AuthService.refreshToken(rt);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens,
  });
};

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/logout  →  200 OK
// ════════════════════════════════════════════════════════════════════

export const logout = async (req: Request, res: Response): Promise<void> => {
  const rt = extractRefreshToken(req);
  await AuthService.logout(rt);
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password  →  200 OK (always, to prevent enumeration)
// ════════════════════════════════════════════════════════════════════

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.forgotPassword(req.body.email);

    // Deliberately vague — don't leak whether the email exists
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link',
    });
  } catch (err) {
    handleZodError(err);
  }
};

// ════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password  →  200 OK  |  401 Invalid token
// ════════════════════════════════════════════════════════════════════

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.password);

    clearAuthCookies(res); // invalidate all sessions after password change

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    handleZodError(err);
  }
};

// ════════════════════════════════════════════════════════════════════
// GET /api/auth/me  →  200 OK  |  401 Unauthenticated  |  404 Not found
// ════════════════════════════════════════════════════════════════════

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await AuthService.getUserById(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
};
