/**
 * Auth API functions — typed wrappers around axios for auth endpoints.
 */

import { api, setAccessToken } from './api'

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'TEACHER' | 'PARENT'
  schoolId?: string
  phone?: string
  avatar?: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: 'TEACHER' | 'PARENT'
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: UserProfile
    accessToken: string
    refreshToken: string
  }
}

export interface MeResponse {
  success: boolean
  data: {
    user: UserProfile
  }
}

// ════════════════════════════════════════════════════════════════════
// API calls
// ════════════════════════════════════════════════════════════════════

export async function login(payload: LoginPayload): Promise<{ user: UserProfile; accessToken: string }> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  const { user, accessToken } = data.data

  // Store access token in memory so future requests are authenticated
  setAccessToken(accessToken)

  return { user, accessToken }
}

export async function register(payload: RegisterPayload): Promise<{ user: UserProfile; accessToken: string }> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  const { user, accessToken } = data.data

  setAccessToken(accessToken)

  return { user, accessToken }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    setAccessToken(null) // clear in-memory token regardless of API success
  }
}

export async function refreshAccessToken(): Promise<string> {
  const { data } = await api.post<{ success: boolean; data: { accessToken: string } }>(
    '/auth/refresh-token',
  )
  const newToken = data.data.accessToken
  setAccessToken(newToken)
  return newToken
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await api.get<MeResponse>('/auth/me')
  return data.data.user
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password })
}
