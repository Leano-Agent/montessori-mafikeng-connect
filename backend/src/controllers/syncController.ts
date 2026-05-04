import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'

// ── Zod validation schemas ──────────────────────────────────────────

const syncDataSchema = z.object({
  operations: z.array(
    z.object({
      endpoint: z.string().min(1),
      method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']),
      payload: z.any(),
      clientTimestamp: z.string().datetime().optional(),
    })
  ).min(1).max(100),
})

const resolveConflictSchema = z.object({
  resolution: z.enum(['use_server', 'use_client', 'merge']),
  clientData: z.any().optional(),
})

// ── Sync ────────────────────────────────────────────────────────────

export const syncData = async (req: Request, res: Response) => {
  try {
    const validated = syncDataSchema.parse(req.body)
    const userId = req.user?.userId

    const results = []

    for (const op of validated.operations) {
      try {
        // Queue each operation
        const queueItem = await prisma.syncQueue.create({
          data: {
            endpoint: op.endpoint,
            method: op.method,
            payload: op.payload,
            status: 'PENDING',
          },
        })
        results.push({ queueId: queueItem.id, status: 'queued', endpoint: op.endpoint, method: op.method })
      } catch (opError) {
        results.push({
          endpoint: op.endpoint,
          method: op.method,
          status: 'failed',
          error: opError instanceof Error ? opError.message : 'Unknown error',
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `${results.filter((r) => r.status === 'queued').length} operation(s) queued`,
      data: { results },
    })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const getSyncQueue = async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const where: any = {}
    if (status) where.status = status as string

    const [queue, total] = await Promise.all([
      prisma.syncQueue.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      prisma.syncQueue.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        queue,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    })
  } catch (error) {
    throw error
  }
}

export const processSyncQueue = async (req: Request, res: Response) => {
  try {
    // Process up to 50 pending items
    const pendingItems = await prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    const processed = []
    const failed = []

    for (const item of pendingItems) {
      try {
        // Mark as processing
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: 'PROCESSING',
            retryCount: { increment: 1 },
            lastRetry: new Date(),
          },
        })

        // Apply the operation based on endpoint/method
        // This is a simplified version — in production, this would route to the actual controller
        await applySyncOperation(item.endpoint, item.method, item.payload as Record<string, unknown>)

        // Mark as completed
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'COMPLETED' },
        })

        processed.push(item.id)
      } catch (opError) {
        const errorMessage = opError instanceof Error ? opError.message : 'Unknown error'

        if (item.retryCount >= 3) {
          // Max retries reached, mark as failed
          await prisma.syncQueue.update({
            where: { id: item.id },
            data: { status: 'FAILED', error: errorMessage },
          })
          failed.push(item.id)
        } else {
          // Revert to PENDING for retry
          await prisma.syncQueue.update({
            where: { id: item.id },
            data: { status: 'PENDING', error: errorMessage },
          })
          failed.push(item.id)
        }
      }
    }

    res.json({
      success: true,
      message: `${processed.length} processed, ${failed.length} failed`,
      data: { processed, failed, remaining: pendingItems.length },
    })
  } catch (error) {
    throw error
  }
}

export const clearSyncQueue = async (req: Request, res: Response) => {
  try {
    const { status } = req.query
    const where: any = {}
    if (status) where.status = status as string

    const result = await prisma.syncQueue.deleteMany({ where })

    res.json({
      success: true,
      message: `Cleared ${result.count} items from sync queue`,
      data: { deletedCount: result.count },
    })
  } catch (error) {
    throw error
  }
}

export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.syncQueue.count({ where: { status: 'PENDING' } }),
      prisma.syncQueue.count({ where: { status: 'PROCESSING' } }),
      prisma.syncQueue.count({ where: { status: 'COMPLETED' } }),
      prisma.syncQueue.count({ where: { status: 'FAILED' } }),
      prisma.syncQueue.count(),
    ])

    const recentItems = await prisma.syncQueue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        endpoint: true,
        method: true,
        status: true,
        retryCount: true,
        error: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: {
        total,
        pending,
        processing,
        completed,
        failed,
        summary: {
          pending,
          processing,
          completed,
          failed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 100,
        },
        recent: recentItems,
      },
    })
  } catch (error) {
    throw error
  }
}

export const forceSync = async (req: Request, res: Response) => {
  try {
    // Trigger immediate processing of queue
    // In production this would integrate with the sync engine
    const pendingCount = await prisma.syncQueue.count({ where: { status: 'PENDING' } })

    if (pendingCount === 0) {
      return res.json({ success: true, message: 'No pending items to sync', data: { processed: 0 } })
    }

    // Process synchronously (delegates to processSyncQueue logic)
    const result = await prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    let processed = 0
    for (const item of result) {
      try {
        await applySyncOperation(item.endpoint, item.method, item.payload as Record<string, unknown>)
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'COMPLETED', lastRetry: new Date(), retryCount: { increment: 1 } },
        })
        processed++
      } catch {
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'FAILED', lastRetry: new Date(), retryCount: { increment: 1 } },
        })
      }
    }

    res.json({
      success: true,
      message: `Forced sync: ${processed}/${result.length} processed`,
      data: { processed, total: result.length },
    })
  } catch (error) {
    throw error
  }
}

