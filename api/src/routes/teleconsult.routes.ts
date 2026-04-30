import { Router } from 'express'
import { prisma } from '../config/database'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
router.use(requireFeature('telemedicine'))

router.get('/', authenticate, requireRole('DOCTOR', 'CLINIC_ADMIN'), async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const where: any = { type: 'TELECONSULT', date: { gte: today, lt: tomorrow } }
    if ((req as any).user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({ where: { userId: (req as any).user.id } })
      if (doctor) where.doctorId = doctor.id
    }
    const appointments = await prisma.appointment.findMany({
      where, orderBy: { startTime: 'asc' },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })
    res.json({ data: appointments })
  } catch (error) { next(error) }
})

router.post('/:id/start', authenticate, requireRole('DOCTOR'), async (req, res, next) => {
  try {
    const roomId = uuidv4()
    const joinUrl = `https://meet.jit.si/wonderos-${roomId}`
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', teleconsultMetadata: { roomId, joinUrl, startedAt: new Date().toISOString() } },
    })
    res.json({ data: { roomId, joinUrl, appointment } })
  } catch (error) { next(error) }
})

router.post('/:id/end', authenticate, requireRole('DOCTOR'), async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } })
    const meta = (appointment?.teleconsultMetadata as any) || {}
    const startedAt = meta.startedAt ? new Date(meta.startedAt) : new Date()
    const duration = Math.round((Date.now() - startedAt.getTime()) / 60000)
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', teleconsultMetadata: { ...meta, endedAt: new Date().toISOString(), duration } },
    })
    res.json({ data: updated })
  } catch (error) { next(error) }
})

router.get('/:id/room', authenticate, async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } })
    const meta = (appointment?.teleconsultMetadata as any) || {}
    res.json({ data: { roomId: meta.roomId, joinUrl: meta.joinUrl } })
  } catch (error) { next(error) }
})

export default router
