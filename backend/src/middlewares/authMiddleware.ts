/**
 * Auth Middleware — JWT verification, role authorisation, and context enrichment.
 *
 * Provides:
 * - authenticate / protect: verify access token, attach user to request
 * - authorize: role-based access control (RBAC)
 * - languageMiddleware: detect Setswana/English preference
 * - offlineModeMiddleware: detect offline-sync requests
 * - auditMiddleware: log sensitive operations to audit trail
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { prisma } from '../services/database';
import { getRedisClient } from '../services/redis';

// ════════════════════════════════════════════════════════════════════
// Express type extension (consolidated — also in express.d.ts)
// ════════════════════════════════════════════════════════════════════

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email?: string;
        languagePreference?: string;
      };
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// Token extraction
// ════════════════════════════════════════════════════════════════════

function getTokenFromRequest(req: Request): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Cookie: access_token
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  // 3. Query string (for password reset flows)
  if (typeof req.query.token === 'string' && req.query.token.length > 0) {
    return req.query.token;
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
// Redis token blacklist check (graceful when Redis unavailable)
// ════════════════════════════════════════════════════════════════════

async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client?.isOpen) return false;
    const result = await client.get(`blacklist:${token}`);
    return result !== null;
  } catch {
    return false; // Redis unavailable → allow (degraded security)
  }
}

// ════════════════════════════════════════════════════════════════════
// asyncHandler (inlined to avoid circular imports)
// ════════════════════════════════════════════════════════════════════

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ════════════════════════════════════════════════════════════════════
// authenticate — verify JWT and attach user to request
// ════════════════════════════════════════════════════════════════════

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Check token blacklist
    if (await isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked. Please log in again.', 401);
    }

    // Verify JWT
    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        userId: string;
        role: string;
      };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired. Please refresh your session.', 401);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token.', 401);
      }
      throw new AppError('Authentication failed.', 401);
    }

    // Fetch user from database (verify existence + active status)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        languagePreference: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Account not found or deactivated.', 401);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      languagePreference: user.languagePreference,
    };

    next();
  },
);

// Alias for backward compatibility
export const protect = authenticate;

// ════════════════════════════════════════════════════════════════════
// authorize — role-based access control
// ════════════════════════════════════════════════════════════════════

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Role '${req.user.role}' is not authorized for this action.`,
        403,
      );
    }

    next();
  };
};

// ════════════════════════════════════════════════════════════════════
// languageMiddleware — detect language preference
// ════════════════════════════════════════════════════════════════════

export const languageMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let language = 'setswana'; // Default Setswana for Mafikeng context

    // 1. User preference (authenticated)
    if (req.user?.languagePreference) {
      language = req.user.languagePreference.toLowerCase();
    }
    // 2. Accept-Language header
    else if (req.headers['accept-language']) {
      const preferred = req.headers['accept-language'].split(',')[0].trim().toLowerCase();
      if (preferred.startsWith('tn') || preferred.startsWith('setswana')) {
        language = 'setswana';
      } else if (preferred.startsWith('en')) {
        language = 'english';
      }
    }

    req.headers['x-language'] = language;
    next();
  },
);

// ════════════════════════════════════════════════════════════════════
// offlineModeMiddleware — detect and enrich offline-sync requests
// ════════════════════════════════════════════════════════════════════

export const offlineModeMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.headers['x-offline-sync'] === 'true') {
      req.headers['x-offline-timestamp'] =
        (req.headers['x-offline-timestamp'] as string) || new Date().toISOString();
      req.headers['x-device-id'] =
        (req.headers['x-device-id'] as string) || 'unknown';
    }
    next();
  },
);

// ════════════════════════════════════════════════════════════════════
// auditMiddleware — log sensitive write operations
// ════════════════════════════════════════════════════════════════════

export const auditMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      // Log after successful response for write operations
      if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        const auditEntry = {
          userId: req.user.userId,
          action: `${req.method} ${req.baseUrl}${req.path}`,
          entityType: req.baseUrl.split('/').pop() || 'unknown',
          entityId: req.params.id || undefined,
          ipAddress: req.ip || undefined,
          userAgent: req.get('user-agent') || undefined,
        };

        // Fire-and-forget — don't block the response
        prisma.auditLog.create({ data: auditEntry }).catch(err => {
          console.error('Audit log write failed:', err.message);
        });
      }

      return originalJson(body);
    };

    next();
  },
);
