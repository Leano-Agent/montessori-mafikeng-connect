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

// Get Redis client
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.')
  }
  return redisClient
}

// Redis utilities
export const redisUtils = {
  // Set with expiry
  async setWithExpiry(key: string, value: any, expirySeconds: number) {
    const client = getRedisClient()
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    await client.set(key, stringValue, { EX: expirySeconds })
  },

  // Get and parse JSON
  async getJson<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  },

  // Delete keys by pattern
  async deleteByPattern(pattern: string) {
    const client = getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
    return keys.length
  },

  // Increment with expiry
  async incrementWithExpiry(key: string, expirySeconds: number) {
    const client = getRedisClient()
    const value = await client.incr(key)
    
    // Set expiry if this is the first increment
    if (value === 1) {
      await client.expire(key, expirySeconds)
    }
    
    return value
  },

  // Rate limiting
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean
    remaining: number
    reset: number
  }> {
    const client = getRedisClient()
    const now = Math.floor(Date.now() / 1000)
    const windowKey = `rate_limit:${key}:${Math.floor(now / windowSeconds)}`
    
    const current = await this.incrementWithExpiry(windowKey, windowSeconds)
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      reset: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
    }
  },

  // Cache with fallback
  async cache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expirySeconds: number = 3600
  ): Promise<T> {
    const client = getRedisClient()
    
    // Try to get from cache
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    // Fetch from source
    const data = await fetchFn()
    
    // Store in cache
    await this.setWithExpiry(key, JSON.stringify(data), expirySeconds)
    
    return data
  },

  // Pub/Sub
  async publish(channel: string, message: any) {
    const client = getRedisClient()
    await client.publish(channel, JSON.stringify(message))
  },

  async subscribe(channel: string, callback: (message: any) => void) {
    const client = getRedisClient()
    const subscriber = client.duplicate()
    await subscriber.connect()
    
    await subscriber.subscribe(channel, (message) => {
      callback(JSON.parse(message))
    })
    
    return subscriber
  },
}

// Export Redis client
export { redisClient }