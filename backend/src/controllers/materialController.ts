import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'

// ── Zod validation schemas ──────────────────────────────────────────

const createMaterialSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  area: z.enum(['PRACTICAL_LIFE', 'SENSORIAL', 'LANGUAGE', 'MATHEMATICS', 'CULTURE', 'ART', 'MUSIC']),
  subArea: z.string().optional(),
  ageRange: z.string().optional(),
  quantityTotal: z.number().int().positive().default(1),
  location: z.string().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']).default('GOOD'),
  nextMaintenanceDate: z.string().datetime().optional(),
})

const updateMaterialSchema = createMaterialSchema.partial()

const checkOutSchema = z.object({
  studentId: z.string().uuid().optional(),
  conditionBefore: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']).optional(),
  notes: z.string().optional(),
})

const checkInSchema = z.object({
  conditionAfter: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']).optional(),
  notes: z.string().optional(),
})

const reportIssueSchema = z.object({
  issue: z.string().min(2).max(500),
  conditionAfter: z.enum(['FAIR', 'POOR', 'BROKEN']),
})

const scheduleMaintenanceSchema = z.object({
  maintenanceDate: z.string().datetime(),
  notes: z.string().optional(),
})

// ── Helpers ─────────────────────────────────────────────────────────

function parseISOOrThrow(dateStr: string, label: string): Date {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new AppError(`Invalid ${label}`, 400)
  return d
}

// ── Material CRUD ───────────────────────────────────────────────────

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const validated = createMaterialSchema.parse(req.body)

    const material = await prisma.montessoriMaterial.create({
      data: {
        name: validated.name,
        description: validated.description,
        area: validated.area,
        subArea: validated.subArea,
        ageRange: validated.ageRange,
        quantityTotal: validated.quantityTotal,
        quantityAvailable: validated.quantityTotal,
        location: validated.location,
        condition: validated.condition,
        nextMaintenanceDate: validated.nextMaintenanceDate
          ? parseISOOrThrow(validated.nextMaintenanceDate, 'nextMaintenanceDate')
          : null,
      },
    })

    res.status(201).json({ success: true, message: 'Material created', data: { material } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { area, condition, isAvailable, search, page = '1', limit = '20' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const where: any = {}
    if (area) where.area = area as string
    if (condition) where.condition = condition as string
    if (isAvailable === 'true') where.isAvailable = true
    if (isAvailable === 'false') where.isAvailable = false
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    const [materials, total] = await Promise.all([
      prisma.montessoriMaterial.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.montessoriMaterial.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        materials,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    })
  } catch (error) {
    throw error
  }
}

export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const material = await prisma.montessoriMaterial.findUnique({
      where: { id },
      include: {
        usageRecords: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { checkOutTime: 'desc' },
          take: 20,
        },
      },
    })

    if (!material) throw new AppError('Material not found', 404)

    res.json({ success: true, data: { material } })
  } catch (error) {
    throw error
  }
}

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = updateMaterialSchema.parse(req.body)

    const existing = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!existing) throw new AppError('Material not found', 404)

    const updateData: any = { ...validated }
    if (validated.quantityTotal !== undefined) {
      // Adjust available count proportionally
      const diff = validated.quantityTotal - existing.quantityTotal
      updateData.quantityAvailable = existing.quantityAvailable + diff
    }
    if (validated.nextMaintenanceDate) {
      updateData.nextMaintenanceDate = parseISOOrThrow(validated.nextMaintenanceDate, 'nextMaintenanceDate')
    }

    const material = await prisma.montessoriMaterial.update({
      where: { id },
      data: updateData,
    })

    res.json({ success: true, message: 'Material updated', data: { material } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const existing = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!existing) throw new AppError('Material not found', 404)

    // Check if currently checked out
    const activeUsage = await prisma.materialUsage.findFirst({
      where: { materialId: id, checkInTime: null },
    })
    if (activeUsage) throw new AppError('Cannot delete material that is currently checked out', 400)

    await prisma.materialUsage.deleteMany({ where: { materialId: id } })
    await prisma.montessoriMaterial.delete({ where: { id } })

    res.json({ success: true, message: 'Material deleted' })
  } catch (error) {
    throw error
  }
}

// ── Check-out / Check-in ───────────────────────────────────────────

