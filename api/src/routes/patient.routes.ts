import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { hashPassword, generateSecurePassword } from '../utils/password'
import { createPatientSchema, updatePatientSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/patients
router.get('/', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
            { user: { phone: { contains: search } } },
          ],
        }
      : {}

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ])

    res.json({
      success: true,
      data: patients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/patients/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } },
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: { doctor: { include: { user: { select: { name: true } } } } },
        },
        prescriptions: { take: 5, orderBy: { createdAt: 'desc' } },
        invoices: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' })
    }

    // Patients can only view their own profile
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    res.json({ success: true, data: patient })
  } catch (error) {
    next(error)
  }
})

// POST /api/patients
router.post('/', authenticate, requireStaff, validate(createPatientSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, email, phone, password, ...patientData } = req.body

    // Create user + patient in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: await hashPassword(password || generateSecurePassword()),
          role: 'PATIENT',
        },
      })

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : undefined,
          gender: patientData.gender,
          bloodGroup: patientData.bloodGroup,
          allergies: patientData.allergies || [],
          address: patientData.address,
          city: patientData.city,
          state: patientData.state,
          pincode: patientData.pincode,
          emergencyContact: patientData.emergencyContact,
          emergencyPhone: patientData.emergencyPhone,
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      })

      await tx.auditLog.create({
        data: { userId: req.user!.userId, action: 'CREATE', entity: 'patient', entityId: patient.id },
      })

      return patient
    })

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/patients/:id
router.patch('/:id', authenticate, validate(updatePatientSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } })
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' })
    }

    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const { name, email, phone, ...patientData } = req.body

    const updated = await prisma.$transaction(async (tx) => {
      if (name || email || phone) {
        await tx.user.update({
          where: { id: patient.userId },
          data: { ...(name && { name }), ...(phone && { phone }) },
        })
      }

      return tx.patient.update({
        where: { id: req.params.id },
        data: {
          ...(patientData.dateOfBirth && { dateOfBirth: new Date(patientData.dateOfBirth) }),
          ...(patientData.gender !== undefined && { gender: patientData.gender }),
          ...(patientData.bloodGroup !== undefined && { bloodGroup: patientData.bloodGroup }),
          ...(patientData.allergies && { allergies: patientData.allergies }),
          ...(patientData.address !== undefined && { address: patientData.address }),
          ...(patientData.city !== undefined && { city: patientData.city }),
          ...(patientData.state !== undefined && { state: patientData.state }),
          ...(patientData.pincode !== undefined && { pincode: patientData.pincode }),
          ...(patientData.emergencyContact !== undefined && { emergencyContact: patientData.emergencyContact }),
          ...(patientData.emergencyPhone !== undefined && { emergencyPhone: patientData.emergencyPhone }),
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      })
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// GET /api/patients/:id/history
router.get('/:id/history', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } })
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' })
    }

    // Patients can only view their own history
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const [appointments, prescriptions, medicalRecords, labTests, counts] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: req.params.id },
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prescription.findMany({
        where: { patientId: req.params.id },
        include: { items: true, doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalRecord.findMany({
        where: { patientId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.labTest.findMany({
        where: { patientId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      Promise.all([
        prisma.appointment.count({ where: { patientId: req.params.id } }),
        prisma.prescription.count({ where: { patientId: req.params.id } }),
        prisma.medicalRecord.count({ where: { patientId: req.params.id } }),
        prisma.labTest.count({ where: { patientId: req.params.id } }),
      ]),
    ])

    res.json({
      success: true,
      data: { appointments, prescriptions, medicalRecords, labTests },
      pagination: {
        page,
        limit,
        counts: {
          appointments: counts[0],
          prescriptions: counts[1],
          medicalRecords: counts[2],
          labTests: counts[3],
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/patients/:id
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Patient deleted' })
  } catch (error) {
    next(error)
  }
})

export { router as patientRoutes }
