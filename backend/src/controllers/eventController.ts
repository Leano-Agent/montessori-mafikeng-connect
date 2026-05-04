import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../services/database'
import { AppError } from '../utils/AppError'

// ── Helpers for query params ────────────────────────────────────────

import type { ParsedQs } from 'qs'

function squery(val: ParsedQs[string]): string | undefined {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return String(val[0])
  return undefined
}

// ── Zod validation schemas ──────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  eventType: z.enum(['SCHOOL_EVENT', 'PARENT_TEACHER', 'VOLUNTEER', 'FUNDRAISER', 'HOLIDAY']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  maxVolunteers: z.number().int().positive().optional(),
})

const updateEventSchema = createEventSchema.partial()

// ── Helpers ─────────────────────────────────────────────────────────

function parseISOOrThrow(dateStr: string, label: string): Date {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new AppError(`Invalid ${label} date`, 400)
  return d
}

// ── Event CRUD ──────────────────────────────────────────────────────

export const createEvent = async (req: Request, res: Response) => {
  try {
    const validated = createEventSchema.parse(req.body)
    const userId = req.user?.userId

    const event = await prisma.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        eventType: validated.eventType,
        startTime: parseISOOrThrow(validated.startTime, 'startTime'),
        endTime: parseISOOrThrow(validated.endTime, 'endTime'),
        location: validated.location,
        maxVolunteers: validated.maxVolunteers,
        organizerId: userId,
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { volunteers: true } },
      },
    })

    res.status(201).json({ success: true, message: 'Event created', data: { event } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const getEvents = async (req: Request, res: Response) => {
  try {
    const eventType = squery(req.query.eventType)
    const isPublished = squery(req.query.isPublished)
    const page = squery(req.query.page) || '1'
    const limit = squery(req.query.limit) || '20'
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const where: any = {}
    if (eventType) where.eventType = eventType as string
    if (isPublished === 'true') where.isPublished = true
    if (isPublished === 'false') where.isPublished = false

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { volunteers: true } },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take,
      }),
      prisma.event.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        events,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    })
  } catch (error) {
    throw error
  }
}

export const getEventById = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        volunteers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    if (!event) throw new AppError('Event not found', 404)

    res.json({ success: true, data: { event } })
  } catch (error) {
    throw error
  }
}

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const validated = updateEventSchema.parse(req.body)

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) throw new AppError('Event not found', 404)

    const updateData: any = { ...validated }
    if (validated.startTime) updateData.startTime = parseISOOrThrow(validated.startTime, 'startTime')
    if (validated.endTime) updateData.endTime = parseISOOrThrow(validated.endTime, 'endTime')

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { volunteers: true } },
      },
    })

    res.json({ success: true, message: 'Event updated', data: { event } })
  } catch (error) {
    if (error instanceof z.ZodError) throw new AppError('Validation failed', 400, error.errors)
    throw error
  }
}

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) throw new AppError('Event not found', 404)

    // Delete associated volunteers first
    await prisma.eventVolunteer.deleteMany({ where: { eventId: id } })
    await prisma.event.delete({ where: { id } })

    res.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    throw error
  }
}

// ── Publishing ──────────────────────────────────────────────────────

export const publishEvent = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) throw new AppError('Event not found', 404)

    const event = await prisma.event.update({
      where: { id },
      data: { isPublished: true },
      include: { _count: { select: { volunteers: true } } },
    })

    res.json({ success: true, message: 'Event published', data: { event } })
  } catch (error) {
    throw error
  }
}

export const unpublishEvent = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) throw new AppError('Event not found', 404)

    const event = await prisma.event.update({
      where: { id },
      data: { isPublished: false },
      include: { _count: { select: { volunteers: true } } },
    })

    res.json({ success: true, message: 'Event unpublished', data: { event } })
  } catch (error) {
    throw error
  }
}

// ── Registration / Volunteer signup ─────────────────────────────────

export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const userId = req.user?.userId
    const { role } = req.body

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) throw new AppError('Event not found', 404)
    if (!event.isPublished) throw new AppError('Event is not open for registration', 400)

    // Check volunteer limit
    if (event.maxVolunteers && event.currentVolunteers >= event.maxVolunteers) {
      throw new AppError('Event volunteer capacity reached', 400)
    }

    // Check if already registered
    const existing = await prisma.eventVolunteer.findUnique({
      where: { eventId_userId: { eventId: id, userId: userId! } },
    })
    if (existing) throw new AppError('Already registered for this event', 409)

    const volunteer = await prisma.eventVolunteer.create({
      data: {
        eventId: id,
        userId: userId!,
        role: role || undefined,
      },
    })

    // Increment volunteer count
    await prisma.event.update({
      where: { id },
      data: { currentVolunteers: { increment: 1 } },
    })

    res.status(201).json({ success: true, message: 'Registered for event', data: { volunteer } })
  } catch (error) {
    throw error
  }
}

export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string
    const userId = req.user?.userId

    const existing = await prisma.eventVolunteer.findUnique({
      where: { eventId_userId: { eventId: id, userId: userId! } },
    })
    if (!existing) throw new AppError('Registration not found', 404)

    await prisma.eventVolunteer.delete({
      where: { eventId_userId: { eventId: id, userId: userId! } },
    })

    // Decrement volunteer count
    await prisma.event.update({
      where: { id },
      data: { currentVolunteers: { decrement: 1 } },
    })

    res.json({ success: true, message: 'Registration cancelled' })
  } catch (error) {
    throw error
  }
}

export const getEventRegistrations = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id as string

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) throw new AppError('Event not found', 404)

    const registrations = await prisma.eventVolunteer.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: { registrations } })
  } catch (error) {
    throw error
  }
}

// ── Query helpers ───────────────────────────────────────────────────

export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const qLimit = squery(req.query.limit) || '10'
    const eventType = squery(req.query.eventType)
    const take = Number(qLimit)

    const where: any = {
      startTime: { gte: new Date() },
      isPublished: true,
    }
    if (eventType) where.eventType = eventType as string

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { volunteers: true } },
      },
      orderBy: { startTime: 'asc' },
      take,
    })

    res.json({ success: true, data: { events } })
  } catch (error) {
    throw error
  }
}

export const getEventStats = async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalEvents, publishedEvents, upcomingEvents, volunteersThisMonth, eventsByType] =
      await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { isPublished: true } }),
        prisma.event.count({ where: { startTime: { gte: now }, isPublished: true } }),
        prisma.eventVolunteer.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
        prisma.event.groupBy({
          by: ['eventType'],
          _count: true,
        }),
      ])

    res.json({
      success: true,
      data: {
        totalEvents,
        publishedEvents,
        upcomingEvents,
        volunteersThisMonth,
        eventsByType: eventsByType.map((e) => ({ type: e.eventType, count: e._count })),
      },
    })
  } catch (error) {
    throw error
  }
}
