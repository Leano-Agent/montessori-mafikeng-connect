/**
 * Auth store — managed by Zustand.
 *
 * Responsibilities:
 * - Hold current user and auth state in memory (never localStorage for tokens).
 * - Persist role/schoolId to localStorage for route guards and multi-tenant lookups
 *   (does NOT contain sensitive tokens).
 * - Listen for auth:signout event (dispatched by axios 401 interceptor on refresh failure).
 */

import { create } from 'zustand'
import * as authApi from '../services/auth'
import { getAccessToken } from '../services/api'
import type { UserProfile, LoginPayload, RegisterPayload } from '../services/auth'

// ── Persisted profile (non-sensitive) ──────────────────────────────

const STORAGE_KEY = 'montessori_user'

interface PersistedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  schoolId?: string
  avatar?: string
}

function loadPersistedUser(): PersistedUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedUser) : null
  } catch {
    return null
  }
}

function savePersistedUser(user: UserProfile): void {
  const subset: PersistedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    avatar: user.avatar,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subset))
}

function clearPersistedUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ════════════════════════════════════════════════════════════════════
// Store
// ════════════════════════════════════════════════════════════════════

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  clearError: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authApi.login(payload)
      savePersistedUser(user)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.')
      set({ error: message, isLoading: false })
      throw err
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authApi.register(payload)
      savePersistedUser(user)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Registration failed. Please try again.'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      clearPersistedUser()
      set({ user: null, isAuthenticated: false, error: null })
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true })
    try {
      const user = await authApi.getCurrentUser()
      savePersistedUser(user)
      set({ user, isAuthenticated: true, isLoading: false, error: null })
    } catch {
      // Not authenticated or network error — stay logged out
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    // Check if we have an in-memory access token (page reload clears this)
    // If not, try the refresh-token cookie to get a new access token
    const persisted = loadPersistedUser()
    if (!persisted) {
      set({ isLoading: false })
      return
    }

    // We have a persisted user profile — try to re-authenticate
    set({ isLoading: true })
    try {
      // Try to refresh the access token via httpOnly cookie
      await authApi.refreshAccessToken()
      const user = await authApi.getCurrentUser()
      savePersistedUser(user)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      // Refresh failed, clear stale data
      clearPersistedUser()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))

// ════════════════════════════════════════════════════════════════════
// Listen for forced sign-out from axios interceptor
// ════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.addEventListener('auth:signout', () => {
    useAuthStore.getState().logout()
  })
}
