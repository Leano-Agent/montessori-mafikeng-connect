/**
 * Unit tests for Redis service (graceful-fallback architecture)
 *
 * Covers: initializeRedis, getRedisClient, isRedisAvailable,
 * and all redisUtils methods. Tests both available and unavailable
 * Redis states, as well as error recovery.
 */

import { createClient } from 'redis'
import {
  initializeRedis,
  getRedisClient,
  isRedisAvailable,
  redisUtils,
} from '../services/redis'

// ════════════════════════════════════════════════════════════════════
// Mock Redis client
// ════════════════════════════════════════════════════════════════════

const mockClient = {
  isOpen: true,
  connect: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue('PONG'),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue(['k1', 'k2']),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(true),
  publish: jest.fn().mockResolvedValue(1),
  subscribe: jest.fn().mockResolvedValue(undefined),
  duplicate: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    isOpen: true,
  }),
  on: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
}

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockClient),
}))

// ════════════════════════════════════════════════════════════════════
// Setup — ensure Redis is NOT initialized by default
// ════════════════════════════════════════════════════════════════════

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.REDIS_URL
  // The singleton redisClient starts at null by default.
  // We must ensure it's not left in an initialized state from
  // previous test blocks. Calling initializeRedis() with an unset
  // REDIS_URL returns null but does NOT clear a previously-set
  // client — so "unavailable" tests must run FIRST.
})

afterEach(() => {
  delete process.env.REDIS_URL
})

