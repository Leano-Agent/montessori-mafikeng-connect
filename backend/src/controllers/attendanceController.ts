import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'
import type { ParsedQs } from 'qs'

// ── Helpers for query params ────────────────────────────────────────

function squery(val: ParsedQs[string]): string | undefined {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return String(val[0])
  return undefined
}

// ── Zod validation schemas ──────────────────────────────────────────

const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  absenceReason: z.string().optional(),
  notes: z.string().optional(),
})

const updateAttendanceSchema = markAttendanceSchema.partial()

const bulkAttendanceSchema = z.object({
  date: z.string().datetime(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      checkInTime: z.string().datetime().optional(),
      checkOutTime: z.string().datetime().optional(),
      absenceReason: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1).max(200),
})

// ── Helpers ─────────────────────────────────────────────────────────

function parseISOOrThrow(dateStr: string, label: string): Date {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new AppError(`Invalid ${label} date`, 400)
  return d
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// ── Attendance CRUD ─────────────────────────────────────────────────

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const validated = markAttendanceSchema.parse(req.body)
    const userId = req.user?.userId
    const recordDate = parseISOOrThrow(validated.date, 'date')

    // Check student exists
    const student = await prisma.student.findUnique({ where: { id: validated.studentId } })
    if (!student) throw new AppError('Student not found', 404)

    // Check for duplicate (one attendance per student per day)
    const existing = await prisma.attendance.findUnique({
      where: { studentId_date: { studentId: validated.studentId, date: recordDate } },
    })
    if (existing) {
      // Update instead
      const updated = await prisma.attendance.update({
        where: { studentId_date: { studentId: validated.studentId, date: recordDate } },
        data: {
          status: validated.status,
          checkInTime: validated.checkInTime ? parseISOOrThrow(validated.checkInTime, 'checkInTime') : undefined,
          checkOutTime: validated.checkOutTime ? parseISOOrThrow(validated.checkOutTime, 'checkOutTime') : undefined,
          absenceReason: validated.absenceReason,
          notes: validated.notes,
          notedById: userId,
        },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      })
      return res.json({ success: true, message: 'Attendance updated', data: { attendance: updated } })
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: validated.studentId,
        date: recordDate,
        status: validated.status,
        checkInTime: validated.checkInTime ? parseISOOrThrow(validated.checkInTime, 'checkInTime') : null,
        checkOutTime: validated.checkOutTime ? parseISOOrThrow(validated.checkOutTime, 'checkOutTime') : null,
        absenceReason: validated.absenceReason,
        notes: validated.notes,
        notedById: userId,
      },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    })

    res.status(201).json({ success: true, message: 'Attendance marked', data: { attendance } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const studentId = squery(req.query.studentId)
    const status = squery(req.query.status)
    const page = squery(req.query.page) || '1'
    const limit = squery(req.query.limit) || '50'
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (status) where.status = status

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          notedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.attendance.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        attendance,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    })
  } catch (error) {
    throw error
  }
}

export const getAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const date: string = req.params.date as string
    const recordDate = parseISOOrThrow(date, 'date')
    const classroomId = squery(req.query.classroomId)

    const dateStart = startOfDay(recordDate)
    const dateEnd = endOfDay(recordDate)

    const where: any = {
      date: { gte: dateStart, lte: dateEnd },
    }

    // If classroomId provided, filter students in that classroom
    if (classroomId) {
      const studentIds = await prisma.student.findMany({
        where: { classroomId: classroomId as string, isActive: true },
        select: { id: true },
      })
      where.studentId = { in: studentIds.map((s) => s.id) }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        notedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { student: { firstName: 'asc' } },
    })

    res.json({ success: true, data: { attendance } })
  } catch (error) {
    throw error
  }
}

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = updateAttendanceSchema.parse(req.body)

    const existing = await prisma.attendance.findUnique({ where: { id } })
    if (!existing) throw new AppError('Attendance record not found', 404)

    const updateData: any = { ...validated }
    if (validated.date) updateData.date = parseISOOrThrow(validated.date, 'date')
    if (validated.checkInTime) updateData.checkInTime = parseISOOrThrow(validated.checkInTime, 'checkInTime')
    if (validated.checkOutTime) updateData.checkOutTime = parseISOOrThrow(validated.checkOutTime, 'checkOutTime')

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { ...updateData, notedById: req.user?.userId },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    })

    res.json({ success: true, message: 'Attendance updated', data: { attendance } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const existing = await prisma.attendance.findUnique({ where: { id } })
    if (!existing) throw new AppError('Attendance record not found', 404)

    await prisma.attendance.delete({ where: { id } })

    res.json({ success: true, message: 'Attendance record deleted' })
  } catch (error) {
    throw error
  }
}

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params
    const startDate = squery(req.query.startDate)
    const endDate = squery(req.query.endDate)
    const page = squery(req.query.page) || '1'
    const limit = squery(req.query.limit) || '50'

    const where: any = { studentId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseISOOrThrow(startDate as string, 'startDate')
      if (endDate) where.date.lte = endOfDay(parseISOOrThrow(endDate as string, 'endDate'))
    }

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { notedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.attendance.count({ where }),
    ])

    // Stats
    const totalDays = attendance.length
    const presentDays = attendance.filter((a) => a.status === 'PRESENT').length
    const absentDays = attendance.filter((a) => a.status === 'ABSENT').length
    const lateDays = attendance.filter((a) => a.status === 'LATE').length

    res.json({
      success: true,
      data: {
        attendance,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        },
      },
    })
  } catch (error) {
    throw error
  }
}

