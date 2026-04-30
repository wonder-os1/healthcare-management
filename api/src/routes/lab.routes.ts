import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { validate } from '../middleware/validate'
import { createLabTestSchema, updateLabTestSchema, paginationSchema } from '../validators'

const router = Router()

// All lab routes are feature-gated
router.use(requireFeature('labIntegration'))

// GET /api/lab-tests
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { patientId, status } = req.query as Record<string, string>

    const where: any = {}
    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
      if (patient) where.patientId = patient.id
    }
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const [tests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        include: { patient: { include: { user: { select: { name: true } } } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.labTest.count({ where }),
    ])

    res.json({
      success: true,
      data: tests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/lab-tests/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const test = await prisma.labTest.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
    })
    if (!test) {
      return res.status(404).json({ success: false, error: 'Lab test not found' })
    }
    res.json({ success: true, data: test })
  } catch (error) {
    next(error)
  }
})

// POST /api/lab-tests
router.post('/', authenticate, requireStaff, validate(createLabTestSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const test = await prisma.labTest.create({
      data: req.body,
      include: { patient: { include: { user: { select: { name: true } } } } },
    })

    // Notification
    const patient = await prisma.patient.findUnique({ where: { id: test.patientId } })
    if (patient) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          type: 'LAB_RESULT',
          title: 'Lab Test Ordered',
          message: `Lab test "${test.testName}" has been ordered`,
          data: { labTestId: test.id },
        },
      })
    }

    res.status(201).json({ success: true, data: test })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/lab-tests/:id
router.patch('/:id', authenticate, requireStaff, validate(updateLabTestSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const data: any = {}
    if (req.body.status) data.status = req.body.status
    if (req.body.results) data.results = req.body.results
    if (req.body.notes !== undefined) data.notes = req.body.notes

    if (req.body.status === 'SAMPLE_COLLECTED') data.sampleDate = new Date()
    if (req.body.status === 'COMPLETED') data.resultDate = new Date()

    const test = await prisma.labTest.update({
      where: { id: req.params.id },
      data,
      include: { patient: { include: { user: { select: { name: true } } } } },
    })

    // Notify patient when results are ready
    if (req.body.status === 'COMPLETED') {
      const patient = await prisma.patient.findUnique({ where: { id: test.patientId } })
      if (patient) {
        await prisma.notification.create({
          data: {
            userId: patient.userId,
            type: 'LAB_RESULT',
            title: 'Lab Results Ready',
            message: `Results for "${test.testName}" are now available`,
            data: { labTestId: test.id },
          },
        })
      }
    }

    res.json({ success: true, data: test })
  } catch (error) {
    next(error)
  }
})

export { router as labRoutes }
