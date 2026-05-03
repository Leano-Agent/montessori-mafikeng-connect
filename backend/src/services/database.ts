import { PrismaClient } from '@prisma/client'

// Determine if we're using Supabase PgBouncer pooler
const isPooler = process.env.DATABASE_URL?.includes('pgbouncer=true') ?? false

// Prisma client instance
// When using Supabase pooler (PgBouncer):
//   - pgbouncer=true in the connection URL disables Prisma prepared statements
//   - connection_limit=1 is set in the URL to prevent connection storms
//   - Datasource URL is explicit to ensure the pooler param is picked up
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Database connection function
export const initializeDatabase = async () => {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection established')

    // Run database health check
    await checkDatabaseHealth()

    return prisma
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database health check passed')
    return true
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    throw error
  }
}

// Database utilities
export const databaseUtils = {
  // Transaction wrapper with retry logic
  async transaction<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await prisma.$transaction(operation, {
          maxWait: 5000, // 5 seconds
          timeout: 10000, // 10 seconds
        })
      } catch (error) {
        lastError = error as Error
        console.warn(`Transaction attempt ${i + 1} failed:`, error)

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)))
      }
    }

    throw lastError!
  },

  // Batch operations with chunking
  async batchOperation<T>(
    items: T[],
    operation: (chunk: T[]) => Promise<any>,
    chunkSize = 100
  ) {
    const results = []
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const result = await operation(chunk)
      results.push(result)
    }

    return results
  },

  // Soft delete helper
  async softDelete(model: string, id: string) {
    const updateData = {
      isActive: false,
      updatedAt: new Date(),
    }

    return await (prisma as any)[model].update({
      where: { id },
      data: updateData,
    })
  },

  // Restore soft deleted item
  async restore(model: string, id: string) {
    const updateData = {
      isActive: true,
      updatedAt: new Date(),
    }

    return await (prisma as any)[model].update({
      where: { id },
      data: updateData,
    })
  },
}

// Handle database disconnection
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Export Prisma client and utilities
export { prisma }
export default prisma