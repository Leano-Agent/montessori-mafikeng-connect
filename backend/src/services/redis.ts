import { createClient } from 'redis'

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null

// Initialize Redis connection
export const initializeRedis = async () => {
  const redisUrl = process.env.REDIS_URL
  
  if (!redisUrl) {
    console.log('📭 No REDIS_URL configured, skipping Redis initialization')
    return null
  }

  try {
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis connection failed after 10 retries')
            return new Error('Max retries reached')
          }
          return Math.min(retries * 100, 3000) // Exponential backoff up to 3 seconds
        },
      },
    })

    // Event listeners
    redisClient.on('error', (err) => console.error('Redis Client Error:', err))
    redisClient.on('connect', () => console.log('✅ Redis connection established'))
    redisClient.on('ready', () => console.log('✅ Redis client ready'))
    redisClient.on('end', () => console.log('Redis connection closed'))

    // Connect to Redis
    await redisClient.connect()

    // Test connection
    await redisClient.ping()
    console.log('✅ Redis health check passed')

    return redisClient
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    throw error
  }
}

// Get Redis client (returns null if not initialized — callers must handle)
export const getRedisClient = () => redisClient

// Check if Redis is available for graceful fallbacks
export const isRedisAvailable = (): boolean => redisClient !== null && redisClient.isOpen

// Redis utilities — all gracefully return null/false when Redis is unavailable
export const redisUtils = {
  // Set with expiry
  async setWithExpiry(key: string, value: any, expirySeconds: number): Promise<boolean> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return false
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      await client.set(key, stringValue, { EX: expirySeconds })
      return true
    } catch { return false }
  },

  // Get and parse JSON
  async getJson<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return null
    try {
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch { return null }
  },

  // Delete keys by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return 0
    try {
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(keys)
      }
      return keys.length
    } catch { return 0 }
  },

  // Increment with expiry
  async incrementWithExpiry(key: string, expirySeconds: number): Promise<number> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return 1
    try {
      const value = await client.incr(key)
      if (value === 1) {
        await client.expire(key, expirySeconds)
      }
      return value
    } catch { return 1 }
  },

  // Rate limiting (permissive when Redis is down)
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean
    remaining: number
    reset: number
  }> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return { allowed: true, remaining: limit, reset: 0 }
    try {
      const now = Math.floor(Date.now() / 1000)
      const windowKey = `rate_limit:${key}:${Math.floor(now / windowSeconds)}`
      const current = await this.incrementWithExpiry(windowKey, windowSeconds)
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        reset: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
      }
    } catch { return { allowed: true, remaining: limit, reset: 0 } }
  },

  // Cache with fallback
  async cache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expirySeconds: number = 3600
  ): Promise<T> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return fetchFn()
    try {
      const cached = await client.get(key)
      if (cached) return JSON.parse(cached)
      const data = await fetchFn()
      await this.setWithExpiry(key, JSON.stringify(data), expirySeconds)
      return data
    } catch { return fetchFn() }
  },

  // Pub/Sub
  async publish(channel: string, message: any): Promise<void> {
    const client = getRedisClient()
    if (!client || !client.isOpen) return
    try { await client.publish(channel, JSON.stringify(message)) } catch {}
  },

  async subscribe(channel: string, callback: (message: any) => void) {
    const client = getRedisClient()
    if (!client || !client.isOpen) return null
    try {
      const subscriber = client.duplicate()
      await subscriber.connect()
      await subscriber.subscribe(channel, (message) => {
        callback(JSON.parse(message))
      })
      return subscriber
    } catch { return null }
  },
}

// Export Redis client
export { redisClient }