describe('Redis Service', () => {
  // ══════════════════════════════════════════════════════════════════
  // GRACEFUL DEGRADATION: Redis unavailable
  // ══════════════════════════════════════════════════════════════════

  describe('when Redis is unavailable', () => {
    // Safe: these tests run before any initialization, so
    // getRedisClient() returns null (default).
    beforeEach(async () => {
      delete process.env.REDIS_URL
      await initializeRedis() // returns null, doesn't change redisClient
    })

    it('initializeRedis returns null without REDIS_URL', async () => {
      const result = await initializeRedis()
      expect(result).toBeNull()
    })

    it('getRedisClient returns null', () => {
      expect(getRedisClient()).toBeNull()
    })

    it('isRedisAvailable returns false', () => {
      expect(isRedisAvailable()).toBe(false)
    })

    // redisUtils fallbacks
    it('setWithExpiry returns false', async () => {
      expect(await redisUtils.setWithExpiry('k', 'v', 60)).toBe(false)
    })

    it('getJson returns null', async () => {
      expect(await redisUtils.getJson('k')).toBeNull()
    })

    it('deleteByPattern returns 0', async () => {
      expect(await redisUtils.deleteByPattern('p:*')).toBe(0)
    })

    it('incrementWithExpiry returns 1', async () => {
      expect(await redisUtils.incrementWithExpiry('k', 60)).toBe(1)
    })

    it('rateLimit allows all', async () => {
      expect(await redisUtils.rateLimit('k', 10, 60)).toEqual({
        allowed: true, remaining: 10, reset: 0,
      })
    })

    it('cache calls fetchFn', async () => {
      const fn = jest.fn().mockResolvedValue({ from: 'db' })
      expect(await redisUtils.cache('k', fn, 60)).toEqual({ from: 'db' })
      expect(fn).toHaveBeenCalled()
    })

    it('publish does not throw', async () => {
      await expect(redisUtils.publish('ch', {})).resolves.toBeUndefined()
    })

    it('subscribe returns null', async () => {
      const cb = jest.fn()
      expect(await redisUtils.subscribe('ch', cb)).toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // OPERATIONAL: Redis available
  // ══════════════════════════════════════════════════════════════════

  describe('when Redis is available', () => {
    beforeEach(async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      mockClient.isOpen = true
      await initializeRedis()
    })

    it('initializes and returns client', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      const result = await initializeRedis()
      expect(result).toBe(mockClient)
    })

    it('throws on connection failure', async () => {
      process.env.REDIS_URL = 'redis://bad:6379'
      mockClient.connect.mockRejectedValueOnce(new Error('refused'))
      await expect(initializeRedis()).rejects.toThrow('refused')
    })

    it('getRedisClient returns the client', () => {
      expect(getRedisClient()).toBe(mockClient)
    })

    it('isRedisAvailable returns true when open', () => {
      expect(isRedisAvailable()).toBe(true)
    })

    it('isRedisAvailable returns false when isOpen is false', () => {
      mockClient.isOpen = false
      expect(isRedisAvailable()).toBe(false)
    })

    // ── redisUtils under healthy Redis ──

    it('setWithExpiry stores JSON value with EX', async () => {
      await redisUtils.setWithExpiry('k', { a: 1 }, 30)
      expect(mockClient.set).toHaveBeenCalledWith('k', '{"a":1}', { EX: 30 })
    })

    it('setWithExpiry stores raw strings without wrapping', async () => {
      await redisUtils.setWithExpiry('k', 'hello', 10)
      expect(mockClient.set).toHaveBeenCalledWith('k', 'hello', { EX: 10 })
    })

    it('getJson parses stored JSON', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ x: 1 }))
      const val = await redisUtils.getJson<{ x: number }>('k')
      expect(val).toEqual({ x: 1 })
    })

    it('getJson returns null on miss', async () => {
      mockClient.get.mockResolvedValue(null)
      expect(await redisUtils.getJson('k')).toBeNull()
    })

    it('deleteByPattern deletes matching keys', async () => {
      const n = await redisUtils.deleteByPattern('user:*')
      expect(mockClient.keys).toHaveBeenCalledWith('user:*')
      expect(mockClient.del).toHaveBeenCalledWith(['k1', 'k2'])
      expect(n).toBe(2)
    })

    it('deleteByPattern returns 0 for empty match', async () => {
      mockClient.keys.mockResolvedValue([])
      expect(await redisUtils.deleteByPattern('no:match:*')).toBe(0)
    })

    it('incrementWithExpiry sets expire on first call', async () => {
      mockClient.incr.mockResolvedValue(1)
      await redisUtils.incrementWithExpiry('ctr', 120)
      expect(mockClient.expire).toHaveBeenCalledWith('ctr', 120)
    })

    it('incrementWithExpiry skips expire after first call', async () => {
      mockClient.incr.mockResolvedValue(99)
      await redisUtils.incrementWithExpiry('ctr', 120)
      expect(mockClient.expire).not.toHaveBeenCalled()
    })

    it('rateLimit: within limit → allowed', async () => {
      mockClient.incr.mockResolvedValue(3)
      const r = await redisUtils.rateLimit('api', 10, 60)
      expect(r.allowed).toBe(true)
      expect(r.remaining).toBe(7)
    })

    it('rateLimit: exceeded → denied', async () => {
      mockClient.incr.mockResolvedValue(12)
      const r = await redisUtils.rateLimit('api', 10, 60)
      expect(r.allowed).toBe(false)
      expect(r.remaining).toBe(0)
    })

    it('cache returns cached value on hit', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ hit: true }))
      const fn = jest.fn()
      const val = await redisUtils.cache('k', fn, 3600)
      expect(val).toEqual({ hit: true })
      expect(fn).not.toHaveBeenCalled()
    })

    it('cache fetches and caches on miss', async () => {
      mockClient.get.mockResolvedValue(null)
      const fn = jest.fn().mockResolvedValue({ fresh: true })
      const val = await redisUtils.cache('k', fn, 3600)
      expect(val).toEqual({ fresh: true })
      expect(mockClient.set).toHaveBeenCalledWith('k', '{"fresh":true}', { EX: 3600 })
    })

    it('publish sends JSON stringified', async () => {
      await redisUtils.publish('ch', { type: 'x' })
      expect(mockClient.publish).toHaveBeenCalledWith('ch', '{"type":"x"}')
    })

    it('subscribe duplicates and subscribes', async () => {
      const cb = jest.fn()
      await redisUtils.subscribe('ch', cb)
      expect(mockClient.duplicate).toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // ERROR RECOVERY: methods survive Redis errors
  // ══════════════════════════════════════════════════════════════════

  describe('error recovery', () => {
    beforeEach(async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      mockClient.isOpen = true
      await initializeRedis()
    })

    it('setWithExpiry catches and returns false', async () => {
      mockClient.set.mockRejectedValueOnce(new Error('boom'))
      expect(await redisUtils.setWithExpiry('k', 'v', 60)).toBe(false)
    })

    it('getJson catches and returns null', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('boom'))
      expect(await redisUtils.getJson('k')).toBeNull()
    })

    it('deleteByPattern catches and returns 0', async () => {
      mockClient.keys.mockRejectedValueOnce(new Error('boom'))
      expect(await redisUtils.deleteByPattern('p:*')).toBe(0)
    })

    it('incrementWithExpiry catches and returns 1', async () => {
      mockClient.incr.mockRejectedValueOnce(new Error('boom'))
      expect(await redisUtils.incrementWithExpiry('k', 60)).toBe(1)
    })

    it('rateLimit catches and allows', async () => {
      mockClient.incr.mockRejectedValueOnce(new Error('boom'))
      const r = await redisUtils.rateLimit('k', 10, 60)
      expect(r.allowed).toBe(true)
    })

    it('cache falls back to fetchFn on get error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('boom'))
      const fn = jest.fn().mockResolvedValue({ fallback: true })
      const val = await redisUtils.cache('k', fn, 60)
      expect(val).toEqual({ fallback: true })
      expect(fn).toHaveBeenCalled()
    })

    it('cache falls back to fetchFn on set error', async () => {
      mockClient.get.mockResolvedValue(null)
      mockClient.set.mockRejectedValueOnce(new Error('boom'))
      const fn = jest.fn().mockResolvedValue({ ok: true })
      const val = await redisUtils.cache('k', fn, 60)
      expect(val).toEqual({ ok: true })
    })
  })
})
