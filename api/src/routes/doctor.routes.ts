import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin, requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { hashPassword, generateSecurePassword } from '../utils/password'
import { createDoctorSchema, updateDoctorSchema, paginationSchema } from '../validators'
import { env } from '../config/env'

const router = Router()

// GET /api/doctors
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
            { specialization: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          department: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ])

    res.json({
      success: true,
      data: doctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/doctors/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        department: true,
      },
    })

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' })
    }

    res.json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
})

// GET /api/doctors/:id/slots?date=2024-03-15
router.get('/:id/slots', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { date } = req.query
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date parameter required' })
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: { schedule: true, isAvailable: true },
    })

    if (!doctor || !doctor.isAvailable) {
      return res.json({ success: true, data: [] })
    }

    const targetDate = new Date(date as string)
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][targetDate.getDay()]

    const schedule = (doctor.schedule as Record<string, Array<{ start: string; end: string }>>) || {}
    const daySchedule = schedule[dayOfWeek] || []

    if (daySchedule.length === 0) {
      return res.json({ success: true, data: [] })
    }

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        date: targetDate,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { startTime: true, endTime: true },
    })

    const bookedSlots = new Set(existingAppointments.map((a) => a.startTime))

    // Generate slots
    const slotDuration = env.BUSINESS_SLOT_DURATION
    const slots: Array<{ startTime: string; endTime: string; available: boolean }> = []

    for (const block of daySchedule) {
      const [startHour, startMin] = block.start.split(':').map(Number)
      const [endHour, endMin] = block.end.split(':').map(Number)
      let currentMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      while (currentMinutes + slotDuration <= endMinutes) {
        const startTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
        const nextMinutes = currentMinutes + slotDuration
        const endTime = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`

        slots.push({
          startTime,
          endTime,
          available: !bookedSlots.has(startTime),
        })

        currentMinutes = nextMinutes
      }
    }

    res.json({ success: true, data: slots })
  } catch (error) {
    next(error)
  }
})

// POST /api/doctors
router.post('/', authenticate, requireAdmin, validate(createDoctorSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, email, phone, password, ...doctorData } = req.body

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: await hashPassword(password || generateSecurePassword()),
          role: 'DOCTOR',
        },
      })

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialization: doctorData.specialization,
          qualifications: doctorData.qualifications || [],
          experience: doctorData.experience || 0,
          consultationFee: doctorData.consultationFee || 50000,
          bio: doctorData.bio,
          departmentId: doctorData.departmentId,
          schedule: doctorData.schedule || {
            mon: [{ start: '09:00', end: '17:00' }],
            tue: [{ start: '09:00', end: '17:00' }],
            wed: [{ start: '09:00', end: '17:00' }],
            thu: [{ start: '09:00', end: '17:00' }],
            fri: [{ start: '09:00', end: '17:00' }],
            sat: [{ start: '09:00', end: '13:00' }],
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
        },
      })

      return doctor
    })

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/doctors/:id
router.patch('/:id', authenticate, requireAdmin, validate(updateDoctorSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, phone, ...doctorData } = req.body

    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } })
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (name || phone) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: { ...(name && { name }), ...(phone && { phone }) },
        })
      }

      return tx.doctor.update({
        where: { id: req.params.id },
        data: {
          ...(doctorData.specialization && { specialization: doctorData.specialization }),
          ...(doctorData.qualifications && { qualifications: doctorData.qualifications }),
          ...(doctorData.experience !== undefined && { experience: doctorData.experience }),
          ...(doctorData.consultationFee !== undefined && { consultationFee: doctorData.consultationFee }),
          ...(doctorData.bio !== undefined && { bio: doctorData.bio }),
          ...(doctorData.departmentId !== undefined && { departmentId: doctorData.departmentId }),
          ...(doctorData.schedule && { schedule: doctorData.schedule }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          department: true,
        },
      })
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

export { router as doctorRoutes }