export const getConflicts = async (req: Request, res: Response) => {
  try {
    // Conflicts arise from failed sync items that had retries
    const conflicts = await prisma.syncQueue.findMany({
      where: {
        status: 'FAILED',
        retryCount: { gte: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    res.json({
      success: true,
      data: {
        conflicts: conflicts.map((c) => ({
          id: c.id,
          endpoint: c.endpoint,
          method: c.method,
          payload: c.payload,
          error: c.error,
          retryCount: c.retryCount,
          lastAttempt: c.lastRetry,
          createdAt: c.createdAt,
        })),
        total: conflicts.length,
      },
    })
  } catch (error) {
    throw error
  }
}

export const resolveConflict = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = resolveConflictSchema.parse(req.body)

    const item = await prisma.syncQueue.findUnique({ where: { id } })
    if (!item) throw new AppError('Sync item not found', 404)

    switch (validated.resolution) {
      case 'use_server': {
        // Discard the client's pending change
        await prisma.syncQueue.delete({ where: { id } })
        break
      }
      case 'use_client': {
        // Apply the client's data regardless of state
        try {
          await applySyncOperation(item.endpoint, item.method, item.payload as Record<string, unknown>)
          await prisma.syncQueue.update({
            where: { id },
            data: { status: 'COMPLETED', error: null },
          })
        } catch (applyError) {
          throw new AppError(
            `Failed to apply client data: ${applyError instanceof Error ? applyError.message : 'Unknown error'}`,
            500,
          )
        }
        break
      }
      case 'merge': {
        // Apply with client data override if provided, then mark completed
        const payloadToApply = validated.clientData || item.payload
        try {
          await applySyncOperation(item.endpoint, item.method, payloadToApply as Record<string, unknown>)
          await prisma.syncQueue.update({
            where: { id },
            data: { status: 'COMPLETED', error: null, payload: payloadToApply },
          })
        } catch (applyError) {
          throw new AppError(
            `Merge failed: ${applyError instanceof Error ? applyError.message : 'Unknown error'}`,
            500,
          )
        }
        break
      }
    }

    res.json({ success: true, message: `Conflict resolved (${validated.resolution})` })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

// ── Internal helper ─────────────────────────────────────────────────

/**
 * Applies a synced operation by routing it to the appropriate model.
 * This is a simplified dispatcher — in production, integrate with actual controllers.
 */
async function applySyncOperation(endpoint: string, method: string, payload: Record<string, unknown>): Promise<void> {
  const endpointPath = endpoint.split('?')[0] // strip query params

  // Generic operation routing based on endpoint pattern
  // Example: /api/students → create/update student
  // Example: /api/observations → create observation

  if (endpointPath.startsWith('/api/students') && (method === 'POST' || method === 'PUT')) {
    if (method === 'POST') {
      await prisma.student.create({ data: payload as any })
    } else {
      const id = extractIdFromEndpoint(endpointPath)
      if (id) await prisma.student.update({ where: { id }, data: payload as any })
    }
  } else if (endpointPath.startsWith('/api/observations') && method === 'POST') {
    await prisma.montessoriObservation.create({ data: payload as any })
  } else if (endpointPath.startsWith('/api/attendance') && method === 'POST') {
    await prisma.attendance.create({ data: payload as any })
  } else if (endpointPath.startsWith('/api/communications') && method === 'POST') {
    // Communications may be created from sync
    await prisma.communication.create({ data: payload as any })
  } else if (method === 'DELETE') {
    // Handle deletes from sync
    const model = inferModelFromEndpoint(endpointPath)
    const id = extractIdFromEndpoint(endpointPath)
    if (model && id) {
      await (prisma as any)[model].delete({ where: { id } })
    }
  } else {
    throw new Error(`No handler for ${method} ${endpointPath}`)
  }
}

function extractIdFromEndpoint(path: string): string | null {
  const parts = path.split('/').filter(Boolean)
  // Patterns: /api/students/:id, /api/observations/:id, etc.
  // parts = ['api', 'students', 'uuid-here']
  if (parts.length >= 3) {
    const candidate = parts[parts.length - 1]
    // Simple UUID check — just return the last path segment that looks like an id
    if (candidate.length >= 8) return candidate
  }
  return null
}

function inferModelFromEndpoint(path: string): string | null {
  if (path.includes('/students')) return 'student'
  if (path.includes('/observations')) return 'montessoriObservation'
  if (path.includes('/attendance')) return 'attendance'
  if (path.includes('/communications')) return 'communication'
  if (path.includes('/materials')) return 'montessoriMaterial'
  if (path.includes('/events')) return 'event'
  return null
}
