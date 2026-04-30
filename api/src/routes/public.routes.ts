import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isAvailable: true },
      include: { user: { select: { name: true, email: true } }, department: true },
      orderBy: { user: { name: 'asc' } },
    })
    res.json({ data: doctors })
  } catch (error) { next(error) }
})

router.get('/doctors/:id/slots', async (req, res, next) => {
  try {
    const { date } = req.query
    if (!date) return res.status(400).json({ error: 'date query param required' })
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } })
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    const schedule = (doctor.schedule as any) || {}
    const targetDate = new Date(date as string)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[targetDate.getDay()]
    const daySchedule = schedule[dayOfWeek] || schedule[targetDate.getDay()] || []
    const dateStart = new Date(date as string); dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(dateStart); dateEnd.setDate(dateEnd.getDate() + 1)
    const existingAppts = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id, date: { gte: dateStart, lt: dateEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { startTime: true, endTime: true },
    })
    const bookedSlots = new Set(existingAppts.map((a) => a.startTime))
    const slotDuration = 30
    const slots: any[] = []
    if (Array.isArray(daySchedule)) {
      daySchedule.forEach((block: any) => {
        const [startH, startM] = (block.start || '09:00').split(':').map(Number)
        const [endH, endM] = (block.end || '17:00').split(':').map(Number)
        let current = startH * 60 + startM
        const end = endH * 60 + endM
        while (current + slotDuration <= end) {
          const time = `${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`
          const endTimeMinutes = current + slotDuration
          const endTimeStr = `${Math.floor(endTimeMinutes / 60).toString().padStart(2, '0')}:${(endTimeMinutes % 60).toString().padStart(2, '0')}`
          slots.push({ startTime: time, endTime: endTimeStr, available: !bookedSlots.has(time) })
          current += slotDuration
        }
      })
    }
    res.json({ data: slots })
  } catch (error) { next(error) }
})

router.get('/departments', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      include: { _count: { select: { doctors: true } } },
    })
    res.json({ data: departments })
  } catch (error) { next(error) }
})

router.post('/book', async (req, res, next) => {
  try {
    const { doctorId, date, startTime, patientName, patientPhone, patientEmail, reason, type } = req.body
    let patient = await prisma.patient.findFirst({ where: { user: { phone: patientPhone } }, include: { user: true } })
    if (!patient) {
      const { hashPassword, generateSecurePassword } = require('../utils/password')
      const user = await prisma.user.create({
        data: { name: patientName, phone: patientPhone, email: patientEmail || `${patientPhone}@patient.local`, password: await hashPassword(generateSecurePassword()), role: 'PATIENT' },
      })
      patient = await prisma.patient.create({ data: { userId: user.id }, include: { user: true } })
    }
    const slotDuration = 30
    const [h, m] = startTime.split(':').map(Number)
    const endMinutes = h * 60 + m + slotDuration
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`
    const bookingDate = new Date(date)
    const nextDay = new Date(bookingDate.getTime() + 86400000)
    const maxToken = await prisma.appointment.aggregate({ _max: { tokenNumber: true }, where: { date: { gte: bookingDate, lt: nextDay } } })
    const tokenNumber = (maxToken._max.tokenNumber || 0) + 1
    const appointment = await prisma.appointment.create({
      data: { patientId: patient.id, doctorId, date: bookingDate, startTime, endTime, type: type || 'CONSULTATION', status: 'SCHEDULED', reason, tokenNumber },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })
    res.status(201).json({ data: { appointment, tokenNumber } })
  } catch (error) { next(error) }
})

export default router