export const checkOutMaterial = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const userId = req.user?.userId
    const validated = checkOutSchema.parse(req.body)

    const material = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!material) throw new AppError('Material not found', 404)
    if (!material.isAvailable) throw new AppError('Material is not available for checkout', 400)
    if (material.quantityAvailable < 1) throw new AppError('No available copies to check out', 400)

    // Check if student exists if provided
    if (validated.studentId) {
      const student = await prisma.student.findUnique({ where: { id: validated.studentId } })
      if (!student) throw new AppError('Student not found', 404)
    }

    const usage = await prisma.materialUsage.create({
      data: {
        materialId: id,
        studentId: validated.studentId || null,
        teacherId: userId!,
        checkOutTime: new Date(),
        conditionBefore: validated.conditionBefore || null,
        notes: validated.notes,
      },
      include: {
        material: { select: { id: true, name: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Decrement available count and set unavailable if zero
    const newAvailable = material.quantityAvailable - 1
    await prisma.montessoriMaterial.update({
      where: { id },
      data: {
        quantityAvailable: newAvailable,
        isAvailable: newAvailable > 0,
      },
    })

    res.status(201).json({ success: true, message: 'Material checked out', data: { usage } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const checkInMaterial = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = checkInSchema.parse(req.body)

    const material = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!material) throw new AppError('Material not found', 404)

    // Find the most recent unchecked-out usage for this material
    const usage = await prisma.materialUsage.findFirst({
      where: { materialId: id, checkInTime: null },
      orderBy: { checkOutTime: 'desc' },
    })
    if (!usage) throw new AppError('No active checkout found for this material', 400)

    const updated = await prisma.materialUsage.update({
      where: { id: usage.id },
      data: {
        checkInTime: new Date(),
        conditionAfter: validated.conditionAfter || null,
        notes: validated.notes
          ? usage.notes ? `${usage.notes}; ${validated.notes}` : validated.notes
          : usage.notes,
      },
    })

    // Increment available count and mark as available
    const newAvailable = material.quantityAvailable + 1
    const updateData: any = { quantityAvailable: newAvailable, isAvailable: true }
    if (validated.conditionAfter) {
      updateData.condition = validated.conditionAfter
    }

    await prisma.montessoriMaterial.update({
      where: { id },
      data: updateData,
    })

    res.json({ success: true, message: 'Material checked in', data: { usage: updated } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

// ── Usage & Stats ──────────────────────────────────────────────────

export const getMaterialUsage = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const { page = '1', limit = '20' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const existing = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!existing) throw new AppError('Material not found', 404)

    const [usage, total] = await Promise.all([
      prisma.materialUsage.findMany({
        where: { materialId: id },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { checkOutTime: 'desc' },
        skip,
        take,
      }),
      prisma.materialUsage.count({ where: { materialId: id } }),
    ])

    res.json({
      success: true,
      data: {
        usage,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    })
  } catch (error) {
    throw error
  }
}

export const getMaterialStats = async (req: Request, res: Response) => {
  try {
    const [totalMaterials, availableCount, checkedOutCount, conditionBreakdown, areaBreakdown] =
      await Promise.all([
        prisma.montessoriMaterial.count(),
        prisma.montessoriMaterial.count({ where: { isAvailable: true, quantityAvailable: { gt: 0 } } }),
        prisma.materialUsage.count({ where: { checkInTime: null } }),
        prisma.montessoriMaterial.groupBy({
          by: ['condition'],
          _count: true,
        }),
        prisma.montessoriMaterial.groupBy({
          by: ['area'],
          _count: true,
        }),
      ])

    const maintenanceNeeded = await prisma.montessoriMaterial.count({
      where: {
        nextMaintenanceDate: { lte: new Date() },
        condition: { in: ['FAIR', 'POOR', 'BROKEN'] },
      },
    })

    res.json({
      success: true,
      data: {
        totalMaterials,
        availableCount,
        checkedOutCount,
        maintenanceNeeded,
        conditionBreakdown: conditionBreakdown.map((c) => ({ condition: c.condition, count: c._count })),
        areaBreakdown: areaBreakdown.map((a) => ({ area: a.area, count: a._count })),
        utilizationRate:
          totalMaterials > 0
            ? Math.round((checkedOutCount / (checkedOutCount + availableCount)) * 100)
            : 0,
      },
    })
  } catch (error) {
    throw error
  }
}

// ── Maintenance & Issues ────────────────────────────────────────────

export const reportMaterialIssue = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = reportIssueSchema.parse(req.body)

    const material = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!material) throw new AppError('Material not found', 404)

    const updated = await prisma.montessoriMaterial.update({
      where: { id },
      data: {
        condition: validated.conditionAfter,
        isAvailable: validated.conditionAfter !== 'BROKEN' ? material.isAvailable : false,
      },
    })

    // Create an audit trail via usage records (treat as note on current active usage if exists)
    const activeUsage = await prisma.materialUsage.findFirst({
      where: { materialId: id, checkInTime: null },
    })
    if (activeUsage) {
      await prisma.materialUsage.update({
        where: { id: activeUsage.id },
        data: {
          conditionAfter: validated.conditionAfter,
          notes: activeUsage.notes
            ? `${activeUsage.notes}; ISSUE: ${validated.issue}`
            : `ISSUE: ${validated.issue}`,
        },
      })
    }

    res.json({
      success: true,
      message: 'Issue reported',
      data: { material: updated, issue: validated.issue },
    })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const scheduleMaintenance = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = scheduleMaintenanceSchema.parse(req.body)
    const maintenanceDate = parseISOOrThrow(validated.maintenanceDate, 'maintenanceDate')

    const material = await prisma.montessoriMaterial.findUnique({ where: { id } })
    if (!material) throw new AppError('Material not found', 404)

    // Schedule by updating next maintenance date
    const updated = await prisma.montessoriMaterial.update({
      where: { id },
      data: {
        nextMaintenanceDate: maintenanceDate,
        isAvailable: false, // Mark unavailable until maintenance is done
      },
    })

    res.json({
      success: true,
      message: 'Maintenance scheduled',
      data: { material: updated, scheduledDate: validated.maintenanceDate, notes: validated.notes },
    })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}
