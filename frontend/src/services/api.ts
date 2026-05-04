/**
 * Axios API instance with JWT refresh token interceptor.
 *
 * Architecture:
 * - Access token: stored in memory (window.__accessToken) — never localStorage.
 * - Refresh token: httpOnly cookie set by the backend — auto-sent with withCredentials.
 * - On 401 response: attempt silent refresh via POST /api/auth/refresh-token.
 *   If refresh succeeds, retry the original request. If it fails, clear state
 *   and redirect to login.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// ── Environment-aware base URL (Vite proxy handles /api in dev) ──
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send httpOnly cookies (refresh_token)
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ════════════════════════════════════════════════════════════════════
// In-memory access token (not persisted — survives only page lifetime)
// ════════════════════════════════════════════════════════════════════

let accessToken: string | null = null

/** Set the access token and attach it to future requests. */
export function setAccessToken(token: string | null): void {
  accessToken = token
}

/** Read the current access token. */
export function getAccessToken(): string | null {
  return accessToken
}

// ── Attach access token to every outgoing request ──
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ════════════════════════════════════════════════════════════════════
// Refresh logic (deduped to prevent concurrent refresh storms)
// ════════════════════════════════════════════════════════════════════

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeToRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb)
}

function onRefreshSuccess(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

function onRefreshFailure(): void {
  refreshSubscribers = []
  setAccessToken(null)
  // trigger authStore sign-out (circular-dep-safe: dispatched as window event)
  window.dispatchEvent(new CustomEvent('auth:signout'))
}

// ── 401 interceptor → attempt silent refresh ──
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Only attempt refresh on 401, not on refresh endpoint itself, and only once
    if (
      error.response?.status !== 401 ||
      originalRequest.url === '/auth/refresh-token' ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise((resolve) => {
        subscribeToRefresh((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const { data } = await api.post('/auth/refresh-token')
      const newToken: string = data.data.accessToken

      setAccessToken(newToken)
      onRefreshSuccess(newToken)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }

      return api(originalRequest)
    } catch {
      onRefreshFailure()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

// ════════════════════════════════════════════════════════════════════
// Type-safe API response unwrapper
// ════════════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{ field: string; message: string }>
}
