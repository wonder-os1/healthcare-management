import { Router } from 'express'
import { prisma } from '../config/database'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'

const router = Router()

router.post('/', authenticate, requireRole('CLINIC_ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { name, phone, email, doctorId, reason } = req.body
    let patient = await prisma.patient.findFirst({ where: { user: { phone } }, include: { user: true } })
    let isNewPatient = false
    if (!patient) {
      isNewPatient = true
      const { hashPassword, generateSecurePassword } = require('../utils/password')
      const user = await prisma.user.create({
        data: { name, phone, email: email || phone + '@patient.local', password: await hashPassword(generateSecurePassword()), role: 'PATIENT' },
      })
      patient = await prisma.patient.create({ data: { userId: user.id }, include: { user: true } })
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const maxToken = await prisma.appointment.aggregate({ _max: { tokenNumber: true }, where: { date: { gte: today, lt: tomorrow } } })
    const tokenNumber = (maxToken._max.tokenNumber || 0) + 1
    const now = new Date()
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id, doctorId, date: now,
        startTime: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
        endTime: (now.getHours() + 1).toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
        type: 'WALK_IN', status: 'CHECKED_IN', tokenNumber, reason: reason || 'Walk-in consultation',
      },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })
    res.status(201).json({ data: { appointment, tokenNumber, isNewPatient } })
  } catch (error) { next(error) }
})

router.get('/queue', authenticate, async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const doctorId = req.query.doctorId as string | undefined
    const where: any = { date: { gte: today, lt: tomorrow } }
    if (doctorId) where.doctorId = doctorId
    const queue = await prisma.appointment.findMany({
      where, orderBy: { tokenNumber: 'asc' },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })
    res.json({ data: queue })
  } catch (error) { next(error) }
})

router.patch('/:id/checkin', authenticate, requireRole('CLINIC_ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const maxToken = await prisma.appointment.aggregate({ _max: { tokenNumber: true }, where: { date: { gte: today, lt: tomorrow } } })
    const tokenNumber = (maxToken._max.tokenNumber || 0) + 1
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id }, data: { status: 'CHECKED_IN', tokenNumber },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })
    res.json({ data: appointment })
  } catch (error) { next(error) }
})

export default router