export const getClassroomAttendance = async (req: Request, res: Response) => {
  try {
    const classroomId: string = req.params.classroomId as string
    const date = squery(req.query.date)
    const startDate = squery(req.query.startDate)
    const endDate = squery(req.query.endDate)

    // Get students in this classroom
    const students = await prisma.student.findMany({
      where: { classroomId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    })

    const studentIds = students.map((s) => s.id)

    const where: any = { studentId: { in: studentIds } }

    if (date) {
      const d = parseISOOrThrow(date as string, 'date')
      where.date = { gte: startOfDay(d), lte: endOfDay(d) }
    } else if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseISOOrThrow(startDate as string, 'startDate')
      if (endDate) where.date.lte = endOfDay(parseISOOrThrow(endDate as string, 'endDate'))
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ date: 'desc' }, { student: { firstName: 'asc' } }],
    })

    // Build per-student summary
    const studentSummary = students.map((student) => {
      const records = attendance.filter((a) => a.studentId === student.id)
      return {
        student,
        totalDays: records.length,
        presentDays: records.filter((a) => a.status === 'PRESENT').length,
        absentDays: records.filter((a) => a.status === 'ABSENT').length,
        lateDays: records.filter((a) => a.status === 'LATE').length,
        attendanceRate: records.length > 0
          ? Math.round((records.filter((a) => a.status === 'PRESENT').length / records.length) * 100)
          : 0,
      }
    })

    res.json({ success: true, data: { students: studentSummary, attendance } })
  } catch (error) {
    throw error
  }
}

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const classroomId = squery(req.query.classroomId)
    const startDate = squery(req.query.startDate)
    const endDate = squery(req.query.endDate)

    const where: any = {}
    if (classroomId) {
      const studentIds = await prisma.student.findMany({
        where: { classroomId: classroomId as string, isActive: true },
        select: { id: true },
      })
      where.studentId = { in: studentIds.map((s) => s.id) }
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseISOOrThrow(startDate as string, 'startDate')
      if (endDate) where.date.lte = endOfDay(parseISOOrThrow(endDate as string, 'endDate'))
    }

    const [totalRecords, statusBreakdown, todayRecords] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.attendance.count({
        where: {
          ...where,
          date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
        },
      }),
    ])

    const total = statusBreakdown.reduce((sum, s) => sum + s._count, 0)

    res.json({
      success: true,
      data: {
        totalRecords,
        todayRecords,
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: s._count,
          percentage: total > 0 ? Math.round((s._count / total) * 100) : 0,
        })),
      },
    })
  } catch (error) {
    throw error
  }
}

export const exportAttendance = async (req: Request, res: Response) => {
  try {
    const startDate = squery(req.query.startDate)
    const endDate = squery(req.query.endDate)
    const classroomId = squery(req.query.classroomId)
    const format = squery(req.query.format) || 'json'

    const now = new Date()
    const where: any = {
      date: {
        gte: startDate ? parseISOOrThrow(startDate as string, 'startDate') : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        lte: endDate ? endOfDay(parseISOOrThrow(endDate as string, 'endDate')) : endOfDay(now),
      },
    }

    if (classroomId) {
      const studentIds = await prisma.student.findMany({
        where: { classroomId: classroomId as string, isActive: true },
        select: { id: true },
      })
      where.studentId = { in: studentIds.map((s) => s.id) }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, classroom: { select: { name: true } } } },
      },
      orderBy: [{ date: 'asc' }, { student: { firstName: 'asc' } }],
    })

    const exportData = records.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      classroom: r.student.classroom?.name || 'N/A',
      status: r.status,
      checkInTime: r.checkInTime?.toISOString().split('T')[1]?.split('.')[0] || '',
      checkOutTime: r.checkOutTime?.toISOString().split('T')[1]?.split('.')[0] || '',
      absenceReason: r.absenceReason || '',
      notes: r.notes || '',
    }))

    if (format === 'csv') {
      const header = 'Date,Student Name,Classroom,Status,Check In,Check Out,Absence Reason,Notes'
      const csvRows = exportData.map((r) =>
        `"${r.date}","${r.studentName}","${r.classroom}","${r.status}","${r.checkInTime}","${r.checkOutTime}","${r.absenceReason}","${r.notes}"`
      )
      const csv = [header, ...csvRows].join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-export.csv')
      return res.send(csv)
    }

    res.json({ success: true, data: { records: exportData, total: exportData.length } })
  } catch (error) {
    throw error
  }
}
