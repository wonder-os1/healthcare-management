import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Base queries for all roles
    const [
      totalPatients,
      totalDoctors,
      todayAppointments,
      todayCompleted,
      todayCancelled,
      monthlyRevenue,
      lastMonthRevenue,
      pendingPayments,
      totalAppointmentsThisMonth,
      recentAppointments,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'CANCELLED',
        },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: thisMonthStart },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { total: true },
      }),
      prisma.appointment.count({
        where: { date: { gte: thisMonthStart } },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: today } },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 10,
      }),
    ])

    const currentMonthRev = monthlyRevenue._sum.total || 0
    const lastMonthRev = lastMonthRevenue._sum.total || 0
    const revenueGrowth = lastMonthRev > 0 ? Math.round(((currentMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        todayAppointments,
        todayCompleted,
        todayCancelled,
        monthlyRevenue: currentMonthRev,
        lastMonthRevenue: lastMonthRev,
        revenueGrowth,
        pendingPayments: pendingPayments._sum.total || 0,
        totalAppointmentsThisMonth,
        recentAppointments,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as dashboardRoutes }
