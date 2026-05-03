import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './database'
import { AppError } from '../utils/AppError'
import { getRedisClient } from './redis'
import { sendSMS } from './sms'
import type { TokenPayload, TokenPair, RegisterDto, LoginDto } from '../types/auth'

// ── Validation Schemas ─────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['TEACHER', 'PARENT', 'ADMIN', 'PRINCIPAL']),
  languagePreference: z.enum(['SETSWANA', 'ENGLISH']).default('SETSWANA'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

// ── Redis Helpers (graceful — no-op when Redis unavailable) ────────
const redis = {
  async get(key: string): Promise<string | null> {
    try {
      const r = getRedisClient()
      return r?.isOpen ? await r.get(key) : null
    } catch { return null }
  },
  async set(key: string, value: string, ex?: number): Promise<void> {
    try {
      const r = getRedisClient()
      if (r?.isOpen) await r.set(key, value, ex ? { EX: ex } : undefined)
    } catch { /* noop */ }
  },
  async del(key: string): Promise<void> {
    try {
      const r = getRedisClient()
      if (r?.isOpen) await r.del(key)
    } catch { /* noop */ }
  },
  async exists(key: string): Promise<boolean> {
    try {
      const r = getRedisClient()
      return r?.isOpen ? (await r.exists(key)) > 0 : false
    } catch { return false }
  },
}

// ── JWT Token Generation ───────────────────────────────────────────
const ACCESS_TTL = '15m'
const REFRESH_TTL = '7d'
const RESET_TOKEN_TTL = '1h'
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60 // 7 days in seconds
const RESET_TTL_SEC = 60 * 60 // 1 hour in seconds

const generateTokens = (userId: string, role: string): TokenPair => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_TTL },
  )
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TTL },
  )
  return { accessToken, refreshToken }
}

// ── Cookie Options ─────────────────────────────────────────────────
const accessCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
})

const refreshCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
})

// ── Service ────────────────────────────────────────────────────────
export const AuthService = {
  // ── Register ───────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const validated = registerSchema.parse(dto) as z.infer<typeof registerSchema>

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existing) {
      throw new AppError('User with this email already exists', 400)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(validated.password, salt)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        phone: validated.phone ?? '',
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role,
        languagePreference: validated.languagePreference ?? 'SETSWANA',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Token pair
    const tokens = generateTokens(user.id, user.role)

    // Store refresh token
    await redis.set(`refresh_token:${user.id}`, tokens.refreshToken, REFRESH_TTL_SEC)

    // Welcome SMS (fire-and-forget)
    if (validated.phone) {
      const welcomeMessage =
        user.languagePreference === 'SETSWANA'
          ? `Re a go amogela ho Montessori Mafikeng Connect! Email: ${user.email}`
          : `Welcome to Montessori Mafikeng Connect! Email: ${user.email}`
      sendSMS(validated.phone, welcomeMessage).catch((e) =>
        console.error('Welcome SMS failed:', e),
      )
    }

    return { user, tokens }
  },

  // ── Login ──────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const validated = loginSchema.parse(dto) as z.infer<typeof loginSchema>

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403)
    }

    const validPassword = await bcrypt.compare(validated.password, user.passwordHash)
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401)
    }

    const tokens = generateTokens(user.id, user.role)

    // Store refresh token + update last login
    await Promise.all([
      redis.set(`refresh_token:${user.id}`, tokens.refreshToken, REFRESH_TTL_SEC),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ])

    // Strip passwordHash from response
    const { passwordHash, ...safeUser } = user

    return { user: safeUser, tokens }
  },

  // ── Refresh Token ──────────────────────────────────────────────
  async refreshToken(refreshTokenValue: string) {
    // Verify JWT
    let decoded: TokenPayload
    try {
      decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET!) as TokenPayload
    } catch {
      throw new AppError('Invalid refresh token', 401)
    }

    // Check token in Redis (skip if unavailable — degraded security but still works)
    const stored = await redis.get(`refresh_token:${decoded.userId}`)
    if (stored !== null && stored !== refreshTokenValue) {
      throw new AppError('Refresh token has been revoked', 401)
    }

    // Rotate tokens
    const tokens = generateTokens(decoded.userId, decoded.role)
    await redis.set(`refresh_token:${decoded.userId}`, tokens.refreshToken, REFRESH_TTL_SEC)

    return tokens
  },

  // ── Logout ─────────────────────────────────────────────────────
  async logout(refreshTokenValue: string | undefined) {
    if (refreshTokenValue) {
      try {
        const decoded = jwt.verify(
          refreshTokenValue,
          process.env.JWT_REFRESH_SECRET!,
        ) as TokenPayload
        await redis.del(`refresh_token:${decoded.userId}`)
      } catch {
        // Token expired/invalid — logout still succeeds
      }
    }
  },

  // ── Forgot Password ────────────────────────────────────────────
  async forgotPassword(email: string) {
    const validated = forgotPasswordSchema.parse({ email }) as z.infer<typeof forgotPasswordSchema>

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true, email: true, phone: true, firstName: true },
    })

    if (!user) {
      // Don't reveal whether the email exists
      return { emailSent: false }
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_RESET_SECRET!,
      { expiresIn: RESET_TOKEN_TTL },
    )

    await redis.set(`reset_token:${resetToken}`, user.id, RESET_TTL_SEC)

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    console.log(`[AUTH] Password reset link for ${user.email}: ${resetLink}`)

    // SMS notification (fire-and-forget)
    if (user.phone) {
      sendSMS(
        user.phone,
        'Montessori Mafikeng Connect: Password reset link sent to your email.',
      ).catch((e) => console.error('SMS notification failed:', e))
    }

    return { emailSent: true }
  },

  // ── Reset Password ─────────────────────────────────────────────
  async resetPassword(token: string, password: string) {
    const validated = resetPasswordSchema.parse({ token, password }) as z.infer<
      typeof resetPasswordSchema
    >

    let decoded: TokenPayload
    try {
      decoded = jwt.verify(validated.token, process.env.JWT_RESET_SECRET!) as TokenPayload
    } catch {
      throw new AppError('Invalid or expired reset token', 401)
    }

    // Verify token in Redis (skip if unavailable)
    const storedUserId = await redis.get(`reset_token:${validated.token}`)
    if (storedUserId !== null && storedUserId !== decoded.userId) {
      throw new AppError('Reset token has been invalidated', 401)
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(validated.password, salt)

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    })

    // Clean up tokens so they can't be reused
    await Promise.all([
      redis.del(`reset_token:${validated.token}`),
      redis.del(`refresh_token:${decoded.userId}`),
    ])
  },

  // ── Get User by ID ─────────────────────────────────────────────
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        languagePreference: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }
    return user
  },

  // Exported helpers so the controller can set cookies
  cookieOptions: { access: accessCookie, refresh: refreshCookie },
  generateTokens,
}
