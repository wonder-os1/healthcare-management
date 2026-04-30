import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createAppointmentSchema, updateAppointmentStatusSchema, paginationSchema } from '../validators'
import { sendAppointmentConfirmation } from '../utils/email'

const router = Router()

// GET /api/appointments
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { doctorId, patientId, status, date } = req.query as Record<string, string>

    const where: any = {}

    // Role-based filtering
    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
      if (patient) where.patientId = patient.id
    } else if (req.user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } })
      if (doctor) where.doctorId = doctor.id
    }

    // Additional filters
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (date) where.date = new Date(date)

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } }, department: true } },
        },
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      }),
      prisma.appointment.count({ where }),
    ])

    res.json({
      success: true,
      data: appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/appointments/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true } }, department: true } },
        prescriptions: { include: { items: true } },
        invoice: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' })
    }

    res.json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
})

// POST /api/appointments
router.post('/', authenticate, validate(createAppointmentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { patientId, doctorId, date, startTime, endTime, type, reason } = req.body

    // Check for scheduling conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        startTime,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    })

    if (conflict) {
      return res.status(409).json({ success: false, error: 'This time slot is already booked' })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        type,
        reason,
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    })

    // Send confirmation email
    sendAppointmentConfirmation(appointment.patient.user.email, {
      patientName: appointment.patient.user.name,
      doctorName: appointment.doctor.user.name,
      date: new Date(date).toLocaleDateString('en-IN'),
      time: startTime,
    }).catch(console.error)

    // Create notification
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: 'APPOINTMENT',
        title: 'Appointment Scheduled',
        message: `Your appointment with Dr. ${appointment.doctor.user.name} is confirmed for ${startTime}`,
        data: { appointmentId: appointment.id },
      },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'appointment', entityId: appointment.id },
    })

    res.status(201).json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/appointments/:id/status
router.patch('/:id/status', authenticate, validate(updateAppointmentStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, notes, cancelReason } = req.body

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(notes && { notes }),
        ...(cancelReason && { cancelReason }),
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true, id: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    })

    // Create notification for status change
    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        type: 'APPOINTMENT',
        title: `Appointment ${status}`,
        message: `Your appointment with Dr. ${appointment.doctor.user.name} has been ${status.toLowerCase()}`,
        data: { appointmentId: appointment.id },
      },
    })

    res.json({ success: true, data: appointment })
  } catch (error) {
    next(error)
  }
})

export { router as appointmentRoutes }
