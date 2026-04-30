import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireDoctor } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createPrescriptionSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/prescriptions
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { patientId, doctorId } = req.query as Record<string, string>

    const where: any = {}

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
      if (patient) where.patientId = patient.id
    } else if (req.user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } })
      if (doctor) where.doctorId = doctor.id
    }

    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          items: { include: { medicine: true } },
          patient: { include: { user: { select: { name: true, email: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
          appointment: { select: { id: true, date: true, startTime: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ])

    res.json({
      success: true,
      data: prescriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/prescriptions/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { medicine: true } },
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
          },
        },
        appointment: true,
      },
    })

    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' })
    }

    res.json({ success: true, data: prescription })
  } catch (error) {
    next(error)
  }
})

// POST /api/prescriptions
router.post('/', authenticate, requireDoctor, validate(createPrescriptionSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { items, ...prescriptionData } = req.body

    // If no doctorId provided, use the logged-in doctor
    if (!prescriptionData.doctorId && req.user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } })
      if (doctor) prescriptionData.doctorId = doctor.id
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: prescriptionData.patientId,
        doctorId: prescriptionData.doctorId,
        appointmentId: prescriptionData.appointmentId,
        diagnosis: prescriptionData.diagnosis,
        notes: prescriptionData.notes,
        followUpDate: prescriptionData.followUpDate ? new Date(prescriptionData.followUpDate) : undefined,
        items: {
          create: items.map((item: any) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
          })),
        },
      },
      include: {
        items: { include: { medicine: true } },
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        userId: prescription.patient.userId,
        type: 'PRESCRIPTION',
        title: 'New Prescription',
        message: `Dr. ${prescription.doctor.user.name} has issued a new prescription`,
        data: { prescriptionId: prescription.id },
      },
    })

    res.status(201).json({ success: true, data: prescription })
  } catch (error) {
    next(error)
  }
})

// GET /api/prescriptions/medicines/search?q=paracetamol
router.get('/medicines/search', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: [] })
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { genericName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    })

    res.json({ success: true, data: medicines })
  } catch (error) {
    next(error)
  }
})

export { router as prescriptionRoutes }
