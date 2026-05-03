import { Request } from 'express'
import { UserRole, LanguagePreference } from '@prisma/client'

// ── JWT Token Payload ──────────────────────────────────────────────
export interface TokenPayload {
  userId: string
  role: UserRole
}

// ── DTOs (Data Transfer Objects) ───────────────────────────────────
export interface RegisterDto {
  email: string
  phone?: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  languagePreference?: LanguagePreference
}

export interface LoginDto {
  email: string
  password: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  token: string
  password: string
}

// ── Response Shapes ────────────────────────────────────────────────
export interface AuthUserResponse {
  id: string
  email: string
  phone?: string | null
  firstName: string
  lastName: string
  role: UserRole
  languagePreference: LanguagePreference
  avatarUrl?: string | null
  isActive: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: Omit<AuthUserResponse, 'passwordHash'>
    accessToken: string
    refreshToken: string
  }
}

export interface GenericAuthResponse {
  success: boolean
  message: string
}

// ── Authenticated Request ──────────────────────────────────────────
/** Express Request augmented with the authenticated user context. */
export interface AuthRequest extends Request {
  user?: {
    userId: string
    role: UserRole
    email?: string
    languagePreference?: LanguagePreference
  }
}
