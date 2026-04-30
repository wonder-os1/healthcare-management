import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createMedicalRecordSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/medical-records
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { patientId, type } = req.query as Record<string, string>

    const where: any = {}

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
      if (patient) where.patientId = patient.id
    }

    if (patientId) where.patientId = patientId
    if (type) where.type = type

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalRecord.count({ where }),
    ])

    res.json({
      success: true,
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/medical-records/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: { select: { name: true } } } } },
    })

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' })
    }

    res.json({ success: true, data: record })
  } catch (error) {
    next(error)
  }
})

// POST /api/medical-records
router.post('/', authenticate, requireStaff, validate(createMedicalRecordSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const record = await prisma.medicalRecord.create({
      data: req.body,
      include: { patient: { include: { user: { select: { name: true } } } } },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'medical_record', entityId: record.id },
    })

    res.status(201).json({ success: true, data: record })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/medical-records/:id
router.patch('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const record = await prisma.medicalRecord.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.type && { type: req.body.type }),
      },
    })
    res.json({ success: true, data: record })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/medical-records/:id
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.medicalRecord.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Record deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as medicalRecordRoutes }
