/**
 * Unit tests for Auth Controller (refactored v2)
 *
 * Tests: register, login, refreshToken, logout, forgotPassword, resetPassword, getCurrentUser.
 *
 * Architecture: Controller → AuthService (business logic).
 * AuthService is mocked; controllers are tested in isolation.
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

// Shortcut to bypass strict ZodIssue types in test stubs
type ZodIssueLike = ZodError['issues'][number];

// ════════════════════════════════════════════════════════════════════
// Mock AuthService
// ════════════════════════════════════════════════════════════════════

jest.mock('../services/auth.service', () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getUserById: jest.fn(),
    cookieOptions: {
      access: jest.fn(() => ({ httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 })),
      refresh: jest.fn(() => ({ httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })),
    },
    generateTokens: jest.fn(() => ({ accessToken: 'mock-access', refreshToken: 'mock-refresh' })),
  },
}));

// ════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as Partial<Request>;
}

const mockUser = {
  id: 'user-123',
  email: 'teacher@montessori.co.za',
  firstName: 'Thabo',
  lastName: 'Molefe',
  role: 'TEACHER',
  languagePreference: 'SETSWANA',
  phone: '+27821234567',
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTokens = {
  accessToken: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_RESET_SECRET = 'test-reset-secret';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
});

// ════════════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════════════

describe('register', () => {
  const validBody = { email: 'teacher@montessori.co.za', password: 'SecurePass123', firstName: 'Thabo', lastName: 'Molefe', role: 'TEACHER', languagePreference: 'SETSWANA' };

  it('should return 201 with user and tokens on success', async () => {
    (AuthService.register as jest.Mock).mockResolvedValue({ user: mockUser, tokens: mockTokens });

    const req = mockReq({ body: validBody });
    const res = mockRes();

    await register(req as Request, res as Response);

    expect(AuthService.register).toHaveBeenCalledWith(validBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'User registered successfully',
        data: expect.objectContaining({ accessToken: 'access-token-abc', refreshToken: 'refresh-token-xyz' }),
      }),
    );
  });

  it('should throw AppError on Zod validation failure', async () => {
    (AuthService.register as jest.Mock).mockImplementation(() => {
      throw new ZodError([{ code: 'invalid_string', validation: 'email', message: 'Invalid email', path: ['email'] } as ZodIssueLike]);
    });

    const req = mockReq({ body: { email: 'not-an-email' } });
    const res = mockRes();

    await expect(register(req as Request, res as Response)).rejects.toThrow(AppError);
  });

  it('should reject duplicate email via service', async () => {
    (AuthService.register as jest.Mock).mockRejectedValue(new AppError('User with this email already exists', 400));

    const req = mockReq({ body: validBody });
    const res = mockRes();

    await expect(register(req as Request, res as Response)).rejects.toThrow('already exists');
  });

  it('should accept optional phone field', async () => {
    (AuthService.register as jest.Mock).mockResolvedValue({ user: { ...mockUser, phone: '+27821234567' }, tokens: mockTokens });

    const req = mockReq({ body: { ...validBody, phone: '+27821234567' } });
    const res = mockRes();

    await register(req as Request, res as Response);

    expect(AuthService.register).toHaveBeenCalledWith(expect.objectContaining({ phone: '+27821234567' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should throw AppError on short password validation failure', async () => {
    (AuthService.register as jest.Mock).mockImplementation(() => {
      throw new ZodError([{ code: 'too_small', minimum: 8, type: 'string', inclusive: true, message: 'Too short', path: ['password'] } as ZodIssueLike]);
    });

    const req = mockReq({ body: { ...validBody, password: 'short' } });
    const res = mockRes();

    await expect(register(req as Request, res as Response)).rejects.toThrow(AppError);
  });
});

// ════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════

describe('login', () => {
  const validBody = { email: 'teacher@montessori.co.za', password: 'SecurePass123' };

  it('should return 200 with user and tokens on success', async () => {
    (AuthService.login as jest.Mock).mockResolvedValue({ user: mockUser, tokens: mockTokens });

    const req = mockReq({ body: validBody });
    const res = mockRes();

    await login(req as Request, res as Response);

    expect(AuthService.login).toHaveBeenCalledWith(validBody);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({ accessToken: 'access-token-abc' }),
      }),
    );
  });

  it('should reject invalid credentials via service', async () => {
    (AuthService.login as jest.Mock).mockRejectedValue(new AppError('Invalid credentials', 401));

    const req = mockReq({ body: validBody });
    const res = mockRes();

    await expect(login(req as Request, res as Response)).rejects.toThrow('Invalid credentials');
  });

  it('should reject deactivated accounts', async () => {
    (AuthService.login as jest.Mock).mockRejectedValue(new AppError('Account is deactivated', 403));

    const req = mockReq({ body: validBody });
    const res = mockRes();

    await expect(login(req as Request, res as Response)).rejects.toThrow('deactivated');
  });

  it('should reject non-existent users', async () => {
    (AuthService.login as jest.Mock).mockRejectedValue(new AppError('Invalid credentials', 401));

    const req = mockReq({ body: { email: 'ghost@test.com', password: 'x' } });
    const res = mockRes();

    await expect(login(req as Request, res as Response)).rejects.toThrow('Invalid credentials');
  });
});

// ════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ════════════════════════════════════════════════════════════════════

describe('refreshToken', () => {
  it('should return new token pair on valid refresh', async () => {
    (AuthService.refreshToken as jest.Mock).mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const req = mockReq({ cookies: { refresh_token: 'valid-token' } });
    const res = mockRes();

    await refreshToken(req as Request, res as Response);

    expect(AuthService.refreshToken).toHaveBeenCalledWith('valid-token');
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should accept refresh token from body', async () => {
    (AuthService.refreshToken as jest.Mock).mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const req = mockReq({ body: { refreshToken: 'body-token' } });
    const res = mockRes();

    await refreshToken(req as Request, res as Response);

    expect(AuthService.refreshToken).toHaveBeenCalledWith('body-token');
  });

  it('should reject when no token provided', async () => {
    const req = mockReq();
    const res = mockRes();

    await expect(refreshToken(req as Request, res as Response)).rejects.toThrow('Refresh token required');
  });

  it('should reject expired/invalid tokens', async () => {
    (AuthService.refreshToken as jest.Mock).mockRejectedValue(new AppError('Invalid refresh token', 401));

    const req = mockReq({ cookies: { refresh_token: 'bad' } });
    const res = mockRes();

    await expect(refreshToken(req as Request, res as Response)).rejects.toThrow('Invalid refresh token');
  });
});

// ════════════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════════════

describe('logout', () => {
  it('should clear cookies and call service', async () => {
    (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

    const req = mockReq({ cookies: { refresh_token: 'some-token' } });
    const res = mockRes();

    await logout(req as Request, res as Response);

    expect(AuthService.logout).toHaveBeenCalledWith('some-token');
    expect(res.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should succeed even without refresh token', async () => {
    (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

    const req = mockReq();
    const res = mockRes();

    await logout(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle body-based refresh token', async () => {
    (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

    const req = mockReq({ body: { refreshToken: 'body-token' } });
    const res = mockRes();

    await logout(req as Request, res as Response);
    expect(AuthService.logout).toHaveBeenCalledWith('body-token');
  });
});

// ════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ════════════════════════════════════════════════════════════════════

describe('forgotPassword', () => {
  it('should return 200 without revealing user existence', async () => {
    (AuthService.forgotPassword as jest.Mock).mockResolvedValue({ emailSent: false });

    const req = mockReq({ body: { email: 'ghost@montessori.co.za' } });
    const res = mockRes();

    await forgotPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('If an account exists'),
      }),
    );
  });

  it('should return same response for existing user', async () => {
    (AuthService.forgotPassword as jest.Mock).mockResolvedValue({ emailSent: true });

    const req = mockReq({ body: { email: 'teacher@montessori.co.za' } });
    const res = mockRes();

    await forgotPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: expect.stringContaining('If an account exists') }),
    );
  });

  it('should throw AppError on invalid email format (Zod wrapping)', async () => {
    (AuthService.forgotPassword as jest.Mock).mockImplementation(() => {
      throw new ZodError([{ code: 'invalid_string', validation: 'email', message: 'Invalid email', path: ['email'] } as ZodIssueLike]);
    });

    const req = mockReq({ body: { email: 'not-email' } });
    const res = mockRes();

    await expect(forgotPassword(req as Request, res as Response)).rejects.toThrow(AppError);
  });
});

// ════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ════════════════════════════════════════════════════════════════════

describe('resetPassword', () => {
  it('should reset password and clear cookies', async () => {
    (AuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);

    const req = mockReq({ body: { token: 'valid-reset-token', password: 'NewSecurePass123' } });
    const res = mockRes();

    await resetPassword(req as Request, res as Response);

    expect(AuthService.resetPassword).toHaveBeenCalledWith('valid-reset-token', 'NewSecurePass123');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject invalid tokens from service', async () => {
    (AuthService.resetPassword as jest.Mock).mockRejectedValue(new AppError('Invalid or expired reset token', 401));

    const req = mockReq({ body: { token: 'bad', password: 'NewPass123' } });
    const res = mockRes();

    await expect(resetPassword(req as Request, res as Response)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw AppError on short password (Zod wrapping)', async () => {
    (AuthService.resetPassword as jest.Mock).mockImplementation(() => {
      throw new ZodError([{ code: 'too_small', minimum: 8, type: 'string', inclusive: true, message: 'Too short', path: ['password'] } as ZodIssueLike]);
    });

    const req = mockReq({ body: { token: 'valid-token', password: 'short' } });
    const res = mockRes();

    await expect(resetPassword(req as Request, res as Response)).rejects.toThrow(AppError);
  });
});

// ════════════════════════════════════════════════════════════════════
// GET CURRENT USER
// ════════════════════════════════════════════════════════════════════

describe('getCurrentUser', () => {
  it('should return current user profile', async () => {
    (AuthService.getUserById as jest.Mock).mockResolvedValue(mockUser);

    const req = mockReq({ user: { userId: 'user-123', role: 'TEACHER' } });
    const res = mockRes();

    await getCurrentUser(req as Request, res as Response);

    expect(AuthService.getUserById).toHaveBeenCalledWith('user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { user: mockUser } }),
    );
  });

  it('should reject unauthenticated requests', async () => {
    const req = mockReq();
    const res = mockRes();

    await expect(getCurrentUser(req as Request, res as Response)).rejects.toThrow('Not authenticated');
    expect(AuthService.getUserById).not.toHaveBeenCalled();
  });

  it('should return 404 if user not found', async () => {
    (AuthService.getUserById as jest.Mock).mockRejectedValue(new AppError('User not found', 404));

    const req = mockReq({ user: { userId: 'deleted-user', role: 'TEACHER' } });
    const res = mockRes();

    await expect(getCurrentUser(req as Request, res as Response)).rejects.toThrow('User not found');
  });
});
